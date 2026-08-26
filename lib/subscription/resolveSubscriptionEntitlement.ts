import "server-only";

import {
  getEffectivePlan,
  resolveEntitlementPlan,
} from "@/lib/account/plan";
import { canUseDevSubscriptionTools } from "@/lib/subscription/devSubscriptionAccess";
import { appPlanToSubscriptionTier } from "@/lib/subscription/plan";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import type { AppPlan, Profile, Subscription } from "@/lib/supabase/types";

export type SubscriptionEntitlement = {
  plan: AppPlan;
  tier: SubscriptionTier;
  /** True when authorized Dev Subscription Mode uses stored simulated plan. */
  developmentSimulationActive: boolean;
};

/**
 * Authenticated entitlement authority.
 *
 * - Authorized Dev Subscription Mode test user (non-production): stored simulated plan
 *   overrides historical Stripe billing status for entitlement only.
 * - Everyone else: normal `getEffectivePlan` (canceled Stripe → Free, etc.).
 *
 * Keep `lib/account/plan.ts` free of Clerk/env checks; eligibility lives in
 * `canUseDevSubscriptionTools`.
 */
export function resolveSubscriptionEntitlement(input: {
  profile: Profile;
  subscription: Subscription | null;
  clerkUserId: string | null | undefined;
}): SubscriptionEntitlement {
  const developmentSimulationActive = canUseDevSubscriptionTools(input.clerkUserId);
  const plan = resolveEntitlementPlan({
    profile: input.profile,
    subscription: input.subscription,
    developmentSimulationActive,
  });

  return {
    plan,
    tier: appPlanToSubscriptionTier(plan),
    developmentSimulationActive,
  };
}

/** Re-export for callers that only need the production-safe path name. */
export { getEffectivePlan };
