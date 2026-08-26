import "server-only";

import { siteConfig } from "@/lib/site";
import { BILLING_CENTER_PATH } from "@/lib/billing/billing-center";
import {
  BILLING_PORTAL_PAYMENT_METHOD_QUERY,
  BILLING_PORTAL_PAYMENT_METHOD_UPDATED_VALUE,
} from "@/lib/stripe/billing-portal-return-url.shared";

export {
  BILLING_PORTAL_PAYMENT_METHOD_QUERY,
  BILLING_PORTAL_PAYMENT_METHOD_UPDATED_VALUE,
} from "@/lib/stripe/billing-portal-return-url.shared";

/**
 * Application-controlled origin for Stripe Billing Portal return URLs.
 * Mirrors Checkout origin resolution — never trusts browser-supplied return URLs.
 */
export function getBillingPortalAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return siteConfig.url.replace(/\/$/, "");
}

/**
 * Safe return path after Stripe-hosted payment method management.
 * Query is fixed — no open redirect / no arbitrary URL injection.
 */
export function buildPaymentMethodPortalReturnUrl(origin = getBillingPortalAppOrigin()): string {
  const normalized = origin.replace(/\/$/, "");
  return `${normalized}${BILLING_CENTER_PATH}?${BILLING_PORTAL_PAYMENT_METHOD_QUERY}=${BILLING_PORTAL_PAYMENT_METHOD_UPDATED_VALUE}`;
}

export function isSafeStripeBillingPortalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return (
      host === "billing.stripe.com" ||
      host.endsWith(".billing.stripe.com") ||
      host === "billing.stripe.me" ||
      // Test-mode / regional hosted portal hosts
      host.endsWith(".stripe.com")
    );
  } catch {
    return false;
  }
}
