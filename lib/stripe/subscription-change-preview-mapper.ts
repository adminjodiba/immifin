import type Stripe from "stripe";
import type {
  SubscriptionChangePreviewFinancials,
  SubscriptionChangePreviewLine,
  SubscriptionChangePreviewPlan,
  SubscriptionChangePreviewPaymentMethod,
  SubscriptionChangePreviewPaymentMethodStatus,
  SubscriptionChangePreviewResult,
} from "@/lib/stripe/subscription-change-preview.types";

function isProrationLine(line: Stripe.InvoiceLineItem): boolean {
  const parent = line.parent;
  if (!parent) {
    return false;
  }

  if (parent.subscription_item_details?.proration === true) {
    return true;
  }

  if (parent.invoice_item_details?.proration === true) {
    return true;
  }

  return false;
}

/**
 * Maps Stripe invoice preview lines to customer-safe display lines.
 * Never includes Stripe object IDs, price IDs, or invoice internals.
 */
export function mapPreviewInvoiceLines(
  lines: Stripe.InvoiceLineItem[] | undefined,
): SubscriptionChangePreviewLine[] {
  if (!lines?.length) {
    return [];
  }

  return lines.map((line) => ({
    description: line.description ?? null,
    amount: line.amount,
    currency: line.currency,
    isProration: isProrationLine(line),
  }));
}

/**
 * Derives credit / prorated charge from identifiable proration lines only.
 * Returns null semantic totals when no proration lines are present (do not invent).
 */
export function deriveProrationSemanticTotals(lines: SubscriptionChangePreviewLine[]): {
  creditAmount: number | null;
  proratedChargeAmount: number | null;
} {
  const prorationLines = lines.filter((line) => line.isProration);

  if (prorationLines.length === 0) {
    return { creditAmount: null, proratedChargeAmount: null };
  }

  let creditAmount = 0;
  let proratedChargeAmount = 0;
  let hasCredit = false;
  let hasCharge = false;

  for (const line of prorationLines) {
    if (line.amount < 0) {
      creditAmount += line.amount;
      hasCredit = true;
    } else if (line.amount > 0) {
      proratedChargeAmount += line.amount;
      hasCharge = true;
    }
  }

  return {
    creditAmount: hasCredit ? creditAmount : null,
    proratedChargeAmount: hasCharge ? proratedChargeAmount : null,
  };
}

export function mapStripeInvoiceToPreviewFinancials(
  invoice: Stripe.Invoice,
): SubscriptionChangePreviewFinancials {
  const lines = mapPreviewInvoiceLines(invoice.lines?.data);
  const { creditAmount, proratedChargeAmount } = deriveProrationSemanticTotals(lines);

  return {
    amountDue: invoice.amount_due,
    creditAmount,
    proratedChargeAmount,
    lines,
  };
}

export function buildSubscriptionChangePreviewResult(input: {
  currentPlan: SubscriptionChangePreviewPlan;
  targetPlan: SubscriptionChangePreviewPlan;
  currency: string;
  invoice: Stripe.Invoice;
  nextRenewalDate: string;
  prorationDate: number;
  previewAuthorization: string;
  paymentMethod: SubscriptionChangePreviewPaymentMethod | null;
  paymentMethodStatus: SubscriptionChangePreviewPaymentMethodStatus;
}): SubscriptionChangePreviewResult {
  return {
    changeType: "immediate_upgrade",
    billingChargeModel: "invoice_now",
    currentPlan: input.currentPlan,
    targetPlan: input.targetPlan,
    effectiveTiming: "immediate",
    currency: input.currency,
    preview: mapStripeInvoiceToPreviewFinancials(input.invoice),
    nextRenewal: {
      amount: input.targetPlan.amount,
      date: input.nextRenewalDate,
    },
    prorationDate: input.prorationDate,
    previewAuthorization: input.previewAuthorization,
    paymentMethod: input.paymentMethod,
    paymentMethodStatus: input.paymentMethodStatus,
  };
}