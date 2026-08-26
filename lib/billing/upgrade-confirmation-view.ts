import { formatPlanLabel } from "@/lib/billing/billing-center";
import type {
  SubscriptionChangePreviewPlan,
  SubscriptionChangePreviewResult,
} from "@/lib/stripe/subscription-change-preview.types";
import type { BillingCenterAction } from "@/lib/billing/billing-center";

/**
 * Immediate paid upgrades (and month→year) require Stripe invoice preview (UX-006).
 */
export function actionRequiresInvoicePreview(
  action: Exclude<BillingCenterAction, { kind: "checkout" }>,
): boolean {
  return (
    action.kind === "upgrade" ||
    (action.kind === "interval_change" && action.targetInterval === "annual")
  );
}

export function normalizeStripeCurrencyCode(currency: string): string {
  const trimmed = currency.trim().toUpperCase();
  return trimmed.length === 3 ? trimmed : "USD";
}

/** Formats Stripe minor units using the invoice currency. No client-side arithmetic beyond abs/sign. */
export function formatStripeMinorAmount(amountMinor: number, currency: string): string {
  const code = normalizeStripeCurrencyCode(currency);
  const normalized = Number.isFinite(amountMinor) ? Math.trunc(amountMinor) : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalized / 100);
}

export function formatSignedStripeMinorAmount(amountMinor: number, currency: string): string {
  const absolute = formatStripeMinorAmount(Math.abs(amountMinor), currency);
  if (amountMinor < 0) {
    return `-${absolute.replace(/^-/, "")}`;
  }
  if (amountMinor > 0) {
    return `+${absolute}`;
  }
  return absolute;
}

export function formatPreviewPlanName(plan: SubscriptionChangePreviewPlan): string {
  const intervalLabel = plan.interval === "year" ? "Annual" : "Monthly";
  return `${formatPlanLabel(plan.tier)} ${intervalLabel}`;
}

export function formatPreviewPlanPrice(plan: SubscriptionChangePreviewPlan, currency: string): string {
  const period = plan.interval === "year" ? "year" : "month";
  return `${formatStripeMinorAmount(plan.amount, currency)}/${period}`;
}

export type UpgradeBillingDetailsMode = "classified" | "line_items" | "amount_only";

export function resolveUpgradeBillingDetailsMode(
  preview: SubscriptionChangePreviewResult,
): UpgradeBillingDetailsMode {
  const { creditAmount, proratedChargeAmount, lines } = preview.preview;

  if (creditAmount != null || proratedChargeAmount != null) {
    return "classified";
  }

  if (lines.length > 0) {
    return "line_items";
  }

  return "amount_only";
}

export function getUpgradeConfirmLabel(preview: SubscriptionChangePreviewResult): string {
  const amountDue = preview.preview.amountDue;

  if (amountDue > 0) {
    return `Confirm & Pay ${formatStripeMinorAmount(amountDue, preview.currency)}`;
  }

  return "Confirm Upgrade";
}

export function getUpgradeEffectiveTimingCopy(): string {
  return "Your new plan becomes active after Stripe confirms payment.";
}

export function getUpgradeEntitlementCopy(targetTierLabel: string): string {
  return `Your ${targetTierLabel} features will become available after Stripe confirms the upgrade.`;
}

export function isPreviewExpiredErrorMessage(message: string): boolean {
  return /preview authorization has expired|billing preview expired|expired\. please review/i.test(
    message,
  );
}

export const UPGRADE_PREVIEW_LOADING_COPY = "Preparing your billing preview…";
export const UPGRADE_PREVIEW_FAILURE_COPY =
  "We couldn't prepare your billing preview. Please try again.";
export const UPGRADE_PREVIEW_EXPIRED_REFRESH_COPY =
  "Your billing preview expired. We've refreshed the amounts.";
export const UPGRADE_SUBMITTED_PENDING_COPY =
  "Upgrade submitted. We're confirming your billing with Stripe.";
