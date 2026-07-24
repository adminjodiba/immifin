/**
 * Post-Checkout subscription activation UX (Pricing page).
 * Pure helpers + copy — safe for unit verification without React.
 */

import type { SubscriptionTier } from "@/lib/subscription/tiers";

export const CHECKOUT_ACTIVATION_POLL_MS = 2_000;
export const CHECKOUT_ACTIVATION_TIMEOUT_MS = 30_000;
export const CHECKOUT_ACTIVATION_SUCCESS_DISMISS_MS = 5_000;

export type CheckoutExperiencePhase =
  | "idle"
  | "activating"
  | "activated"
  | "timeout"
  | "cancelled";

export type CheckoutExperienceState = {
  phase: CheckoutExperiencePhase;
  activatedTier: "pro" | "power" | null;
};

export const INITIAL_CHECKOUT_EXPERIENCE: CheckoutExperienceState = {
  phase: "idle",
  activatedTier: null,
};

export function isPaidCheckoutActivationTier(
  tier: SubscriptionTier | null | undefined,
): tier is "pro" | "power" {
  return tier === "pro" || tier === "power";
}

export function checkoutExperienceFromQuery(
  checkoutParam: string | null,
): CheckoutExperienceState | null {
  if (checkoutParam === "cancelled") {
    return { phase: "cancelled", activatedTier: null };
  }

  if (checkoutParam === "success") {
    return { phase: "activating", activatedTier: null };
  }

  return null;
}

export function activationSuccessCopy(tier: "pro" | "power"): {
  title: string;
  message: string;
} {
  if (tier === "power") {
    return {
      title: "Welcome to IMMIFIN Power!",
      message:
        "Your Power subscription is now active. All Pro features, AI capabilities, multiple profiles, advanced insights, and priority support are ready.",
    };
  }

  return {
    title: "Welcome to IMMIFIN Pro!",
    message:
      "Your Pro subscription is now active. Your personalized dashboard, Visa Bulletin history, Movement Tracker, notifications, and other Pro features are ready.",
  };
}

export const ACTIVATING_COPY = {
  title: "Activating your subscription...",
  message:
    "We received your payment and are activating your IMMIFIN features. This usually takes a few seconds.",
} as const;

export const TIMEOUT_COPY = {
  title: "We're still confirming your subscription",
  message:
    "Your payment was received, but activation is taking longer than expected. Refresh this page in a moment. If your plan still does not update, contact IMMIFIN Support.",
} as const;

export const CANCELLED_COPY = {
  title: "Checkout was canceled",
  message: "You can try again whenever you are ready.",
} as const;
