import {
  formatBillingDate,
  formatBillingIntervalLabel,
  formatPlanLabel,
  type BillingCenterAction,
  type BillingSummary,
} from "@/lib/billing/billing-center";
import { formatPricePerPeriod } from "@/lib/pricing/pricing-display-catalog";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

/**
 * Scheduled next-cycle changes (S7-BILLING-UX-007).
 * Matches policy: scheduled_downgrade, cancel_at_period_end, scheduled_interval_change.
 * Does NOT include immediate upgrades / month→year.
 */
export function actionRequiresScheduledDowngradeConfirm(
  action: Exclude<BillingCenterAction, { kind: "checkout" }>,
): boolean {
  return (
    action.kind === "downgrade" ||
    action.kind === "cancel" ||
    (action.kind === "interval_change" && action.targetInterval === "monthly")
  );
}

/** Authoritative period end from Stripe-synced billing — never invent dates. */
export function hasAuthoritativePeriodEnd(billing: BillingSummary): boolean {
  if (!billing.currentPeriodEnd) {
    return false;
  }

  return formatBillingDate(billing.currentPeriodEnd) !== "—";
}

export function formatPlanIntervalDisplay(
  tier: SubscriptionTier,
  interval: BillingSummary["billingInterval"] | "monthly" | "annual" | null,
): string {
  const plan = formatPlanLabel(tier);

  if (tier === "free" || !interval) {
    return plan;
  }

  return `${plan} ${formatBillingIntervalLabel(interval)}`;
}

export function formatCatalogPriceLine(
  tier: SubscriptionTier,
  interval: "monthly" | "annual" | null,
): string {
  if (tier === "free" || !interval) {
    return formatPricePerPeriod("free", null);
  }

  return formatPricePerPeriod(tier, interval);
}

export type ScheduledDowngradeViewModel = {
  dialogTitle: string;
  changeTypeLabel: string;
  currentPlanLine: string;
  currentPriceLine: string;
  targetPlanLine: string;
  targetPriceLine: string | null;
  effectiveDateLabel: string;
  benefitRetentionCopy: string;
  startingCopyTitle: string;
  startingPlanLine: string;
  startingPriceLine: string | null;
  noFurtherChargeCopy: string | null;
  autoChangeCopy: string;
  confirmLabel: string;
  dismissLabel: string;
  missingEffectiveDate: boolean;
  /** S7-BILLING-UX-008C — replacing an existing paid schedule with Free. */
  isReplacement: boolean;
  existingScheduledPlanLine: string | null;
  existingScheduledEffectiveLabel: string | null;
  replacementExplanationCopy: string | null;
  paidSubscriptionEndsCopy: string | null;
};

export const SCHEDULED_NO_CHARGE_TODAY_LABEL = "No charge today";
export const SCHEDULED_MISSING_EFFECTIVE_DATE_COPY =
  "We couldn't confirm your billing period end date. Please try again in a moment.";
export const SCHEDULED_DOWNGRADE_SUCCESS_COPY = "Your downgrade is scheduled.";
export const SCHEDULED_PLAN_CHANGE_SUCCESS_COPY = "Your plan change is scheduled.";
export const REPLACE_SCHEDULED_CHANGE_TITLE = "Replace scheduled plan change?";
export const REPLACE_SCHEDULED_CHANGE_SUBTITLE = "You already have a plan change scheduled.";
export const REPLACE_SCHEDULED_CONSEQUENCE_COPY =
  "If you continue, that scheduled change will be replaced with Free.";
export const REPLACE_WITH_FREE_CONFIRM_LABEL = "Replace With Free";
export const SCHEDULED_PAID_SUBSCRIPTION_ENDS_COPY =
  "Your paid subscription will end on that date.";
export const SCHEDULED_NO_CHARGE_TODAY_DETAIL =
  "There will be no charge to your payment method today.";
export const SCHEDULED_STRIPE_MANAGED_COPY =
  "Your subscription changes are securely managed through Stripe.";

