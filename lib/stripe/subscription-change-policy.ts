import type { BillingInterval } from "@/lib/stripe/types";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

export const SUBSCRIPTION_CHANGE_TYPES = [
  "immediate_upgrade",
  "scheduled_downgrade",
  "scheduled_interval_change",
  "cancel_at_period_end",
  "retain_paid_subscription",
  "no_change",
  "forbidden",
] as const;

export type SubscriptionChangeType = (typeof SUBSCRIPTION_CHANGE_TYPES)[number];

export type SubscriptionChangePolicyInput = {
  currentTier: "pro" | "power";
  currentInterval: BillingInterval;
  targetTier: SubscriptionTier;
  targetInterval: BillingInterval | null;
  cancelAtPeriodEnd: boolean;
};

export type SubscriptionChangePolicyResult = {
  changeType: SubscriptionChangeType;
  reason?: string;
};

const TIER_RANK: Record<"pro" | "power", number> = {
  pro: 1,
  power: 2,
};

function isSamePaidPlan(
  currentTier: "pro" | "power",
  currentInterval: BillingInterval,
  targetTier: SubscriptionTier,
  targetInterval: BillingInterval | null,
): boolean {
  return targetTier === currentTier && targetInterval === currentInterval;
}

/**
 * Deterministic IMMIFIN billing policy evaluator.
 * Pure — no Stripe or database access.
 */
export function evaluateSubscriptionChangePolicy(
  input: SubscriptionChangePolicyInput,
): SubscriptionChangePolicyResult {
  const { currentTier, currentInterval, targetTier, targetInterval, cancelAtPeriodEnd } = input;

  if (targetTier === "free") {
    if (targetInterval !== null) {
      return {
        changeType: "forbidden",
        reason: "targetInterval must be null when downgrading to Free.",
      };
    }

    if (cancelAtPeriodEnd) {
      return { changeType: "no_change", reason: "Cancellation is already scheduled." };
    }

    return { changeType: "cancel_at_period_end" };
  }

  if (targetInterval === null) {
    return {
      changeType: "forbidden",
      reason: "targetInterval is required for Pro and Power targets.",
    };
  }

  if (isSamePaidPlan(currentTier, currentInterval, targetTier, targetInterval)) {
    if (cancelAtPeriodEnd) {
      return { changeType: "retain_paid_subscription" };
    }

    return { changeType: "no_change", reason: "Subscription is already on the requested plan." };
  }

  if (cancelAtPeriodEnd) {
    return {
      changeType: "forbidden",
      reason: "Plan changes are not allowed while cancellation is scheduled.",
    };
  }

  const currentRank = TIER_RANK[currentTier];
  const targetRank = targetTier === "pro" || targetTier === "power" ? TIER_RANK[targetTier] : 0;

  if (currentInterval === targetInterval) {
    if (targetRank > currentRank) {
      return { changeType: "immediate_upgrade" };
    }

    if (targetRank < currentRank) {
      return { changeType: "scheduled_downgrade" };
    }
  }

  if (currentTier === targetTier && currentInterval === "month" && targetInterval === "year") {
    return { changeType: "immediate_upgrade" };
  }

  if (currentTier === targetTier && currentInterval === "year" && targetInterval === "month") {
    return { changeType: "scheduled_interval_change" };
  }

  return {
    changeType: "forbidden",
    reason: "Cross-tier and cross-interval changes are not supported.",
  };
}
