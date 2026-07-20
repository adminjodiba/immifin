import "server-only";

import type Stripe from "stripe";
import { handleCheckoutSessionCompleted } from "@/lib/stripe/handlers/checkout-completed";
import { handleSubscriptionCreated } from "@/lib/stripe/handlers/subscription-created";
import { handleSubscriptionDeleted } from "@/lib/stripe/handlers/subscription-deleted";
import { handleSubscriptionUpdated } from "@/lib/stripe/handlers/subscription-updated";

export type StripeWebhookDispatchResult = {
  handled: boolean;
  ignored: boolean;
};

export async function dispatchStripeWebhookEvent(
  event: Stripe.Event,
): Promise<StripeWebhookDispatchResult> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event);
      return { handled: true, ignored: false };
    case "customer.subscription.created":
      await handleSubscriptionCreated(event);
      return { handled: true, ignored: false };
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event);
      return { handled: true, ignored: false };
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event);
      return { handled: true, ignored: false };
    default:
      console.log("[stripe-webhook] ignored event:", event.type);
      return { handled: false, ignored: true };
  }
}
