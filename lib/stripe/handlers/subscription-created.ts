import "server-only";

import type Stripe from "stripe";
import { synchronizeStripeSubscription } from "@/lib/stripe/subscription-sync";

export async function handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  await synchronizeStripeSubscription(subscription);
}