export function actionRequiresScheduledPaidToFreeReplacementConfirm(input: {
  action: Exclude<BillingCenterAction, { kind: "checkout" }>;
  billing: BillingSummary;
}): boolean {
  return input.action.kind === "cancel" && Boolean(input.billing.scheduledPlanChange);
}

export function formatScheduledFreeSuccessCopy(input: {
  effectiveAt?: string;
  currentTier: SubscriptionTier;
}): string {
  const dateLabel = formatBillingDate(input.effectiveAt);
  const planName = formatPlanLabel(input.currentTier);

  if (!input.effectiveAt || dateLabel === "—") {
    return `Your downgrade to Free is scheduled. Your ${planName} access remains active until then.`;
  }

  return `Your downgrade to Free is scheduled for ${dateLabel}. Your ${planName} access remains active until then.`;
}

function keepScheduledDestinationLabel(targetTier: "pro" | "power"): string {
  return `Keep ${formatPlanLabel(targetTier)} Scheduled`;
}

function emptyReplacementFields(): Pick<
  ScheduledDowngradeViewModel,
  | "isReplacement"
  | "existingScheduledPlanLine"
  | "existingScheduledEffectiveLabel"
  | "replacementExplanationCopy"
  | "paidSubscriptionEndsCopy"
> {
  return {
    isReplacement: false,
    existingScheduledPlanLine: null,
    existingScheduledEffectiveLabel: null,
    replacementExplanationCopy: null,
    paidSubscriptionEndsCopy: null,
  };
}

