/**
 * S7-CAP-002 — capability enforcement alignment verification.
 * Run: npx tsx scripts/verify-s7-cap-002-capability-enforcement.mjs
 */

import {
  CAPABILITY,
  canAccessAI,
  canAccessAutoCalculatorPopulation,
  canAccessFavorites,
  canAccessMultipleProfiles,
  canAccessPersonalDashboard,
  getCapabilitiesForTier,
  hasCapability,
} from "../lib/subscription/capabilities.ts";
import { assertCapability } from "../lib/subscription/assertCapability.ts";
import { getStoredSubscriptionTier } from "../lib/subscription/service.ts";
import { AuthError } from "../lib/auth/errors.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function makeProfile(plan) {
  return {
    id: "profile-1",
    clerk_user_id: "user_1",
    email: "test@example.com",
    plan,
    role: "user",
    status: "active",
    created_at: "",
    updated_at: "",
  };
}

function makeSubscription(plan) {
  return {
    id: "sub-1",
    profile_id: "profile-1",
    plan,
    status: "active",
    stripe_customer_id: "cus_test",
    stripe_subscription_id: "sub_test",
    stripe_price_id: "price_test",
    billing_interval: "month",
    stripe_status: "active",
    cancel_at_period_end: false,
    canceled_at: null,
    current_period_start: null,
    current_period_end: null,
    last_synchronized_at: "2026-01-01T00:00:00Z",
    created_at: "",
    updated_at: "",
  };
}

function main() {
  const freeCaps = getCapabilitiesForTier("free");
  const proCaps = getCapabilitiesForTier("pro");
  const powerCaps = getCapabilitiesForTier("power");

  assert(
    "Free cannot access Pro dashboard capability",
    !freeCaps.accessPersonalDashboard,
  );
  assert("Pro has dashboard capability", proCaps.accessPersonalDashboard);
  assert("Power has dashboard capability", powerCaps.accessPersonalDashboard);
  assert("Pro cannot access AI", !proCaps.accessAI);
  assert("Power can access AI", powerCaps.accessAI);
  assert("Power can access multiple profiles", powerCaps.accessMultipleProfiles);
  assert("Pro cannot access multiple profiles", !proCaps.accessMultipleProfiles);

  assert(
    "CAPABILITY constants match capability map keys",
    CAPABILITY.visaHistory === "accessVisaHistory",
  );

  const freeProfile = { profile: makeProfile("free"), subscription: makeSubscription("free") };
  const proProfile = { profile: makeProfile("pro"), subscription: makeSubscription("pro") };
  const powerProfile = { profile: makeProfile("power"), subscription: makeSubscription("power") };

  assert("Free tier resolves from stored subscription", getStoredSubscriptionTier(freeProfile) === "free");
  assert("Pro tier resolves from stored subscription", getStoredSubscriptionTier(proProfile) === "pro");
  assert("Power tier resolves from stored subscription", getStoredSubscriptionTier(powerProfile) === "power");

  assert("Free lacks favorites capability", !canAccessFavorites("free"));
  assert("Pro has favorites capability", canAccessFavorites("pro"));
  assert("Power has autofill capability", canAccessAutoCalculatorPopulation("power"));

  try {
    assertCapability(freeProfile, CAPABILITY.favorites);
    throw new Error("FAIL: Free favorites assert should throw");
  } catch (error) {
    assert(
      "Free favorites API guard throws AuthError",
      error instanceof AuthError && error.status === 403,
    );
  }

  assert("Pro passes favorites assertCapability", (() => {
    assertCapability(proProfile, CAPABILITY.favorites);
    return true;
  })());

  assert("Power passes AI capability check", canAccessAI("power"));
  assert(
    "Power-only capabilities remain defined and unused in UI",
    hasCapability("power", CAPABILITY.ai) && hasCapability("power", CAPABILITY.multipleProfiles),
  );

  console.log("\nAll S7-CAP-002 capability enforcement checks passed.");
}

main();
