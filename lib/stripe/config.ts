import "server-only";

import { StripeConfigError } from "@/lib/stripe/errors";

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

/**
 * Returns the server-only Stripe secret key.
 * Called lazily when the Stripe client is first accessed.
 */
export function getStripeSecretKey(): string {
  const secretKey = readEnv("STRIPE_SECRET_KEY");

  if (!secretKey) {
    throw new StripeConfigError(
      "Missing Stripe configuration. Set STRIPE_SECRET_KEY.",
    );
  }

  if (!secretKey.startsWith("sk_")) {
    throw new StripeConfigError("Invalid Stripe secret key configuration.");
  }

  return secretKey;
}

/**
 * Optional webhook signing secret for future webhook tasks.
 * Not required for application startup or this foundation task.
 */
export function getStripeWebhookSecret(): string | null {
  return readEnv("STRIPE_WEBHOOK_SECRET");
}

/**
 * Publishable key for future client-side Stripe.js tasks.
 * Not used by the server foundation.
 */
export function getStripePublishableKey(): string | null {
  return readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
