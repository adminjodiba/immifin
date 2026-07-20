import {
  BILLING_CENTER_PATH,
  formatBillingDate,
  formatBillingIntervalLabel,
  formatPlanLabel,
  getBillingCenterActions,
  type BillingCenterAction,
  type BillingSummary,
} from "@/lib/billing/billing-center";
import { formatPricePerPeriod } from "@/lib/pricing/pricing-display-catalog";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

export type PlanChangeTargetInterval = "monthly" | "annual" | null;

export type PlanChangeIntent = {
  targetTier: SubscriptionTier;
  targetInterval: PlanChangeTargetInterval;
};

export type PlanChangeReview = {
  action: Exclude<BillingCenterAction, { kind: "checkout" }>;
  dialogTitle: string;
  changeTypeLabel: string;
  currentPlanLine: string;
  currentPriceLine: string;
  targetPlanLine: string;
  targetPriceLine: string | null;
  timingLabel: string;
  billingNote: string;
  accessExplanation: string | null;
  transitionExplanation: string | null;
  confirmLabel: string;
  dismissLabel: string;
};

const QUERY_TIER = "targetTier";
const QUERY_INTERVAL = "targetInterval";

function isSubscriptionTier(value: string | null): value is SubscriptionTier {
  return value === "free" || value === "pro" || value === "power";
}

function isTargetInterval(value: string | null): value is "monthly" | "annual" {
  return value === "monthly" || value === "annual";
}

/**
 * Builds a safe Pricing → Billing Center handoff URL (intent only).
 */
export function buildBillingChangeHandoffHref(
  targetTier: SubscriptionTier,
  targetInterval: PlanChangeTargetInterval,
): string {
  const params = new URLSearchParams();
  params.set(QUERY_TIER, targetTier);

  if (targetTier !== "free" && targetInterval) {
    params.set(QUERY_INTERVAL, targetInterval);
  }

  return `${BILLING_CENTER_PATH}?${params.toString()}`;
}

/**
 * Parses untrusted query intent. Returns null when malformed.
 */
export function parsePlanChangeIntentFromSearchParams(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): PlanChangeIntent | null {
  const rawTier = searchParams.get(QUERY_TIER);
  if (!rawTier) {
    return null;
  }

  if (!isSubscriptionTier(rawTier)) {
    return null;
  }

  const rawInterval = searchParams.get(QUERY_INTERVAL);

  if (rawTier === "free") {
    if (rawInterval !== null && rawInterval !== "") {
      return null;
    }

    return { targetTier: "free", targetInterval: null };
  }

  if (!isTargetInterval(rawInterval)) {
    return null;
  }

  return { targetTier: rawTier, targetInterval: rawInterval };
}

export function planChangeIntentMatchesAction(
  intent: PlanChangeIntent,
  action: BillingCenterAction,
): boolean {
  if (action.kind === "checkout") {
    return false;
  }

  if (action.targetTier !== intent.targetTier) {
    return false;
  }

  return action.targetInterval === intent.targetInterval;
}

/**
 * Resolves untrusted intent against the Billing Center action matrix.
 */
export function findBillingCenterActionForIntent(input: {
  tier: SubscriptionTier;
  billing: BillingSummary;
  intent: PlanChangeIntent;
}): Exclude<BillingCenterAction, { kind: "checkout" }> | null {
  const actions = getBillingCenterActions({
    tier: input.tier,
    billing: input.billing,
  });

  const match = actions.find((action) => planChangeIntentMatchesAction(input.intent, action));

  if (!match || match.kind === "checkout") {
    return null;
  }

  return match;
}

function formatPlanIntervalLine(
  tier: SubscriptionTier,
  interval: BillingSummary["billingInterval"] | PlanChangeTargetInterval,
): string {
  const plan = formatPlanLabel(tier);

  if (tier === "free" || !interval) {
    return plan;
  }

  return `${plan} ${formatBillingIntervalLabel(interval)}`;
}

function formatCurrentPriceLine(
  tier: SubscriptionTier,
  billingInterval: BillingSummary["billingInterval"],
): string {
  if (tier === "free" || !billingInterval) {
    return formatPricePerPeriod("free", null);
  }

  return formatPricePerPeriod(tier, billingInterval);
}