export function buildScheduledDowngradeViewModel(input: {
  tier: SubscriptionTier;
  billing: BillingSummary;
  action: Exclude<BillingCenterAction, { kind: "checkout" }>;
}): ScheduledDowngradeViewModel {
  const { tier, billing, action } = input;
  const effectiveDateLabel = formatBillingDate(billing.currentPeriodEnd);
  const missingEffectiveDate = !hasAuthoritativePeriodEnd(billing);
  const currentPlanName = formatPlanLabel(tier);
  const dismissLabel = `Keep ${currentPlanName}`;

  const currentPlanLine = formatPlanIntervalDisplay(tier, billing.billingInterval);
  const currentPriceLine = formatCatalogPriceLine(
    tier,
    billing.billingInterval === "month"
      ? "monthly"
      : billing.billingInterval === "year"
        ? "annual"
        : null,
  );

  if (action.kind === "cancel") {
    const scheduled = billing.scheduledPlanChange;
    if (scheduled) {
      const existingPlanLine = formatPlanIntervalDisplay(
        scheduled.targetTier,
        scheduled.targetInterval,
      );
      const existingDateLabel = formatBillingDate(scheduled.effectiveAt);
      const replacementEffective = missingEffectiveDate ? existingDateLabel : effectiveDateLabel;

      return {
        dialogTitle: REPLACE_SCHEDULED_CHANGE_TITLE,
        changeTypeLabel: "Replace scheduled plan change",
        currentPlanLine,
        currentPriceLine,
        targetPlanLine: "Free",
        targetPriceLine: formatPricePerPeriod("free", null),
        effectiveDateLabel: replacementEffective,
        benefitRetentionCopy: missingEffectiveDate
          ? `Your ${currentPlanName} plan and features will remain active through the end of your current paid period.`
          : `Your ${currentPlanName} plan and features will remain active through ${replacementEffective}.`,
        startingCopyTitle: missingEffectiveDate
          ? "Starting at the end of your current paid period:"
          : `Starting ${replacementEffective}:`,
        startingPlanLine: "Free",
        startingPriceLine: formatPricePerPeriod("free", null),
        noFurtherChargeCopy: SCHEDULED_PAID_SUBSCRIPTION_ENDS_COPY,
        autoChangeCopy: "There will be one future destination: Free.",
        confirmLabel: REPLACE_WITH_FREE_CONFIRM_LABEL,
        dismissLabel: keepScheduledDestinationLabel(scheduled.targetTier),
        missingEffectiveDate,
        isReplacement: true,
        existingScheduledPlanLine: existingPlanLine,
        existingScheduledEffectiveLabel: existingDateLabel,
        replacementExplanationCopy: missingEffectiveDate
          ? `You currently have ${existingPlanLine} scheduled to begin at the end of your current paid period. If you continue, that scheduled change will be replaced with Free.`
          : `You currently have ${existingPlanLine} scheduled to begin ${existingDateLabel}. If you continue, that scheduled change will be replaced with Free.`,
        paidSubscriptionEndsCopy: SCHEDULED_PAID_SUBSCRIPTION_ENDS_COPY,
      };
    }

    const confirmLabel = missingEffectiveDate
      ? "Schedule Downgrade"
      : `Switch to Free on ${effectiveDateLabel}`;

    return {
      dialogTitle: "Confirm cancellation of paid plan",
      changeTypeLabel: "Scheduled change to Free",
      currentPlanLine,
      currentPriceLine,
      targetPlanLine: "Free",
      targetPriceLine: formatPricePerPeriod("free", null),
      effectiveDateLabel,
      benefitRetentionCopy: missingEffectiveDate
        ? `Your ${currentPlanName} features remain active through the end of your current paid period.`
        : `Your ${currentPlanName} features remain active through ${effectiveDateLabel}.`,
      startingCopyTitle: missingEffectiveDate
        ? "Starting at the end of your current paid period:"
        : `Starting ${effectiveDateLabel}:`,
      startingPlanLine: "Free",
      startingPriceLine: null,
      noFurtherChargeCopy: "You will not be charged again after your current paid period.",
      autoChangeCopy: "Your plan will change automatically on that date.",
      confirmLabel,
      dismissLabel,
      missingEffectiveDate,
      ...emptyReplacementFields(),
    };
  }

  const targetInterval = action.targetInterval;
  const targetPlanLine = formatPlanIntervalDisplay(action.targetTier, targetInterval);
  const targetPriceLine = formatCatalogPriceLine(action.targetTier, targetInterval);

  if (action.kind === "interval_change") {
    return {
      dialogTitle: "Confirm plan change",
      changeTypeLabel: "Scheduled interval change",
      currentPlanLine,
      currentPriceLine,
      targetPlanLine,
      targetPriceLine,
      effectiveDateLabel,
      benefitRetentionCopy: missingEffectiveDate
        ? `Your ${currentPlanName} features remain active through the end of your current paid period.`
        : `Your ${currentPlanName} features remain active through ${effectiveDateLabel}.`,
      startingCopyTitle: missingEffectiveDate
        ? "Starting at the next renewal:"
        : `Starting ${effectiveDateLabel}:`,
      startingPlanLine: targetPlanLine,
      startingPriceLine: targetPriceLine,
      noFurtherChargeCopy: "No refund for unused annual time.",
      autoChangeCopy: "Your plan will change automatically on that date.",
      confirmLabel: "Schedule change",
      dismissLabel,
      missingEffectiveDate,
      ...emptyReplacementFields(),
    };
  }

  // scheduled_downgrade (paid → lower paid)
  return {
    dialogTitle: "Confirm plan change",
    changeTypeLabel: "Scheduled downgrade",
    currentPlanLine,
    currentPriceLine,
    targetPlanLine,
    targetPriceLine,
    effectiveDateLabel,
    benefitRetentionCopy: missingEffectiveDate
      ? `Your ${currentPlanName} features remain active through the end of your current paid period.`
      : `Your ${currentPlanName} features remain active through ${effectiveDateLabel}.`,
    startingCopyTitle: missingEffectiveDate
      ? "Starting at the end of your current paid period:"
      : `Starting ${effectiveDateLabel}:`,
    startingPlanLine: targetPlanLine,
    startingPriceLine: targetPriceLine,
    noFurtherChargeCopy: null,
    autoChangeCopy: "Your plan will change automatically on that date.",
    confirmLabel: "Schedule downgrade",
    dismissLabel,
    missingEffectiveDate,
    ...emptyReplacementFields(),
  };
}
