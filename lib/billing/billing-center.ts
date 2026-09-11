import {
  checkoutIntervalToBillingInterval,
  scheduledPlanChangeMatchesAction,
  type ScheduledPlanChange,
} from "@/lib/billing/scheduled-plan-change";
import {
  formatPricePerPeriod,
  getDestinationListPriceLabel,
} from "@/lib/pricing/pricing-display-catalog";
import { evaluateSubscriptionChangePolicy } from "@/lib/stripe/subscription-change-policy";
import type { BillingInterval } from "@/lib/stripe/types";
import type { SubscriptionBillingInterval } from "@/lib/supabase/types";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

export type { ScheduledPlanChange } from "@/lib/billing/scheduled-plan-change";

export const BILLING_CENTER_PATH = "/account/billing";

/** Shown when entitlement is paid but there is no Stripe-backed subscription. */
export const BILLING_NOT_BILLED_LABEL = "Not billed";

/** Localhost / Dev Subscription Mode label — never for real Stripe-paid users. */
export const DEVELOPMENT_PLAN_OVERRIDE_LABEL = "Development plan override";

export type BillingSummary = {
  status: string;
  stripeStatus: string | null;
  billingInterval: SubscriptionBillingInterval | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  lastSynchronizedAt: string | null;
  hasPaidStripeSubscription: boolean;
  /** Customer-safe Stripe Subscription Schedule destination, if recognized. */
  scheduledPlanChange?: ScheduledPlanChange | null;
};

/**
 * Paid entitlement (Pro/Power) without a Stripe subscription id —
 * typical Dev Subscription Mode simulation.
 */
export function isEntitlementWithoutStripeBilling(
  tier: SubscriptionTier,
  billing: Pick<BillingSummary, "hasPaidStripeSubscription">,
): boolean {
  return (tier === "pro" || tier === "power") && !billing.hasPaidStripeSubscription;
}

/**
 * Current subscription amount label.
 * Free → catalog $0. Simulated paid (no Stripe) → "Not billed".
 * Stripe-paid → catalog list price for tier + interval.
 */
export function formatCurrentSubscriptionAmount(
  tier: SubscriptionTier,
  billing: Pick<BillingSummary, "billingInterval" | "hasPaidStripeSubscription">,
): string {
  if (tier === "free") {
    return formatPricePerPeriod("free", null);
  }

  if (!billing.hasPaidStripeSubscription) {
    return BILLING_NOT_BILLED_LABEL;
  }

  if (!billing.billingInterval) {
    return BILLING_NOT_BILLED_LABEL;
  }

  return formatPricePerPeriod(tier, billing.billingInterval);
}

export type BillingCenterAction =
  | {
      id: string;
      kind: "upgrade" | "downgrade" | "interval_change" | "cancel";
      label: string;
      description: string;
      /** Destination list price from the display catalog (not an invoice preview). */
      listPriceLabel: string | null;
      timingNote: string | null;
      targetTier: SubscriptionTier;
      targetInterval: "monthly" | "annual" | null;
      variant: "primary" | "secondary" | "danger";
    }
  | {
      id: string;
      kind: "checkout";
      label: string;
      description: string;
      listPriceLabel: string | null;
      timingNote: string | null;
      targetTier: "pro" | "power";
      targetInterval: "monthly" | "annual";
      variant: "primary" | "secondary";
    };

const IMMEDIATE_PRORATION_NOTE = "Stripe may apply prorated charges or credits.";
const SCHEDULED_CHANGE_NOTE = "Effective at the next billing cycle.";

function destinationPriceFor(
  tier: SubscriptionTier,
  interval: "monthly" | "annual" | null,
): string | null {
  if (tier === "free" || interval === null) {
    return null;
  }

  return getDestinationListPriceLabel(tier, interval);
}

export function formatBillingIntervalLabel(
  interval: SubscriptionBillingInterval | BillingInterval | "monthly" | "annual" | null | undefined,
): string {
  if (interval === "month" || interval === "monthly") {
    return "Monthly";
  }

  if (interval === "year" || interval === "annual") {
    return "Annual";
  }

  return "—";
}

export function formatBillingDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatPlanLabel(tier: SubscriptionTier): string {
  if (tier === "pro") {
    return "Pro";
  }

  if (tier === "power") {
    return "Power";
  }

  return "Free";
}

