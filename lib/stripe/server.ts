import "server-only";

import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/stripe/config";

let stripeClient: Stripe | null = null;

/**
 * Reusable server-only Stripe client (singleton).
 * Lazy-initialized on first access; requires STRIPE_SECRET_KEY.
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}
