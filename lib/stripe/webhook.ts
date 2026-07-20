import "server-only";

import Stripe from "stripe";
import { getStripeWebhookSecret } from "@/lib/stripe/config";
import {
  StripeWebhookConfigError,
  StripeWebhookSignatureError,
} from "@/lib/stripe/errors";

/**
 * Verifies a Stripe webhook payload using the raw body and Stripe-Signature header.
 * Must be called before trusting any parsed event data.
 */
export function verifyStripeWebhookPayload(
  rawBody: string,
  signatureHeader: string | null,
): Stripe.Event {
  const signature = signatureHeader?.trim();

  if (!signature) {
    throw new StripeWebhookSignatureError("Missing Stripe signature.");
  }

  const webhookSecret = getStripeWebhookSecret();

  if (!webhookSecret) {
    throw new StripeWebhookConfigError("Stripe webhook processing is not configured.");
  }

  try {
    return Stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    throw new StripeWebhookSignatureError("Invalid Stripe webhook signature.");
  }
}
