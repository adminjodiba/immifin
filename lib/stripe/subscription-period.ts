import type Stripe from "stripe";
import { stripeTimestampToIso } from "@/lib/stripe/timestamps";

export type StripePeriodTimestampFields = {
  current_period_start?: number | null;
  current_period_end?: number | null;
};

function readPeriodBounds(source: StripePeriodTimestampFields | null | undefined): {
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
} {
  return {
    currentPeriodStart: stripeTimestampToIso(source?.current_period_start),
    currentPeriodEnd: stripeTimestampToIso(source?.current_period_end),
  };
}

/**
 * Resolves billing period bounds from a Stripe Subscription payload.
 *
 * Precedence (Stripe API 2026-06-24.dahlia and later):
 * 1. Primary subscription item (`items.data[0]`) — authoritative when present
 * 2. Subscription-level fields — legacy compatibility for older payloads
 *
 * Each bound is resolved independently; missing values remain null.
 */
export function getSubscriptionPeriodBounds(subscription: Stripe.Subscription): {
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
} {
  const items = subscription.items?.data ?? [];
  const primaryItem = items[0] ?? null;

  const itemPeriod = primaryItem
    ? readPeriodBounds(primaryItem as Stripe.SubscriptionItem & StripePeriodTimestampFields)
    : { currentPeriodStart: null, currentPeriodEnd: null };

  const subscriptionPeriod = readPeriodBounds(
    subscription as Stripe.Subscription & StripePeriodTimestampFields,
  );

  return {
    currentPeriodStart: itemPeriod.currentPeriodStart ?? subscriptionPeriod.currentPeriodStart,
    currentPeriodEnd: itemPeriod.currentPeriodEnd ?? subscriptionPeriod.currentPeriodEnd,
  };
}
