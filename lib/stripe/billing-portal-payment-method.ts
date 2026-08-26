import "server-only";

import Stripe from "stripe";
import { StripeSubscriptionChangeError } from "@/lib/stripe/errors";
import {
  buildPaymentMethodPortalReturnUrl,
  isSafeStripeBillingPortalUrl,
} from "@/lib/stripe/billing-portal-return-url";
import { getStripeClient } from "@/lib/stripe/server";
import type { Profile, Subscription } from "@/lib/supabase/types";

const PORTAL_PURPOSE_METADATA_KEY = "immifin_portal_purpose";
const PORTAL_PURPOSE_PAYMENT_METHOD_ONLY = "payment_method_only";

export type CreatePaymentMethodPortalSessionInput = {
  profile: Profile;
  subscription: Subscription | null;
};

export type CreatePaymentMethodPortalSessionResult = {
  url: string;
};

function assertPaidStripeCustomer(subscription: Subscription | null): string {
  if (!subscription) {
    throw new StripeSubscriptionChangeError("No subscription record found.", 404);
  }

  if (subscription.plan !== "pro" && subscription.plan !== "power") {
    throw new StripeSubscriptionChangeError(
      "Payment method management is only available for paid subscriptions.",
      409,
    );
  }

  const customerId = subscription.stripe_customer_id?.trim();

  if (!customerId) {
    throw new StripeSubscriptionChangeError(
      "Subscription is missing a Stripe customer mapping.",
      409,
    );
  }

  return customerId;
}

/**
 * Ensures a narrow Billing Portal configuration that ONLY allows payment method updates.
 * Prefer STRIPE_BILLING_PORTAL_PM_CONFIGURATION_ID when set; otherwise find/create via API.
 * Does not require Dashboard edits for the happy path.
 */
export async function ensurePaymentMethodOnlyPortalConfigurationId(): Promise<string> {
  const fromEnv = process.env.STRIPE_BILLING_PORTAL_PM_CONFIGURATION_ID?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  const stripe = getStripeClient();

  try {
    const listed = await stripe.billingPortal.configurations.list({ limit: 100, active: true });
    const existing = listed.data.find(
      (configuration) =>
        configuration.metadata?.[PORTAL_PURPOSE_METADATA_KEY] ===
        PORTAL_PURPOSE_PAYMENT_METHOD_ONLY,
    );

    if (existing?.id) {
      return existing.id;
    }

    const created = await stripe.billingPortal.configurations.create({
      name: "IMMIFIN Payment Method Only",
      metadata: {
        [PORTAL_PURPOSE_METADATA_KEY]: PORTAL_PURPOSE_PAYMENT_METHOD_ONLY,
      },
      features: {
        customer_update: { enabled: false },
        invoice_history: { enabled: false },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: false },
        subscription_update: { enabled: false },
      },
    });

    return created.id;
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[stripe] billing portal configuration failed:", error.type);
      throw new StripeSubscriptionChangeError(
        "Unable to prepare Stripe payment method settings. Confirm Billing Portal is available for this Stripe account.",
        502,
      );
    }

    throw error;
  }
}

/**
 * Creates a Stripe-hosted Billing Portal session deep-linked to payment_method_update.
 * Does NOT mutate subscriptions or execute plan upgrades.
 */
export async function createPaymentMethodPortalSession(
  input: CreatePaymentMethodPortalSessionInput,
): Promise<CreatePaymentMethodPortalSessionResult> {
  const customerId = assertPaidStripeCustomer(input.subscription);
  const configurationId = await ensurePaymentMethodOnlyPortalConfigurationId();
  const returnUrl = buildPaymentMethodPortalReturnUrl();
  const stripe = getStripeClient();

  let session: Stripe.BillingPortal.Session;

  try {
    session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      configuration: configurationId,
      return_url: returnUrl,
      flow_data: {
        type: "payment_method_update",
        after_completion: {
          type: "redirect",
          redirect: {
            return_url: returnUrl,
          },
        },
      },
    });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error("[stripe] billing portal session create failed:", error.type);
      throw new StripeSubscriptionChangeError(
        "Unable to open Stripe payment method settings. Please try again.",
        502,
      );
    }

    throw error;
  }

  const url = session.url?.trim();

  if (!url || !isSafeStripeBillingPortalUrl(url)) {
    throw new StripeSubscriptionChangeError(
      "Stripe returned an unexpected payment settings URL.",
      502,
    );
  }

  return { url };
}
