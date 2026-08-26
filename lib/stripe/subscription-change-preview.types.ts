import type { BillingInterval } from "@/lib/stripe/types";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import type {
  SubscriptionChangePreviewPaymentMethod,
  SubscriptionChangePreviewPaymentMethodStatus,
} from "@/lib/stripe/subscription-change-preview-payment-method";

/**
 * Customer-safe Stripe subscription-change preview response.
 * S7-BILLING-UX-002/003/004 — preview models invoice-now; includes masked PM.
 */
export type SubscriptionChangePreviewPlan = {
  tier: Exclude<SubscriptionTier, "free">;
  interval: BillingInterval;
  /** Approved list price in minor units (cents). */
  amount: number;
};

export type SubscriptionChangePreviewLine = {
  description: string | null;
  amount: number;
  currency: string;
  isProration: boolean;
};

export type SubscriptionChangePreviewFinancials = {
  /** Stripe preview invoice `amount_due` (minor units). */
  amountDue: number;
  creditAmount: number | null;
  proratedChargeAmount: number | null;
  lines: SubscriptionChangePreviewLine[];
};

export type SubscriptionChangePreviewNextRenewal = {
  amount: number;
  date: string;
};

export type { SubscriptionChangePreviewPaymentMethod, SubscriptionChangePreviewPaymentMethodStatus };

export type SubscriptionChangePreviewResult = {
  changeType: "immediate_upgrade";
  billingChargeModel: "invoice_now";
  currentPlan: SubscriptionChangePreviewPlan;
  targetPlan: SubscriptionChangePreviewPlan;
  effectiveTiming: "immediate";
  currency: string;
  preview: SubscriptionChangePreviewFinancials;
  nextRenewal: SubscriptionChangePreviewNextRenewal;
  /**
   * Server-generated Unix seconds mirrored inside `previewAuthorization`.
   * Display-only — execution must not accept a browser-supplied raw timestamp.
   */
  prorationDate: number;
  /**
   * Short-lived HMAC-signed authorization binding profile + target plan + prorationDate.
   * Required by POST /api/stripe/subscription/change for immediate upgrades.
   */
  previewAuthorization: string;
  /** Customer-safe stored payment method, or null when missing/unavailable. */
  paymentMethod: SubscriptionChangePreviewPaymentMethod | null;
  /**
   * present — masked method included
   * missing — no stored method on subscription/customer
   * unavailable — referenced method deleted/unusable (not an infrastructure failure)
   */
  paymentMethodStatus: SubscriptionChangePreviewPaymentMethodStatus;
};
