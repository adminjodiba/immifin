import "server-only";

import { getEffectivePlan, isExecutivePlan } from "@/lib/account/plan";
import { StripeCheckoutError } from "@/lib/stripe/errors";
import { resolveApprovedStripePriceId } from "@/lib/stripe/catalog";
import type { ParsedCheckoutRequest } from "@/lib/stripe/checkout-request";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer";
import { getStripeClient } from "@/lib/stripe/server";
import { siteConfig } from "@/lib/site";
import type { Profile, Subscription } from "@/lib/supabase/types";

function getCheckoutAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return siteConfig.url.replace(/\/$/, "");
}

function buildCheckoutUrls(origin: string) {
  return {
    successUrl: `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/pricing?checkout=cancelled`,
  };
}

export type CreateNewSubscriptionCheckoutInput = {
  profile: Profile;
  subscription: Subscription | null;
  request: ParsedCheckoutRequest;
};

export type CreateNewSubscriptionCheckoutResult = {
  url: string;
};

/**
 * Ensures only Free users may start new-subscription Checkout.
 * Uses trusted server-side subscription state — never client input.
 */
export function assertFreeUserForNewSubscriptionCheckout(input: {
  profile: Profile;
  subscription: Subscription | null;
}): void {
  const effectivePlan = getEffectivePlan(input.profile, input.subscription);

  if (isExecutivePlan(effectivePlan) || effectivePlan === "basic") {
    throw new StripeCheckoutError(
      "Checkout is only available when starting a new paid subscription from Free.",
      409,
    );
  }

  if (effectivePlan !== "free") {
    throw new StripeCheckoutError(
      "Checkout is only available when starting a new paid subscription from Free.",
      409,
    );
  }
}

/**
 * Creates a Stripe Checkout Session for Free → Pro/Power new subscriptions.
 * Does not modify IMMIFIN subscription state or capabilities.
 */
export async function createNewSubscriptionCheckoutSession(
  input: CreateNewSubscriptionCheckoutInput,
): Promise<CreateNewSubscriptionCheckoutResult> {
  assertFreeUserForNewSubscriptionCheckout({
    profile: input.profile,
    subscription: input.subscription,
  });

  const priceId = resolveApprovedStripePriceId(
    input.request.tier,
    input.request.billingInterval,
  );

  const origin = getCheckoutAppOrigin();
  const { successUrl, cancelUrl } = buildCheckoutUrls(origin);
  const stripe = getStripeClient();

  const stripeCustomerId = await getOrCreateStripeCustomer({
    profile: input.profile,
    subscription: input.subscription,
  });

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer: stripeCustomerId,
    client_reference_id: input.profile.id,
    metadata: {
      immifin_profile_id: input.profile.id,
      clerk_user_id: input.profile.clerk_user_id,
      requested_tier: input.request.tier,
      requested_interval: input.request.interval,
    },
    allow_promotion_codes: false,
  };

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new StripeCheckoutError("Stripe Checkout session did not return a URL.", 502);
  }

  return { url: session.url };
}
