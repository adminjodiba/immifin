import type { AppPlan, Profile, Subscription } from "@/lib/supabase/types";

export function getEffectivePlan(profile: Profile, subscription: Subscription | null): AppPlan {
  if (subscription?.plan) {
    return subscription.plan;
  }

  return profile.plan ?? "free";
}

export function isExecutivePlan(plan: AppPlan): boolean {
  return plan === "pro" || plan === "power";
}
