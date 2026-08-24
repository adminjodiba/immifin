import "server-only";

import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/stripe/config";

let stripeClient: Stripe | null = null;

/**
 * Reusable server-only Stripe client (singleton).
 * Lazy-initialized on first access; requires STRIPE_SECRET_KEY.
 *
 * Explicit FetchHttpClient (S7-OPS-STRIPE-029): OpenNext/Workers resolve Stripe's
 * Node entry by default (NodeHttpClient), which hangs on outbound Stripe API calls
 * in the Cloudflare Worker. Fetch transport works on Workers and modern Node.
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
      httpClient: Stripe.createFetchHttpClient(),
    });
  }

  return stripeClient;
}
