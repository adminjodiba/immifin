/**
 * S7-UX-003 — post-Checkout activation experience helpers.
 * Run: npx tsx scripts/verify-s7-ux-003-checkout-activation.mjs
 */

import {
  ACTIVATING_COPY,
  CANCELLED_COPY,
  CHECKOUT_ACTIVATION_POLL_MS,
  CHECKOUT_ACTIVATION_SUCCESS_DISMISS_MS,
  CHECKOUT_ACTIVATION_TIMEOUT_MS,
  TIMEOUT_COPY,
  activationSuccessCopy,
  checkoutExperienceFromQuery,
  isPaidCheckoutActivationTier,
} from "../lib/pricing/checkout-activation.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  assert("poll interval is 2s", CHECKOUT_ACTIVATION_POLL_MS === 2_000);
  assert("timeout is 30s", CHECKOUT_ACTIVATION_TIMEOUT_MS === 30_000);
  assert("success dismiss is 5s", CHECKOUT_ACTIVATION_SUCCESS_DISMISS_MS === 5_000);

  assert("success query → activating", checkoutExperienceFromQuery("success")?.phase === "activating");
  assert(
    "cancelled query → cancelled",
    checkoutExperienceFromQuery("cancelled")?.phase === "cancelled",
  );
  assert("other query → null", checkoutExperienceFromQuery("other") === null);
  assert("null query → null", checkoutExperienceFromQuery(null) === null);

  assert("pro is paid activation tier", isPaidCheckoutActivationTier("pro"));
  assert("power is paid activation tier", isPaidCheckoutActivationTier("power"));
  assert("free is not paid activation tier", !isPaidCheckoutActivationTier("free"));
  assert("null is not paid activation tier", !isPaidCheckoutActivationTier(null));

  const proCopy = activationSuccessCopy("pro");
  assert("pro welcome title", proCopy.title === "Welcome to IMMIFIN Pro!");
  assert("pro welcome mentions dashboard", /personalized dashboard/i.test(proCopy.message));

  const powerCopy = activationSuccessCopy("power");
  assert("power welcome title", powerCopy.title === "Welcome to IMMIFIN Power!");
  assert("power welcome mentions AI", /AI capabilities/i.test(powerCopy.message));

  assert("activating title set", ACTIVATING_COPY.title.length > 0);
  assert("timeout does not claim payment failed", !/payment failed/i.test(TIMEOUT_COPY.message));
  assert("cancelled copy preserved", /try again/i.test(CANCELLED_COPY.message));

  console.log("ALL_OK=true");
}

main();