export function formatSubscriptionStatusLabel(status: string | null | undefined): string {
  if (!status) {
    return "Inactive";
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Customer-facing active subscription states. All other stored statuses are non-active. */
export function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return normalized === "active" || normalized === "trialing";
}

export function hasScheduledBillingChange(
  billing: Pick<BillingSummary, "cancelAtPeriodEnd" | "scheduledPlanChange">,
): boolean {
  return billing.cancelAtPeriodEnd || Boolean(billing.scheduledPlanChange);
}

export type ScheduledChangePresentation = {
  destinationLabel: string;
  effectiveLabel: string | null;
  continuesCopy: string;
  canKeepSubscription: boolean;
};

export function getScheduledChangePresentation(
  billing: BillingSummary,
  currentTier: SubscriptionTier,
): ScheduledChangePresentation | null {
  if (!hasScheduledBillingChange(billing)) {
    return null;
  }

  const planLabel = formatPlanLabel(currentTier);
  const continuesCopy = `Your current ${planLabel} access continues until then.`;

  if (billing.cancelAtPeriodEnd) {
    const effective = formatBillingDate(billing.currentPeriodEnd);
    return {
      destinationLabel: "Downgrade to Free",
      effectiveLabel: effective === "—" ? null : effective,
      continuesCopy,
      canKeepSubscription: true,
    };
  }

  const scheduled = billing.scheduledPlanChange;
  if (!scheduled) {
    return null;
  }

  const effective = formatBillingDate(scheduled.effectiveAt);
  return {
    destinationLabel: `${formatPlanLabel(scheduled.targetTier)} ${formatBillingIntervalLabel(scheduled.targetInterval)}`,
    effectiveLabel: effective === "—" ? null : effective,
    continuesCopy,
    canKeepSubscription: false,
  };
}

export function describeScheduledChange(billing: BillingSummary): string {
  if (billing.cancelAtPeriodEnd) {
    const effective = formatBillingDate(billing.currentPeriodEnd);
    return effective === "—"
      ? "Free — scheduled at period end (current plan remains active until then)"
      : `Free on ${effective} (current plan remains active until then)`;
  }

  const scheduled = billing.scheduledPlanChange;
  if (scheduled) {
    const plan = `${formatPlanLabel(scheduled.targetTier)} ${formatBillingIntervalLabel(scheduled.targetInterval)}`;
    const effective = formatBillingDate(scheduled.effectiveAt);
    return effective === "—"
      ? `${plan} — scheduled at period end (current plan remains active until then)`
      : `${plan} on ${effective} (current plan remains active until then)`;
  }

  return "None";
}

/**
 * Builds user-facing Billing Center actions supported by existing Stripe change/checkout APIs.
 *
 * Authority split (BLP-BILL-FIX-001):
 * - Checkout (Free→Paid) only when effective entitlement is Free.
 * - Paid change actions only when a real Stripe subscription exists.
 * - Simulated Pro/Power (Dev Mode, no Stripe id) → no Checkout / no Stripe change CTAs.
 */
export function getBillingCenterActions(input: {
  tier: SubscriptionTier;
  billing: BillingSummary;
}): BillingCenterAction[] {
  const { tier, billing } = input;
  const interval = billing.billingInterval;
  const actions: BillingCenterAction[] = [];

  // Free entitlement → new-subscription Checkout only (never for simulated Pro/Power).
  if (tier === "free") {
    actions.push({
      id: "checkout-pro-monthly",
      kind: "checkout",
      label: "Upgrade to Pro",
      description: "Start a Pro Monthly subscription with Stripe Checkout.",
      listPriceLabel: destinationPriceFor("pro", "monthly"),
      timingNote: null,
      targetTier: "pro",
      targetInterval: "monthly",
      variant: "primary",
    });
    actions.push({
      id: "checkout-power-monthly",
      kind: "checkout",
      label: "Upgrade to Power",
      description: "Start a Power Monthly subscription with Stripe Checkout.",
      listPriceLabel: destinationPriceFor("power", "monthly"),
      timingNote: null,
      targetTier: "power",
      targetInterval: "monthly",
      variant: "secondary",
    });
    return actions;
  }

  // Pro/Power entitlement without Stripe billing — no Free→Paid Checkout, no paid-change APIs.
  if (!billing.hasPaidStripeSubscription) {
    return actions;
  }

  if (billing.cancelAtPeriodEnd) {
    return actions;
  }

  if (tier === "pro" && interval === "month") {
    actions.push({
      id: "upgrade-power-month",
      kind: "upgrade",
      label: "Upgrade to Power Monthly",
      description: "List price for Power Monthly. Not an invoice preview.",
      listPriceLabel: destinationPriceFor("power", "monthly"),
      timingNote: IMMEDIATE_PRORATION_NOTE,
      targetTier: "power",
      targetInterval: "monthly",
      variant: "primary",
    });
    actions.push({
      id: "switch-pro-annual",
      kind: "interval_change",
      label: "Switch to Pro Annual",
      description: "List price for Pro Annual. Not an invoice preview.",
      listPriceLabel: destinationPriceFor("pro", "annual"),
      timingNote: IMMEDIATE_PRORATION_NOTE,
      targetTier: "pro",
      targetInterval: "annual",
      variant: "secondary",
    });
  }

  if (tier === "pro" && interval === "year") {
    actions.push({
      id: "upgrade-power-year",
      kind: "upgrade",
      label: "Upgrade to Power Annual",
      description: "List price for Power Annual. Not an invoice preview.",
      listPriceLabel: destinationPriceFor("power", "annual"),
      timingNote: IMMEDIATE_PRORATION_NOTE,
      targetTier: "power",
      targetInterval: "annual",
      variant: "primary",
    });
    actions.push({
      id: "switch-pro-monthly",
      kind: "interval_change",
      label: "Switch to Pro Monthly",
      description: "List price for Pro Monthly. No refund for unused annual time.",
      listPriceLabel: destinationPriceFor("pro", "monthly"),
      timingNote: SCHEDULED_CHANGE_NOTE,
      targetTier: "pro",
      targetInterval: "monthly",
      variant: "secondary",
    });
  }

  if (tier === "power" && interval === "month") {
    actions.push({
      id: "downgrade-pro-month",
      kind: "downgrade",
      label: "Downgrade to Pro Monthly",
      description: "List price for Pro Monthly. Power access remains until then.",
      listPriceLabel: destinationPriceFor("pro", "monthly"),
      timingNote: SCHEDULED_CHANGE_NOTE,
      targetTier: "pro",
      targetInterval: "monthly",
      variant: "secondary",
    });
    actions.push({
      id: "switch-power-annual",
      kind: "interval_change",
      label: "Switch to Power Annual",
      description: "List price for Power Annual. Not an invoice preview.",
      listPriceLabel: destinationPriceFor("power", "annual"),
      timingNote: IMMEDIATE_PRORATION_NOTE,
      targetTier: "power",
      targetInterval: "annual",
      variant: "secondary",
    });
  }

  if (tier === "power" && interval === "year") {
    actions.push({
      id: "downgrade-pro-year",
      kind: "downgrade",
      label: "Downgrade to Pro Annual",
      description: "List price for Pro Annual. Power access remains until then.",
      listPriceLabel: destinationPriceFor("pro", "annual"),
      timingNote: SCHEDULED_CHANGE_NOTE,
      targetTier: "pro",
      targetInterval: "annual",
      variant: "secondary",
    });
    actions.push({
      id: "switch-power-monthly",
      kind: "interval_change",
      label: "Switch to Power Monthly",
      description: "List price for Power Monthly. No refund for unused annual time.",
      listPriceLabel: destinationPriceFor("power", "monthly"),
      timingNote: SCHEDULED_CHANGE_NOTE,
      targetTier: "power",
      targetInterval: "monthly",
      variant: "secondary",
    });
  }

  if (tier === "pro" || tier === "power") {
    actions.push({
      id: "downgrade-to-free",
      kind: "cancel",
      label: "Downgrade to Free",
      description: "Schedule a transition to the Free plan at the end of your current billing period.",
      listPriceLabel: getDestinationListPriceLabel("free", null),
      timingNote: "Effective at the end of the current billing period.",
      targetTier: "free",
      targetInterval: null,
      variant: "secondary",
    });
  }

  return filterActionsForScheduledPlanChange(tier, billing, actions);
}

function filterActionsForScheduledPlanChange(
  tier: SubscriptionTier,
  billing: BillingSummary,
  actions: BillingCenterAction[],
): BillingCenterAction[] {
  const scheduled = billing.scheduledPlanChange;
  if (!scheduled) {
    return actions;
  }

  return actions.filter((action) => {
    if (
      scheduledPlanChangeMatchesAction({
        scheduled,
        targetTier: action.targetTier,
        targetInterval: action.targetInterval,
      })
    ) {
      return false;
    }

    if (action.kind === "cancel" || action.kind === "checkout") {
      return true;
    }

    if (tier !== "pro" && tier !== "power") {
      return true;
    }

    const currentInterval = billing.billingInterval;
    if (currentInterval !== "month" && currentInterval !== "year") {
      return true;
    }

    const policy = evaluateSubscriptionChangePolicy({
      currentTier: tier,
      currentInterval,
      targetTier: action.targetTier,
      targetInterval: checkoutIntervalToBillingInterval(action.targetInterval),
      cancelAtPeriodEnd: false,
    });

    // Existing execute path 409s immediate upgrades while a schedule is attached.
    if (policy.changeType === "immediate_upgrade") {
      return false;
    }

    // Other scheduled paid changes would update the existing Stripe schedule — out of scope.
    if (
      policy.changeType === "scheduled_downgrade" ||
      policy.changeType === "scheduled_interval_change"
    ) {
      return false;
    }

    return true;
  });
}
