import "server-only";

import type Stripe from "stripe";
import { assertApprovedStripePriceId } from "@/lib/stripe/catalog";
import { StripeCatalogError } from "@/lib/stripe/errors";
import { StripeWebhookProcessingError } from "@/lib/stripe/errors";
import { extractStripeId, stripeTimestampToIso } from "@/lib/stripe/stripe-ids";
import { getSubscriptionPeriodBounds } from "@/lib/stripe/subscription-period";
import { normalizeStripeSubscriptionStatus } from "@/lib/stripe/subscription-status";
import { getStripeClient } from "@/lib/stripe/server";
import {
  getProfileWithRelationsByProfileId,
  getSubscriptionByStripeCustomerId,
  getSubscriptionByStripeSubscriptionId,
  syncSubscriptionBillingState,
} from "@/lib/supabase/subscription-billing";
import type { ProfileWithRelations } from "@/lib/supabase/types";

export type SubscriptionSyncContext = {
  profileId?: string | null;
};

export type SubscriptionSyncResult = {
  profileId: string;
  synchronized: true;
};

function wrapCatalogError(error: unknown): never {
  if (error instanceof StripeCatalogError) {
    throw new StripeWebhookProcessingError(error.message, 500, true);
  }

  throw error;
}

async function resolveProfileForSubscription(
  subscription: Stripe.Subscription,
  context: SubscriptionSyncContext = {},
): Promise<ProfileWithRelations> {
  const stripeSubscriptionId = subscription.id?.trim();
  const stripeCustomerId = extractStripeId(subscription.customer);

  if (stripeSubscriptionId) {
    const bySubscription = await getSubscriptionByStripeSubscriptionId(stripeSubscriptionId);

    if (bySubscription) {
      return bySubscription;
    }
  }

  if (stripeCustomerId) {
    const byCustomer = await getSubscriptionByStripeCustomerId(stripeCustomerId);

    if (byCustomer) {
      return byCustomer;
    }
  }

  const profileId = context.profileId?.trim();

  if (profileId) {
    const byProfile = await getProfileWithRelationsByProfileId(profileId);

    if (byProfile) {
      return byProfile;
    }
  }

  throw new StripeWebhookProcessingError(
    "Trusted IMMIFIN profile could not be resolved for Stripe subscription.",
    500,
    true,
  );
}

import { getValidatedSingleSubscriptionItem } from "@/lib/stripe/subscription-items";

/**
 * Synchronizes authoritative Stripe subscription billing state into Supabase.
 * Does not modify capabilities or feature gates.
 */
export async function synchronizeStripeSubscription(
  subscription: Stripe.Subscription,
  context: SubscriptionSyncContext = {},
): Promise<SubscriptionSyncResult> {
  const profileWithRelations = await resolveProfileForSubscription(subscription, context);
  let priceId: string;

  try {
    priceId = getValidatedSingleSubscriptionItem(subscription).priceId;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid subscription items.";
    throw new StripeWebhookProcessingError(message, 500, true);
  }

  let catalogEntry;

  try {
    catalogEntry = assertApprovedStripePriceId(priceId);
  } catch (error) {
    wrapCatalogError(error);
  }

  const stripeCustomerId = extractStripeId(subscription.customer);
  const stripeStatus = subscription.status ?? null;
  const normalizedStatus = normalizeStripeSubscriptionStatus(stripeStatus);
  const synchronizedAt = new Date().toISOString();
  const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriodBounds(subscription);

  await syncSubscriptionBillingState({
    profileId: profileWithRelations.profile.id,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: catalogEntry.priceId,
    billingInterval: catalogEntry.interval,
    stripeStatus,
    plan: catalogEntry.tier,
    status: normalizedStatus,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    canceledAt: stripeTimestampToIso(subscription.canceled_at),
    lastSynchronizedAt: synchronizedAt,
  });

  return {
    profileId: profileWithRelations.profile.id,
    synchronized: true,
  };
}

/**
 * Retrieves the canonical Stripe Subscription when the webhook payload is incomplete.
 */
export async function retrieveStripeSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const normalizedId = subscriptionId.trim();

  if (!normalizedId) {
    throw new StripeWebhookProcessingError("Stripe subscription ID is required.", 500, true);
  }

  try {
    const stripe = getStripeClient();
    return await stripe.subscriptions.retrieve(normalizedId);
  } catch {
    throw new StripeWebhookProcessingError(
      "Unable to retrieve Stripe subscription.",
      502,
      true,
    );
  }
}
