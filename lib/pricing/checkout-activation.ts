/**
 * Post-Checkout subscription activation UX (Pricing page).
 * Pure helpers + copy — safe for unit verification without React.
 *
 * S7-BILLING-UX-008A: polling must wait for Clerk auth readiness before the
 * bounded timeout starts, and must only accept authoritative paid tiers from
 * GET /api/account/subscription (never manufacture entitlement from Checkout success).
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

/**
 * Activation polling / timeout must not start until Clerk has loaded and the
 * user is signed in. Otherwise refreshStoredTier short-circuits without a
 * network read and the 30s timer can expire while entitlement is already Pro.
 */
export function canStartCheckoutActivationPolling(input: {
  isLoaded: boolean;
  isSignedIn: boolean | undefined | null;
}): boolean {
  return input.isLoaded === true && input.isSignedIn === true;
}

export type CheckoutActivationPollDecision =
  | { action: "continue" }
  | { action: "activated"; tier: "pro" | "power" };

/**
 * Pure poll step: Free / null / errors → continue; authoritative Pro/Power → stop.
 * Does not mutate entitlement — caller supplies the latest API tier.
 */
export function decideCheckoutActivationPoll(
  tier: SubscriptionTier | null | undefined,
): CheckoutActivationPollDecision {
  if (isPaidCheckoutActivationTier(tier)) {
    return { action: "activated", tier };
  }
  return { action: "continue" };
}

/**
 * Simulates a bounded activation loop for verification (no timers / React).
 * `reads` are successive authoritative API tiers (webhook may land mid-loop).
 */
export function simulateCheckoutActivationPolling(input: {
  reads: Array<SubscriptionTier | null>;
  authReady: boolean;
}): {
  started: boolean;
  activatedTier: "pro" | "power" | null;
  pollsUsed: number;
  timedOut: boolean;
} {
  if (!input.authReady) {
    return { started: false, activatedTier: null, pollsUsed: 0, timedOut: false };
  }

  let pollsUsed = 0;
  for (const tier of input.reads) {
    pollsUsed += 1;
    const decision = decideCheckoutActivationPoll(tier);
    if (decision.action === "activated") {
      return {
        started: true,
        activatedTier: decision.tier,
        pollsUsed,
        timedOut: false,
      };
    }
  }

  return {
    started: true,
    activatedTier: null,
    pollsUsed,
    timedOut: true,
  };
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
    "Payment received. We're activating your subscription. This usually takes a few seconds.",
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
