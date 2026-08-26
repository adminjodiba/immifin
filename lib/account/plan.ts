import type { AppPlan, Profile, Subscription } from "@/lib/supabase/types";

function hasSynchronizedStripeSubscription(subscription: Subscription): boolean {
  return (
    Boolean(subscription.stripe_subscription_id?.trim()) &&
    Boolean(subscription.last_synchronized_at)
  );
}

/**
 * True when Stripe/app billing state is a definitive cancellation / end.
 * Cancel-at-period-end while still active is NOT terminal.
 */
export function isTerminalCanceledSubscription(
  subscription: Pick<Subscription, "stripe_status" | "status">,
): boolean {
  const stripeStatus = subscription.stripe_status?.trim().toLowerCase() ?? "";
  const appStatus = subscription.status?.trim().toLowerCase() ?? "";
  return stripeStatus === "canceled" || appStatus === "canceled";
}

/**
 * Plan to persist during Stripe → Supabase billing sync.
 * Terminal cancellations store Free; active (including cancel-at-period-end) keep catalog tier.
 */
export function resolvePlanForStripeBillingSync(input: {
  stripeStatus: string | null | undefined;
  catalogTier: AppPlan;
}): AppPlan {
  const stripeStatus = input.stripeStatus?.trim().toLowerCase() ?? "";
  if (stripeStatus === "canceled") {
    return "free";
  }
  return input.catalogTier;
}

export function getEffectivePlan(profile: Profile, subscription: Subscription | null): AppPlan {
  if (!subscription) {
    return profile.plan ?? "free";
  }

  if (isTerminalCanceledSubscription(subscription)) {
    return "free";
  }

  if (hasSynchronizedStripeSubscription(subscription)) {
    return subscription.plan ?? "free";
  }

  const stripeStatus = subscription.stripe_status?.trim() ?? null;

  if (
    subscription.stripe_subscription_id?.trim() &&
    (stripeStatus === "active" || stripeStatus === "trialing")
  ) {
    return subscription.plan ?? "free";
  }

  if (subscription.plan) {
    return subscription.plan;
  }

  return profile.plan ?? "free";
}

function isAppPlan(value: unknown): value is AppPlan {
  return value === "free" || value === "pro" || value === "power";
}

/**
 * Stored simulated / persisted plan without Stripe-status normalization.
 * Prefer subscription.plan, then profile.plan. Used by authorized Dev Mode entitlement.
 */
export function getStoredSimulatedPlan(
  profile: Profile,
  subscription: Subscription | null,
): AppPlan {
  if (subscription && isAppPlan(subscription.plan)) {
    return subscription.plan;
  }

  if (isAppPlan(profile.plan)) {
    return profile.plan;
  }

  return "free";
}

/**
 * Entitlement plan given an explicit Dev-simulation flag (no env/auth I/O).
 * When simulation is active, historical Stripe canceled status does not force Free.
 */
export function resolveEntitlementPlan(input: {
  profile: Profile;
  subscription: Subscription | null;
  developmentSimulationActive: boolean;
}): AppPlan {
  if (input.developmentSimulationActive) {
    return getStoredSimulatedPlan(input.profile, input.subscription);
  }

  return getEffectivePlan(input.profile, input.subscription);
}

export function isExecutivePlan(plan: AppPlan): boolean {
  return plan === "pro" || plan === "power";
}
