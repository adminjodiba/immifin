import "server-only";

import type Stripe from "stripe";
import { assertApprovedStripePriceId, resolveApprovedStripePriceId } from "@/lib/stripe/catalog";
import { StripeCatalogError, StripeSubscriptionChangeError } from "@/lib/stripe/errors";
import type { ParsedSubscriptionChangeRequest } from "@/lib/stripe/subscription-change-request";
import {
  evaluateSubscriptionChangePolicy,
  type SubscriptionChangeType,
} from "@/lib/stripe/subscription-change-policy";
import {
  assertNoConflictingScheduleForImmediateChange,
  getSubscriptionEffectiveAtIso,
  scheduleSubscriptionPriceChangeAtPeriodEnd,
} from "@/lib/stripe/subscription-schedule";
import { getValidatedSingleSubscriptionItem, SubscriptionItemValidationError } from "@/lib/stripe/subscription-items";
import { getStripeClient } from "@/lib/stripe/server";
import type { BillingInterval } from "@/lib/stripe/types";
import type { Profile, Subscription } from "@/lib/supabase/types";

export type SubscriptionChangeResult = {
  status: "pending_confirmation" | "scheduled";
  changeType: Exclude<SubscriptionChangeType, "no_change" | "forbidden">;
  effectiveAt?: string;
};

const MANAGEABLE_STRIPE_STATUSES = new Set(["active", "trialing", "past_due"]);

function assertPaidSubscriptionRecord(subscription: Subscription | null): Subscription {
  if (!subscription) {
    throw new StripeSubscriptionChangeError("No subscription record found.", 404);
  }

  if (subscription.plan !== "pro" && subscription.plan !== "power") {
    throw new StripeSubscriptionChangeError(
      "Subscription changes are only available for paid plans.",
      409,
    );
  }

  if (!subscription.stripe_subscription_id?.trim()) {
    throw new StripeSubscriptionChangeError(
      "Subscription is missing a Stripe subscription mapping.",
      409,
    );
  }

  if (!subscription.stripe_customer_id?.trim()) {
    throw new StripeSubscriptionChangeError(
      "Subscription is missing a Stripe customer mapping.",
      409,
    );
  }

  if (subscription.status === "canceled" || subscription.status === "inactive") {
    throw new StripeSubscriptionChangeError(
      "Canceled subscriptions cannot be changed through this endpoint.",
      409,
    );
  }

  return subscription;
}

function resolveCurrentBillingInterval(subscription: Subscription): BillingInterval {
  if (subscription.billing_interval === "month" || subscription.billing_interval === "year") {
    return subscription.billing_interval;
  }

  throw new StripeSubscriptionChangeError(
    "Subscription billing interval is missing or invalid.",
    409,
  );
}

function resolveCurrentCatalogEntry(subscription: Subscription) {
  const priceId = subscription.stripe_price_id?.trim();

  if (!priceId) {
    throw new StripeSubscriptionChangeError(
      "Subscription is missing an approved Stripe price mapping.",
      409,
    );
  }

  try {
    return assertApprovedStripePriceId(priceId);
  } catch (error) {
    if (error instanceof StripeCatalogError) {
      throw new StripeSubscriptionChangeError(error.message, 409);
    }

    throw error;
  }
}

function assertManageableStripeSubscription(subscription: Stripe.Subscription): void {
  const stripeStatus = subscription.status?.trim();

  if (!stripeStatus || !MANAGEABLE_STRIPE_STATUSES.has(stripeStatus)) {
    throw new StripeSubscriptionChangeError(
      "Stripe subscription is not in a manageable state.",
      409,
    );
  }
}

function mapPolicyResultToHttpError(
  changeType: "no_change" | "forbidden",
  reason?: string,
): never {
  if (changeType === "no_change") {
    throw new StripeSubscriptionChangeError(reason ?? "No subscription change is required.", 409);
  }

  throw new StripeSubscriptionChangeError(
    reason ?? "Requested subscription change is not supported.",
    400,
  );
}

async function executeImmediateUpgrade(input: {
  stripeSubscription: Stripe.Subscription;
  targetPriceId: string;
}): Promise<SubscriptionChangeResult> {
  assertNoConflictingScheduleForImmediateChange(input.stripeSubscription);

  const { itemId } = getValidatedSingleSubscriptionItem(input.stripeSubscription);
  const stripe = getStripeClient();

  const updatedSubscription = await stripe.subscriptions.update(input.stripeSubscription.id, {
    items: [
      {
        id: itemId,
        price: input.targetPriceId,
        quantity: 1,
      },
    ],
    proration_behavior: "create_prorations",
    payment_behavior: "pending_if_incomplete",
  });

  if (
    updatedSubscription.status === "incomplete" ||
    updatedSubscription.status === "past_due"
  ) {
    return {
      status: "pending_confirmation",
      changeType: "immediate_upgrade",
    };
  }

  return {
    status: "pending_confirmation",
    changeType: "immediate_upgrade",
  };
}

