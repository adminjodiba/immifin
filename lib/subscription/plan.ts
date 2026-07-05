import type { AppPlan } from "@/lib/supabase/types";
import { isSubscriptionTier, type SubscriptionTier } from "@/lib/subscription/tiers";

/**
 * Maps persisted subscription plan storage to capability tier.
 * Stripe and Development Subscription Mode both write AppPlan values.
 */
export function appPlanToSubscriptionTier(plan: AppPlan | null | undefined): SubscriptionTier {
  if (plan === "power") {
    return "power";
  }

  if (plan === "pro" || plan === "basic") {
    return "pro";
  }

  return "free";
}

export function subscriptionTierToAppPlan(tier: SubscriptionTier): AppPlan {
  return tier;
}

export function normalizeSubscriptionTier(value: unknown): SubscriptionTier {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (isSubscriptionTier(normalized)) {
      return normalized;
    }
  }

  return "free";
}

export function formatSubscriptionPlanLabel(tier: SubscriptionTier): string {
  return tier.toUpperCase();
}
