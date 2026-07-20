import "server-only";

import type Stripe from "stripe";
import { extractStripeId } from "@/lib/stripe/stripe-ids";

export type ValidatedSubscriptionItem = {
  itemId: string;
  priceId: string;
};

export class SubscriptionItemValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionItemValidationError";
  }
}

/**
 * Validates Beta single-item subscription shape and returns trusted item identifiers.
 */
export function getValidatedSingleSubscriptionItem(
  subscription: Stripe.Subscription,
): ValidatedSubscriptionItem {
  const items = subscription.items?.data ?? [];

  if (items.length !== 1) {
    throw new SubscriptionItemValidationError(
      "Multiple Stripe subscription items are not supported.",
    );
  }

  const item = items[0];

  if (item.quantity != null && item.quantity !== 1) {
    throw new SubscriptionItemValidationError(
      "Stripe subscription quantity greater than one is not supported.",
    );
  }

  const itemId = item.id?.trim();
  const priceId = extractStripeId(item.price);

  if (!itemId) {
    throw new SubscriptionItemValidationError("Stripe subscription item is missing an ID.");
  }

  if (!priceId) {
    throw new SubscriptionItemValidationError("Stripe subscription item is missing a price.");
  }

  return { itemId, priceId };
}
