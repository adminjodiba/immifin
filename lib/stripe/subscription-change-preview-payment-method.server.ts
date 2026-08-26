import "server-only";

import Stripe from "stripe";
import { StripeSubscriptionChangeError } from "@/lib/stripe/errors";
import { getStripeClient } from "@/lib/stripe/server";
import { extractStripeId } from "@/lib/stripe/stripe-ids";
import {
  extractExpandedPaymentMethod,
  mapLegacyCardSourceToPreview,
  mapStripePaymentMethodToPreview,
  resolveEffectivePaymentMethodReference,
  type ResolvedPreviewPaymentMethod,
} from "@/lib/stripe/subscription-change-preview-payment-method";

/**
 * Retrieves subscription with minimal expansions for payment-method display.
 * Call count contribution: 1 Stripe request.
 */
export async function retrieveSubscriptionForPreview(
  stripeSubscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();

  try {
    return await stripe.subscriptions.retrieve(stripeSubscriptionId, {
      expand: [
        "default_payment_method",
        "customer",
        "customer.invoice_settings.default_payment_method",
        "customer.default_source",
      ],
    });
  } catch {
    throw new StripeSubscriptionChangeError("Unable to retrieve Stripe subscription.", 502);
  }
}

function asCustomer(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): Stripe.Customer | null {
  if (!value || typeof value === "string") {
    return null;
  }
  if ("deleted" in value && value.deleted) {
    return null;
  }
  return value as Stripe.Customer;
}

async function retrievePaymentMethodById(
  paymentMethodId: string,
): Promise<
  | { ok: true; paymentMethod: Stripe.PaymentMethod }
  | { ok: false; reason: "unavailable" | "transport" }
> {
  const stripe = getStripeClient();

  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return { ok: true, paymentMethod };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.code === "resource_missing" || error.statusCode === 404) {
        console.error("[stripe] preview payment method unavailable:", error.type);
        return { ok: false, reason: "unavailable" };
      }
      console.error("[stripe] preview payment method retrieve failed:", error.type);
      return { ok: false, reason: "transport" };
    }

    console.error("[stripe] preview payment method retrieve unexpected error");
    return { ok: false, reason: "transport" };
  }
}

/**
 * Resolves customer-safe payment method display for upgrade preview.
 *
 * Precedence (Stripe 22.3.1 Subscription docs):
 * 1. subscription.default_payment_method
 * 2. customer.invoice_settings.default_payment_method
 * 3. customer.default_source (legacy Card only)
 *
 * Distinguishes missing vs unavailable vs transport failure (throws 502).
 */
export async function resolvePreviewPaymentMethod(
  subscription: Stripe.Subscription,
): Promise<ResolvedPreviewPaymentMethod> {
  const customer = asCustomer(subscription.customer);
  const expandedSubPm = extractExpandedPaymentMethod(subscription.default_payment_method);

  if (expandedSubPm) {
    return {
      paymentMethod: mapStripePaymentMethodToPreview(expandedSubPm),
      paymentMethodStatus: "present",
    };
  }

  const expandedCustomerPm = extractExpandedPaymentMethod(
    customer?.invoice_settings?.default_payment_method,
  );

  if (expandedCustomerPm && !subscription.default_payment_method) {
    return {
      paymentMethod: mapStripePaymentMethodToPreview(expandedCustomerPm),
      paymentMethodStatus: "present",
    };
  }

  const reference = resolveEffectivePaymentMethodReference({
    subscription,
    customer,
  });

  if (reference.legacyCard) {
    return {
      paymentMethod: mapLegacyCardSourceToPreview(reference.legacyCard),
      paymentMethodStatus: "present",
    };
  }

  if (!reference.paymentMethodId) {
    // Customer may still be unexpanded string — fetch once for invoice default PM.
    const customerId =
      extractStripeId(subscription.customer) ??
      (typeof subscription.customer === "string" ? subscription.customer.trim() : null);

    if (customerId && !customer) {
      const stripe = getStripeClient();
      let fetched: Stripe.Customer;

      try {
        fetched = (await stripe.customers.retrieve(customerId, {
          expand: ["invoice_settings.default_payment_method", "default_source"],
        })) as Stripe.Customer;
      } catch (error) {
        if (error instanceof Stripe.errors.StripeError) {
          console.error("[stripe] preview customer retrieve failed:", error.type);
          throw new StripeSubscriptionChangeError(
            "Unable to resolve the payment method for this subscription.",
            502,
          );
        }
        throw error;
      }

      if ("deleted" in fetched && fetched.deleted) {
        return { paymentMethod: null, paymentMethodStatus: "missing" };
      }

      return resolvePreviewPaymentMethod({
        ...subscription,
        customer: fetched,
      });
    }

    return { paymentMethod: null, paymentMethodStatus: "missing" };
  }

  // Prefer already-expanded objects; otherwise retrieve by ID (+1 call).
  if (reference.source === "subscription" && expandedSubPm) {
    return {
      paymentMethod: mapStripePaymentMethodToPreview(expandedSubPm),
      paymentMethodStatus: "present",
    };
  }

  if (reference.source === "customer_invoice_settings" && expandedCustomerPm) {
    return {
      paymentMethod: mapStripePaymentMethodToPreview(expandedCustomerPm),
      paymentMethodStatus: "present",
    };
  }

  const retrieved = await retrievePaymentMethodById(reference.paymentMethodId);

  if (!retrieved.ok) {
    if (retrieved.reason === "unavailable") {
      return { paymentMethod: null, paymentMethodStatus: "unavailable" };
    }

    throw new StripeSubscriptionChangeError(
      "Unable to resolve the payment method for this subscription.",
      502,
    );
  }

  return {
    paymentMethod: mapStripePaymentMethodToPreview(retrieved.paymentMethod),
    paymentMethodStatus: "present",
  };
}
