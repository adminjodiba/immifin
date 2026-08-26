/**
 * S7-BILLING-UX-008A — Post-Checkout entitlement refresh reliability.
 * Run: npx tsx scripts/verify-s7-billing-ux-008a-checkout-entitlement-refresh.mjs
 *
 * Injected fakes / source contracts only — no Stripe network / no Checkout mutation.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  ACTIVATING_COPY,
  CHECKOUT_ACTIVATION_POLL_MS,
  CHECKOUT_ACTIVATION_TIMEOUT_MS,
  TIMEOUT_COPY,
  canStartCheckoutActivationPolling,
  decideCheckoutActivationPoll,
  simulateCheckoutActivationPolling,
  checkoutExperienceFromQuery,
  isPaidCheckoutActivationTier,
} from "../lib/pricing/checkout-activation.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  const full = resolve(relPath);
  if (!existsSync(full)) {
    throw new Error(`Missing file: ${relPath}`);
  }
  return readFileSync(full, "utf8");
}

function main() {
  assert("poll remains bounded (2s)", CHECKOUT_ACTIVATION_POLL_MS === 2_000);
  assert("timeout remains bounded (30s)", CHECKOUT_ACTIVATION_TIMEOUT_MS === 30_000);

  assert(
    "auth not ready → cannot start polling/timeout",
    !canStartCheckoutActivationPolling({ isLoaded: false, isSignedIn: false }),
  );
  assert(
    "loaded but signed out → cannot start",
    !canStartCheckoutActivationPolling({ isLoaded: true, isSignedIn: false }),
  );
  assert(
    "loaded + signed in → can start",
    canStartCheckoutActivationPolling({ isLoaded: true, isSignedIn: true }),
  );

  assert("free → continue", decideCheckoutActivationPoll("free").action === "continue");
  assert("null → continue", decideCheckoutActivationPoll(null).action === "continue");
  const pro = decideCheckoutActivationPoll("pro");
  assert("pro → activated", pro.action === "activated" && pro.tier === "pro");
  const power = decideCheckoutActivationPoll("power");
  assert("power → activated", power.action === "activated" && power.tier === "power");

  // Simulated lifecycle: Free, Free, Free, then webhook-equivalent Pro
  const lifecycle = simulateCheckoutActivationPolling({
    authReady: true,
    reads: ["free", "free", "free", "pro"],
  });
  assert("lifecycle started", lifecycle.started === true);
  assert("lifecycle activates on Pro", lifecycle.activatedTier === "pro");
  assert("lifecycle stops at poll 4", lifecycle.pollsUsed === 4);
  assert("lifecycle not timed out", lifecycle.timedOut === false);

  const alreadyPro = simulateCheckoutActivationPolling({
    authReady: true,
    reads: ["pro"],
  });
  assert("already-Pro activates immediately", alreadyPro.activatedTier === "pro");
  assert("already-Pro uses one poll", alreadyPro.pollsUsed === 1);

  const timeoutPath = simulateCheckoutActivationPolling({
    authReady: true,
    reads: ["free", "free", null],
  });
  assert("timeout when never Pro", timeoutPath.timedOut === true);
  assert("timeout leaves no activated tier", timeoutPath.activatedTier === null);

  const authBlocked = simulateCheckoutActivationPolling({
    authReady: false,
    reads: ["pro", "pro"],
  });
  assert("auth not ready → polling not started", authBlocked.started === false);
  assert("auth not ready → no false Pro grant", authBlocked.activatedTier === null);

  assert("no checkout context → null experience", checkoutExperienceFromQuery(null) === null);
  assert(
    "success context → activating only (not Pro grant)",
    checkoutExperienceFromQuery("success")?.phase === "activating" &&
      checkoutExperienceFromQuery("success")?.activatedTier === null,
  );

  assert("paid helper: pro", isPaidCheckoutActivationTier("pro"));
  assert("paid helper: free false", !isPaidCheckoutActivationTier("free"));

  assert(
    "activating copy mentions payment received",
    /Payment received/i.test(ACTIVATING_COPY.message),
  );
  assert(
    "timeout does not claim payment failed",
    !/payment failed/i.test(TIMEOUT_COPY.message),
  );

  const pricingSrc = readSource("components/pricing/PricingPlans.tsx");
  assert(
    "Pricing waits for auth before activation poll",
    /canStartCheckoutActivationPolling/.test(pricingSrc),
  );
  assert(
    "Pricing uses decideCheckoutActivationPoll",
    /decideCheckoutActivationPoll/.test(pricingSrc),
  );
  assert(
    "Pricing poll effect depends on isAuthLoaded",
    /isAuthLoaded/.test(pricingSrc),
  );

  const providerSrc = readSource("lib/hooks/SubscriptionTierProvider.tsx");
  assert(
    "provider does not clear entitlement while Clerk loading",
    /while Clerk is still loading/.test(providerSrc) || /!isLoaded/.test(providerSrc),
  );
  assert(
    "provider fetch uses cache-bust query",
    /_ts=\$\{Date\.now\(\)\}/.test(providerSrc),
  );
  assert(
    "provider fetch uses cache: no-store",
    /cache:\s*["']no-store["']/.test(providerSrc),
  );
  assert(
    "provider preserves tier on transient catch",
    /Preserve last-known tier/.test(providerSrc),
  );

  const routeSrc = readSource("app/api/account/subscription/route.ts");
  assert(
    "subscription GET sets Cache-Control no-store",
    /Cache-Control["']:\s*["']private, no-store/.test(routeSrc),
  );

  // Safety: no Checkout / webhook / sync architecture edits in this story's helpers
  const syncSrc = readSource("lib/stripe/subscription-sync.ts");
  assert("subscription-sync still present", /synchronizeStripeSubscription/.test(syncSrc));
  const webhookSrc = readSource("lib/stripe/webhook.ts");
  assert(
    "webhook signature path unchanged",
    /Invalid Stripe webhook signature/.test(webhookSrc),
  );

  console.log("\nS7-BILLING-UX-008A verification passed.");
}

main();