async function executeCancelAtPeriodEnd(
  stripeSubscription: Stripe.Subscription,
): Promise<SubscriptionChangeResult> {
  const effectiveAt = getSubscriptionEffectiveAtIso(stripeSubscription);

  if (stripeSubscription.cancel_at_period_end) {
    return {
      status: "scheduled",
      changeType: "cancel_at_period_end",
      effectiveAt,
    };
  }

  const stripe = getStripeClient();

  await stripe.subscriptions.update(stripeSubscription.id, {
    cancel_at_period_end: true,
  });

  return {
    status: "scheduled",
    changeType: "cancel_at_period_end",
    effectiveAt,
  };
}

async function executeRetainPaidSubscription(
  stripeSubscription: Stripe.Subscription,
): Promise<SubscriptionChangeResult> {
  if (!stripeSubscription.cancel_at_period_end) {
    return {
      status: "pending_confirmation",
      changeType: "retain_paid_subscription",
    };
  }

  const stripe = getStripeClient();

  await stripe.subscriptions.update(stripeSubscription.id, {
    cancel_at_period_end: false,
  });

  return {
    status: "pending_confirmation",
    changeType: "retain_paid_subscription",
  };
}

export type ExecutePaidSubscriptionChangeInput = {
  profile: Profile;
  subscription: Subscription | null;
  request: ParsedSubscriptionChangeRequest;
};

/**
 * Applies an approved paid-subscription change against the user's existing Stripe subscription.
 * Does not mutate local billing state or capabilities — webhooks remain authoritative.
 */
export async function executePaidSubscriptionChange(
  input: ExecutePaidSubscriptionChangeInput,
): Promise<SubscriptionChangeResult> {
  const subscription = assertPaidSubscriptionRecord(input.subscription);
  const currentTier = subscription.plan;
  const currentInterval = resolveCurrentBillingInterval(subscription);
  const currentCatalogEntry = resolveCurrentCatalogEntry(subscription);

  if (
    currentCatalogEntry.tier !== currentTier ||
    currentCatalogEntry.interval !== currentInterval
  ) {
    throw new StripeSubscriptionChangeError(
      "Trusted subscription billing state is inconsistent.",
      409,
    );
  }

  const stripeSubscriptionId = subscription.stripe_subscription_id!;
  const stripe = getStripeClient();

  let stripeSubscription: Stripe.Subscription;

  try {
    stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  } catch {
    throw new StripeSubscriptionChangeError("Unable to retrieve Stripe subscription.", 502);
  }

  assertManageableStripeSubscription(stripeSubscription);

  let validatedStripeItem;

  try {
    validatedStripeItem = getValidatedSingleSubscriptionItem(stripeSubscription);
  } catch (error) {
    if (error instanceof SubscriptionItemValidationError) {
      throw new StripeSubscriptionChangeError(error.message, 409);
    }

    throw error;
  }

  if (validatedStripeItem.priceId !== currentCatalogEntry.priceId) {
    throw new StripeSubscriptionChangeError(
      "Stripe subscription price does not match trusted local billing state.",
      409,
    );
  }

  const policy = evaluateSubscriptionChangePolicy({
    currentTier,
    currentInterval,
    targetTier: input.request.targetTier,
    targetInterval: input.request.targetBillingInterval,
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end ?? false,
  });

  if (policy.changeType === "no_change" || policy.changeType === "forbidden") {
    mapPolicyResultToHttpError(policy.changeType, policy.reason);
  }

  if (policy.changeType === "cancel_at_period_end") {
    return executeCancelAtPeriodEnd(stripeSubscription);
  }

  if (policy.changeType === "retain_paid_subscription") {
    return executeRetainPaidSubscription(stripeSubscription);
  }

  const targetTier = input.request.targetTier;

  if (targetTier !== "pro" && targetTier !== "power") {
    throw new StripeSubscriptionChangeError("Invalid paid target tier.", 400);
  }

  if (!input.request.targetBillingInterval) {
    throw new StripeSubscriptionChangeError(
      "targetInterval is required for Pro and Power targets.",
      400,
    );
  }

  const targetPriceId = resolveApprovedStripePriceId(targetTier, input.request.targetBillingInterval);
  const effectiveAt = getSubscriptionEffectiveAtIso(stripeSubscription);

  if (policy.changeType === "immediate_upgrade") {
    return executeImmediateUpgrade({
      stripeSubscription,
      targetPriceId,
    });
  }

  if (
    policy.changeType === "scheduled_downgrade" ||
    policy.changeType === "scheduled_interval_change"
  ) {
    await scheduleSubscriptionPriceChangeAtPeriodEnd({
      subscription: stripeSubscription,
      currentPriceId: currentCatalogEntry.priceId,
      targetPriceId,
    });

    return {
      status: "scheduled",
      changeType: policy.changeType,
      effectiveAt,
    };
  }

  throw new StripeSubscriptionChangeError("Unsupported subscription change.", 400);
}
