import "server-only";

import type Stripe from "stripe";
import { StripeWebhookProcessingError } from "@/lib/stripe/errors";
import { extractStripeId } from "@/lib/stripe/stripe-ids";
import {
  retrieveStripeSubscription,
  synchronizeStripeSubscription,
} from "@/lib/stripe/subscription-sync";
import {
  getProfileWithRelationsByProfileId,
  getSubscriptionByStripeCustomerId,
  getSubscriptionByStripeSubscriptionId,
} from "@/lib/supabase/subscription-billing";
import { getProfileWithRelationsByClerkId } from "@/lib/supabase/profiles";
import type { ProfileWithRelations } from "@/lib/supabase/types";

async function resolveTrustedProfileForCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<ProfileWithRelations> {
  const stripeCustomerId = extractStripeId(session.customer);
  const stripeSubscriptionId = extractStripeId(session.subscription);

  if (stripeCustomerId) {
    const byCustomer = await getSubscriptionByStripeCustomerId(stripeCustomerId);

    if (byCustomer) {
      return byCustomer;
    }
  }

  if (stripeSubscriptionId) {
    const bySubscription = await getSubscriptionByStripeSubscriptionId(stripeSubscriptionId);

    if (bySubscription) {
      return bySubscription;
    }
  }

  const profileId = session.metadata?.immifin_profile_id?.trim();

  if (profileId) {
    const byProfile = await getProfileWithRelationsByProfileId(profileId);

    if (byProfile) {
      return byProfile;
    }
  }

  const clerkUserId = session.metadata?.clerk_user_id?.trim();

  if (clerkUserId) {
    const byClerk = await getProfileWithRelationsByClerkId(clerkUserId);

    if (byClerk) {
      return byClerk;
    }
  }

  throw new StripeWebhookProcessingError(
    "Trusted IMMIFIN profile could not be resolved for checkout session.",
    500,
    true,
  );
}

export async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;

  if (session.mode !== "subscription") {
    throw new StripeWebhookProcessingError(
      "Checkout session is not a subscription checkout.",
      500,
      true,
    );
  }

  const stripeCustomerId = extractStripeId(session.customer);
  const stripeSubscriptionId = extractStripeId(session.subscription);

  if (!stripeCustomerId) {
    throw new StripeWebhookProcessingError(
      "Checkout session is missing a Stripe customer.",
      500,
      true,
    );
  }

  if (!stripeSubscriptionId) {
    throw new StripeWebhookProcessingError(
      "Checkout session is missing a Stripe subscription.",
      500,
      true,
    );
  }

  const profileWithRelations = await resolveTrustedProfileForCheckoutSession(session);
  const subscription = await retrieveStripeSubscription(stripeSubscriptionId);

  await synchronizeStripeSubscription(subscription, {
    profileId: profileWithRelations.profile.id,
  });
}
