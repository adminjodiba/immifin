import "server-only";

import { StripeCheckoutError } from "@/lib/stripe/errors";
import { isStripePaidTier } from "@/lib/stripe/catalog";
import type { BillingInterval, StripePaidTier } from "@/lib/stripe/types";

export const CHECKOUT_BILLING_INTERVALS = ["monthly", "annual"] as const;

export type CheckoutBillingInterval = (typeof CHECKOUT_BILLING_INTERVALS)[number];

const ALLOWED_BODY_KEYS = new Set(["tier", "interval"]);

const FORBIDDEN_BODY_KEYS = [
  "priceId",
  "price_id",
  "customerId",
  "customer_id",
  "successUrl",
  "success_url",
  "cancelUrl",
  "cancel_url",
  "userId",
  "user_id",
  "clerkUserId",
  "clerk_user_id",
  "plan",
  "status",
] as const;

export type ParsedCheckoutRequest = {
  tier: StripePaidTier;
  interval: CheckoutBillingInterval;
  billingInterval: BillingInterval;
};

export function checkoutIntervalToBillingInterval(
  interval: CheckoutBillingInterval,
): BillingInterval {
  return interval === "monthly" ? "month" : "year";
}

function isCheckoutBillingInterval(value: unknown): value is CheckoutBillingInterval {
  return value === "monthly" || value === "annual";
}

/**
 * Validates the Checkout request body.
 * Accepts only tier + interval — never authoritative Stripe or redirect fields.
 */
export function parseCheckoutRequest(body: unknown): ParsedCheckoutRequest {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw new StripeCheckoutError("Invalid request body.");
  }

  const record = body as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (!ALLOWED_BODY_KEYS.has(key)) {
      throw new StripeCheckoutError(`Unexpected field: ${key}`);
    }
  }

  for (const forbiddenKey of FORBIDDEN_BODY_KEYS) {
    if (forbiddenKey in record) {
      throw new StripeCheckoutError(`Field is not allowed: ${forbiddenKey}`);
    }
  }

  if (typeof record.tier !== "string") {
    throw new StripeCheckoutError("tier is required.");
  }

  if (typeof record.interval !== "string") {
    throw new StripeCheckoutError("interval is required.");
  }

  const tier = record.tier.trim().toLowerCase();

  if (tier === "free") {
    throw new StripeCheckoutError("Checkout cannot be started for the Free tier.");
  }

  if (!isStripePaidTier(tier)) {
    throw new StripeCheckoutError("Invalid tier. Use pro or power.");
  }

  const interval = record.interval.trim().toLowerCase();

  if (!isCheckoutBillingInterval(interval)) {
    throw new StripeCheckoutError("Invalid interval. Use monthly or annual.");
  }

  return {
    tier,
    interval,
    billingInterval: checkoutIntervalToBillingInterval(interval),
  };
}
