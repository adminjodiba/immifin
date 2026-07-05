import { appPlanToSubscriptionTier } from "@/lib/subscription/plan";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { getEffectivePlan } from "@/lib/account/plan";
import type { Profile, Subscription } from "@/lib/supabase/types";

/**
 * Read the effective subscription tier from persisted profile/subscription data.
 * Normalizes missing values to Free.
 */
export function getStoredSubscriptionTier(input: {
  profile: Profile;
  subscription: Subscription | null;
}): SubscriptionTier {
  const plan = getEffectivePlan(input.profile, input.subscription);
  return appPlanToSubscriptionTier(plan);
}
