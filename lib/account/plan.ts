import type { AppPlan, Profile, Subscription } from "@/lib/supabase/types";

function hasSynchronizedStripeSubscription(subscription: Subscription): boolean {
  return (
    Boolean(subscription.stripe_subscription_id?.trim()) &&
    Boolean(subscription.last_synchronized_at)
  );
}

export function getEffectivePlan(profile: Profile, subscription: Subscription | null): AppPlan {
  if (!subscription) {
    return profile.plan ?? "free";
  }

  if (hasSynchronizedStripeSubscription(subscription)) {
    return subscription.plan;
  }

  const stripeStatus = subscription.stripe_status?.trim() ?? null;

  if (
    subscription.stripe_subscription_id?.trim() &&
    (stripeStatus === "active" || stripeStatus === "trialing")
  ) {
    return subscription.plan;
  }

  if (subscription.plan) {
    return subscription.plan;
  }

  return profile.plan ?? "free";
}

export function isExecutivePlan(plan: AppPlan): boolean {
  return plan === "pro" || plan === "power";
}