function formatTargetPriceLine(
  tier: SubscriptionTier,
  interval: PlanChangeTargetInterval,
): string | null {
  if (tier === "free" || !interval) {
    return null;
  }

  return formatPricePerPeriod(tier, interval);
}

function getChangeTypeLabel(
  action: Exclude<BillingCenterAction, { kind: "checkout" }>,
): string {
  switch (action.kind) {
    case "upgrade":
      return "Immediate upgrade";
    case "downgrade":
      return "Scheduled downgrade";
    case "interval_change":
      return action.targetInterval === "monthly"
        ? "Scheduled interval change"
        : "Immediate interval change";
    case "cancel":
      return "Downgrade to Free";
    default:
      return "Plan change";
  }
}

function getTimingAndNote(
  action: Exclude<BillingCenterAction, { kind: "checkout" }>,
  currentTier: SubscriptionTier,
  billing: BillingSummary,
): {
  timingLabel: string;
  billingNote: string;
  accessExplanation: string | null;
  transitionExplanation: string | null;
} {
  if (action.kind === "cancel") {
    const effective = formatBillingDate(billing.currentPeriodEnd);
    const planName = formatPlanLabel(currentTier);

    return {
      timingLabel: effective === "—" ? "End of current billing period" : effective,
      billingNote: `You will continue enjoying all ${planName} features until the end of your current billing period.`,
      accessExplanation: `You will continue enjoying all ${planName} features until the end of your current billing period.`,
      transitionExplanation:
        effective === "—"
          ? "Your account will automatically transition to the Free plan at the end of the current billing period."
          : `On ${effective} your account will automatically transition to the Free plan.`,
    };
  }

  if (action.kind === "upgrade") {
    return {
      timingLabel: "Immediate",
      billingNote: "Stripe may apply prorated charges or credits.",
      accessExplanation: null,
      transitionExplanation: null,
    };
  }

  if (action.kind === "downgrade") {
    return {
      timingLabel: "Effective at the next billing cycle",
      billingNote:
        currentTier === "power"
          ? "Your current Power access remains active until the end of the paid period."
          : "Your current plan remains active until the end of the paid period.",
      accessExplanation: null,
      transitionExplanation: null,
    };
  }

  // interval_change
  if (action.targetInterval === "monthly") {
    return {
      timingLabel: "Effective at the next renewal",
      billingNote: "No refund for unused annual time.",
      accessExplanation: null,
      transitionExplanation: null,
    };
  }

  return {
    timingLabel: "Immediate",
    billingNote: "Stripe may apply prorated charges or credits.",
    accessExplanation: null,
    transitionExplanation: null,
  };
}

export function buildPlanChangeReview(input: {
  tier: SubscriptionTier;
  billing: BillingSummary;
  action: Exclude<BillingCenterAction, { kind: "checkout" }>;
}): PlanChangeReview {
  const { tier, billing, action } = input;
  const timing = getTimingAndNote(action, tier, billing);
  const isFreeDowngrade = action.kind === "cancel";

  return {
    action,
    dialogTitle: isFreeDowngrade ? "Downgrade to Free" : "Confirm plan change",
    changeTypeLabel: getChangeTypeLabel(action),
    currentPlanLine: formatPlanIntervalLine(tier, billing.billingInterval),
    currentPriceLine: formatCurrentPriceLine(tier, billing.billingInterval),
    targetPlanLine: formatPlanIntervalLine(action.targetTier, action.targetInterval),
    targetPriceLine: isFreeDowngrade
      ? formatPricePerPeriod("free", null)
      : formatTargetPriceLine(action.targetTier, action.targetInterval),
    timingLabel: timing.timingLabel,
    billingNote: timing.billingNote,
    accessExplanation: timing.accessExplanation,
    transitionExplanation: timing.transitionExplanation,
    confirmLabel: isFreeDowngrade ? "Schedule Downgrade" : "Confirm",
    dismissLabel: "Keep Current Plan",
  };
}
