import type Stripe from "stripe";
import { getValidatedSingleSubscriptionItem } from "@/lib/stripe/subscription-items";

export type ImmediateUpgradePaymentInfo = {
  requiresAction: boolean;
  clientSecret?: string;
  hostedInvoiceUrl?: string;
};

export type ImmediateUpgradeOutcome = {
  status: "confirmed" | "requires_action" | "failed";
  changeType: "immediate_upgrade";
  targetTier: "pro" | "power";
  targetInterval: "month" | "year";
  payment: ImmediateUpgradePaymentInfo;
};

function asExpandedInvoice(
  value: string | Stripe.Invoice | null | undefined,
): Stripe.Invoice | null {
  if (!value || typeof value === "string") {
    return null;
  }
  return value;
}

/**
 * Reads actionable payment fields from an expanded latest_invoice.
 * Stripe API 2026-06-24.dahlia: prefer invoice.confirmation_secret.client_secret.
 */
function readActionablePayment(invoice: Stripe.Invoice | null): ImmediateUpgradePaymentInfo {
  const clientSecret = invoice?.confirmation_secret?.client_secret?.trim() || undefined;
  const hostedInvoiceUrl = invoice?.hosted_invoice_url?.trim() || undefined;

  return {
    requiresAction: Boolean(clientSecret || hostedInvoiceUrl),
    ...(clientSecret ? { clientSecret } : {}),
    ...(hostedInvoiceUrl ? { hostedInvoiceUrl } : {}),
  };
}

/**
 * Classifies an immediate-upgrade subscriptions.update result for the client.
 * Does not grant entitlement — webhooks remain authoritative after settlement.
 *
 * With payment_behavior pending_if_incomplete:
 * - pending_update present ⇒ change not applied yet (SCA / payment incomplete)
 * - target price on current item + active/trialing ⇒ applied (confirmed for API response)
 */
export function classifyImmediateUpgradeOutcome(input: {
  subscription: Stripe.Subscription;
  targetPriceId: string;
  targetTier: "pro" | "power";
  targetInterval: "month" | "year";
}): ImmediateUpgradeOutcome {
  const { subscription, targetPriceId, targetTier, targetInterval } = input;
  const invoice = asExpandedInvoice(subscription.latest_invoice);
  const payment = readActionablePayment(invoice);

  if (subscription.pending_update) {
    if (payment.clientSecret || payment.hostedInvoiceUrl) {
      return {
        status: "requires_action",
        changeType: "immediate_upgrade",
        targetTier,
        targetInterval,
        payment: { ...payment, requiresAction: true },
      };
    }

    return {
      status: "failed",
      changeType: "immediate_upgrade",
      targetTier,
      targetInterval,
      payment: { requiresAction: false },
    };
  }

  let appliedPriceId: string | null = null;

  try {
    appliedPriceId = getValidatedSingleSubscriptionItem(subscription).priceId;
  } catch {
    appliedPriceId = null;
  }

  const invoiceStatus = invoice?.status ?? null;
  const amountDue = invoice?.amount_due;
  const amountRemaining = invoice?.amount_remaining;

  const invoiceSettled =
    invoice == null ||
    invoiceStatus === "paid" ||
    (typeof amountDue === "number" && amountDue === 0) ||
    (typeof amountRemaining === "number" && amountRemaining === 0);

  if (
    appliedPriceId === targetPriceId &&
    (subscription.status === "active" || subscription.status === "trialing") &&
    invoiceSettled
  ) {
    return {
      status: "confirmed",
      changeType: "immediate_upgrade",
      targetTier,
      targetInterval,
      payment: { requiresAction: false },
    };
  }

  if (
    appliedPriceId === targetPriceId &&
    (subscription.status === "incomplete" || subscription.status === "past_due") &&
    (payment.clientSecret || payment.hostedInvoiceUrl)
  ) {
    return {
      status: "requires_action",
      changeType: "immediate_upgrade",
      targetTier,
      targetInterval,
      payment: { ...payment, requiresAction: true },
    };
  }

  if (invoiceStatus === "open" && (payment.clientSecret || payment.hostedInvoiceUrl)) {
    return {
      status: "requires_action",
      changeType: "immediate_upgrade",
      targetTier,
      targetInterval,
      payment: { ...payment, requiresAction: true },
    };
  }

  return {
    status: "failed",
    changeType: "immediate_upgrade",
    targetTier,
    targetInterval,
    payment: { requiresAction: false },
  };
}
