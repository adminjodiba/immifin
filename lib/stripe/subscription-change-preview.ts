import "server-only";

import Stripe from "stripe";
import { assertApprovedStripePriceId, resolveApprovedStripePriceId } from "@/lib/stripe/catalog";
import { StripeCatalogError, StripeSubscriptionChangeError } from "@/lib/stripe/errors";
import { getPricingDisplayEntry } from "@/lib/pricing/pricing-display-catalog";
import { getStripeClient } from "@/lib/stripe/server";
import type { ParsedSubscriptionChangeRequest } from "@/lib/stripe/subscription-change-request";
import { evaluateSubscriptionChangePolicy } from "@/lib/stripe/subscription-change-policy";
import { assertNoConflictingScheduleForImmediateChange, getSubscriptionEffectiveAtIso } from "@/lib/stripe/subscription-schedule";
import { getValidatedSingleSubscriptionItem, SubscriptionItemValidationError } from "@/lib/stripe/subscription-items";
import { createSubscriptionChangePreviewAuthorization } from "@/lib/stripe/subscription-change-preview-auth";
import { buildSubscriptionChangePreviewResult } from "@/lib/stripe/subscription-change-preview-mapper";
import {
  resolvePreviewPaymentMethod,
  retrieveSubscriptionForPreview,
} from "@/lib/stripe/subscription-change-preview-payment-method.server";
import type { SubscriptionChangePreviewResult } from "@/lib/stripe/subscription-change-preview.types";
import type { BillingInterval } from "@/lib/stripe/types";
import type { Profile, Subscription } from "@/lib/supabase/types";

const MANAGEABLE_STRIPE_STATUSES = new Set(["active", "trialing", "past_due"]);

export type PreviewPaidSubscriptionChangeInput = {
  profile: Profile;
  subscription: Subscription | null;
  request: ParsedSubscriptionChangeRequest;
};

function assertPaidSubscriptionRecord(subscription: Subscription | null): Subscription {
  if (!subscription) {
    throw new StripeSubscriptionChangeError("No subscription record found.", 404);
  }

  if (subscription.plan !== "pro" && subscription.plan !== "power") {
    throw new StripeSubscriptionChangeError(
      "Subscription previews are only available for paid plans.",
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
      "Canceled subscriptions cannot be previewed through this endpoint.",
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
  changeType: "no_change" | "forbidden" | string,
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

function createProrationDateUnix(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Read-only Stripe invoice preview for an approved immediate paid upgrade.
 * Models the future invoice-now execution strategy (`always_invoice`).
 * Does NOT mutate Stripe subscriptions, invoices, payment methods, or local billing state.
 */
export async function previewPaidSubscriptionChange(
  input: PreviewPaidSubscriptionChangeInput,
): Promise<SubscriptionChangePreviewResult> {
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
  const stripeCustomerId = subscription.stripe_customer_id!;
  const stripe = getStripeClient();

  const stripeSubscription = await retrieveSubscriptionForPreview(stripeSubscriptionId);

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

  if (policy.changeType !== "immediate_upgrade") {
    throw new StripeSubscriptionChangeError(
      "Preview is only available for immediate paid upgrades.",
      400,
    );
  }

  assertNoConflictingScheduleForImmediateChange(stripeSubscription);

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
  const prorationDate = createProrationDateUnix();
  const nextRenewalDate = getSubscriptionEffectiveAtIso(stripeSubscription);

  let previewInvoice: Stripe.Invoice;

  try {
    previewInvoice = await stripe.invoices.createPreview({
      customer: stripeCustomerId,
      subscription: stripeSubscriptionId,
      subscription_details: {
        items: [
          {
            id: validatedStripeItem.itemId,
            price: targetPriceId,
            quantity: 1,
          },
        ],
        proration_behavior: "always_invoice",
        proration_date: prorationDate,
      },
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[stripe] subscription preview failed:", error.type);
      throw new StripeSubscriptionChangeError(
        "Unable to preview the subscription change.",
        502,
      );
    }

    throw error;
  }

  const currentDisplay = getPricingDisplayEntry(currentTier, currentInterval);
  const targetDisplay = getPricingDisplayEntry(targetTier, input.request.targetBillingInterval);

  const previewAuthorization = createSubscriptionChangePreviewAuthorization({
    profileId: input.profile.id,
    targetTier,
    targetInterval: input.request.targetBillingInterval,
    prorationDate,
  });

  const { paymentMethod, paymentMethodStatus } =
    await resolvePreviewPaymentMethod(stripeSubscription);

  return buildSubscriptionChangePreviewResult({
    currentPlan: {
      tier: currentTier,
      interval: currentInterval,
      amount: currentDisplay.amountMinor,
    },
    targetPlan: {
      tier: targetTier,
      interval: input.request.targetBillingInterval,
      amount: targetDisplay.amountMinor,
    },
    currency: (previewInvoice.currency ?? currentDisplay.currency ?? "usd").toLowerCase(),
    invoice: previewInvoice,
    nextRenewalDate,
    prorationDate,
    previewAuthorization,
    paymentMethod,
    paymentMethodStatus,
  });
}