import "server-only";

import type { SubscriptionStatus } from "@/lib/supabase/types";

/**
 * Maps raw Stripe subscription status to IMMIFIN application subscription status.
 * Capability behavior is resolved elsewhere — this is billing-state normalization only.
 */
export function normalizeStripeSubscriptionStatus(
  stripeStatus: string | null | undefined,
): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "past_due";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "inactive";
    default:
      return "inactive";
  }
}
