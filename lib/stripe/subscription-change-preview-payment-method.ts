import type Stripe from "stripe";
import { extractStripeId } from "@/lib/stripe/stripe-ids";

/**
 * Customer-safe payment method summary for upgrade preview (S7-BILLING-UX-004).
 * Never includes Stripe PaymentMethod IDs, PAN, or CVC.
 */
export type SubscriptionChangePreviewPaymentMethod = {
  type: string;
  displayLabel: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
};

export type SubscriptionChangePreviewPaymentMethodStatus =
  | "present"
  | "missing"
  | "unavailable";

export type ResolvedPreviewPaymentMethod = {
  paymentMethod: SubscriptionChangePreviewPaymentMethod | null;
  paymentMethodStatus: SubscriptionChangePreviewPaymentMethodStatus;
};

function titleCaseBrand(brand: string): string {
  const normalized = brand.trim().toLowerCase();
  if (!normalized) {
    return "Card";
  }
  if (normalized === "visa") return "Visa";
  if (normalized === "mastercard") return "Mastercard";
  if (normalized === "amex" || normalized === "american_express") return "Amex";
  if (normalized === "discover") return "Discover";
  if (normalized === "diners" || normalized === "diners_club") return "Diners";
  if (normalized === "jcb") return "JCB";
  if (normalized === "unionpay") return "UnionPay";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Maps a Stripe PaymentMethod to customer-safe display fields.
 * IMMIFIN commercial scope is card-first; non-card types degrade safely.
 */
export function mapStripePaymentMethodToPreview(
  paymentMethod: Stripe.PaymentMethod,
): SubscriptionChangePreviewPaymentMethod {
  const type = paymentMethod.type?.trim() || "unknown";

  if (type === "card" && paymentMethod.card) {
    const brandRaw = paymentMethod.card.display_brand || paymentMethod.card.brand || "card";
    const brand = brandRaw.trim().toLowerCase();
    const last4 = paymentMethod.card.last4?.trim() || "";
    const brandLabel = titleCaseBrand(brand);
    const displayLabel = last4 ? `${brandLabel} •••• ${last4}` : "Saved card";

    return {
      type: "card",
      brand,
      ...(last4 ? { last4 } : {}),
      ...(typeof paymentMethod.card.exp_month === "number"
        ? { expMonth: paymentMethod.card.exp_month }
        : {}),
      ...(typeof paymentMethod.card.exp_year === "number"
        ? { expYear: paymentMethod.card.exp_year }
        : {}),
      displayLabel,
    };
  }

  if (type === "us_bank_account" && paymentMethod.us_bank_account) {
    const last4 = paymentMethod.us_bank_account.last4?.trim() || "";
    return {
      type: "us_bank_account",
      ...(last4 ? { last4 } : {}),
      displayLabel: last4 ? `Bank account •••• ${last4}` : "Saved bank account",
    };
  }

  if (type === "link") {
    return {
      type: "link",
      displayLabel: "Link",
    };
  }

  return {
    type,
    displayLabel: "Saved payment method",
  };
}

/**
 * Resolves effective payment method ID using Stripe 22.3.1 precedence:
 * 1. subscription.default_payment_method
 * 2. customer.invoice_settings.default_payment_method
 * 3. customer.default_source (legacy Card source only — safe brand/last4 when present)
 */
export function resolveEffectivePaymentMethodReference(input: {
  subscription: Stripe.Subscription;
  customer: Stripe.Customer | null;
}): {
  source: "subscription" | "customer_invoice_settings" | "customer_default_source" | null;
  paymentMethodId: string | null;
  legacyCard: Stripe.Card | null;
} {
  const subPm = input.subscription.default_payment_method;
  if (subPm) {
    if (typeof subPm !== "string") {
      return { source: "subscription", paymentMethodId: subPm.id, legacyCard: null };
    }
    const id = subPm.trim();
    if (id) {
      return { source: "subscription", paymentMethodId: id, legacyCard: null };
    }
  }

  const customerPm = input.customer?.invoice_settings?.default_payment_method;
  if (customerPm) {
    if (typeof customerPm !== "string") {
      return {
        source: "customer_invoice_settings",
        paymentMethodId: customerPm.id,
        legacyCard: null,
      };
    }
    const id = customerPm.trim();
    if (id) {
      return { source: "customer_invoice_settings", paymentMethodId: id, legacyCard: null };
    }
  }

  const defaultSource = input.customer?.default_source;
  if (defaultSource && typeof defaultSource !== "string") {
    if (defaultSource.object === "card") {
      return {
        source: "customer_default_source",
        paymentMethodId: null,
        legacyCard: defaultSource as Stripe.Card,
      };
    }
  }

  return { source: null, paymentMethodId: null, legacyCard: null };
}

export function mapLegacyCardSourceToPreview(
  card: Stripe.Card,
): SubscriptionChangePreviewPaymentMethod {
  const brand = (card.brand || "card").trim().toLowerCase();
  const last4 = card.last4?.trim() || "";
  const brandLabel = titleCaseBrand(brand);
  return {
    type: "card",
    brand,
    ...(last4 ? { last4 } : {}),
    ...(typeof card.exp_month === "number" ? { expMonth: card.exp_month } : {}),
    ...(typeof card.exp_year === "number" ? { expYear: card.exp_year } : {}),
    displayLabel: last4 ? `${brandLabel} •••• ${last4}` : "Saved card",
  };
}

export function extractExpandedPaymentMethod(
  value: string | Stripe.PaymentMethod | null | undefined,
): Stripe.PaymentMethod | null {
  if (!value || typeof value === "string") {
    return null;
  }
  return value;
}

export function paymentMethodIdFromReference(
  value: string | Stripe.PaymentMethod | null | undefined,
): string | null {
  return extractStripeId(value);
}
