/**
 * BLP-BILL-DEV-FIX-002 — Dev entitlement overrides historical canceled Stripe.
 * Run: npx tsx scripts/verify-blp-bill-dev-fix-002-dev-entitlement-authority.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getEffectivePlan,
  getStoredSimulatedPlan,
  isTerminalCanceledSubscription,
  resolveEntitlementPlan,
} from "../lib/account/plan.ts";
import { canAccessAI } from "../lib/subscription/capabilities.ts";
import { appPlanToSubscriptionTier } from "../lib/subscription/plan.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function profile(plan, clerkUserId = "user_test") {
  return {
    id: "prof_1",
    clerk_user_id: clerkUserId,
    plan,
  };
}

function subscription(overrides = {}) {
  return {
    plan: "power",
    status: "active",
    stripe_subscription_id: "sub_historical",
    stripe_status: "canceled",
    last_synchronized_at: "2026-01-01T00:00:00.000Z",
    billing_interval: "month",
    ...overrides,
  };
}

function main() {
  console.log("\nBLP-BILL-DEV-FIX-002 Dev entitlement authority\n");

  const canceledPower = subscription({ plan: "power" });
  const canceledPro = subscription({ plan: "pro" });
  const canceledFree = subscription({ plan: "free", status: "inactive" });

  assert(
    "Terminal canceled detection",
    isTerminalCanceledSubscription(canceledPower) === true,
  );

  // Production / Dev-off: canceled → Free
  assert(
    "Dev disabled + Power + canceled Stripe → Free",
    resolveEntitlementPlan({
      profile: profile("power"),
      subscription: canceledPower,
      developmentSimulationActive: false,
    }) === "free",
  );
  assert(
    "getEffectivePlan Power + canceled → Free (unchanged)",
    getEffectivePlan(profile("power"), canceledPower) === "free",
  );

  // Dev eligible overrides
  assert(
    "Dev eligible + Free + canceled → Free",
    resolveEntitlementPlan({
      profile: profile("free"),
      subscription: canceledFree,
      developmentSimulationActive: true,
    }) === "free",
  );
  assert(
    "Dev eligible + Pro + canceled → Pro",
    resolveEntitlementPlan({
      profile: profile("pro"),
      subscription: canceledPro,
      developmentSimulationActive: true,
    }) === "pro",
  );
  assert(
    "Dev eligible + Power + canceled → Power",
    resolveEntitlementPlan({
      profile: profile("power"),
      subscription: canceledPower,
      developmentSimulationActive: true,
    }) === "power",
  );

  const noStripePower = {
    plan: "power",
    status: "active",
    stripe_subscription_id: null,
    stripe_status: null,
    last_synchronized_at: null,
    billing_interval: null,
  };
  assert(
    "Dev eligible + no Stripe + Power → Power",
    resolveEntitlementPlan({
      profile: profile("power"),
      subscription: noStripePower,
      developmentSimulationActive: true,
    }) === "power",
  );

  // Wrong-user / production path = Dev off
  assert(
    "Wrong user path (simulation false) + Power + canceled → Free",
    resolveEntitlementPlan({
      profile: profile("power", "user_other"),
      subscription: canceledPower,
      developmentSimulationActive: false,
    }) === "free",
  );
  assert(
    "Production path (simulation false) matching ID still Free when canceled",
    resolveEntitlementPlan({
      profile: profile("power", "user_designated"),
      subscription: canceledPower,
      developmentSimulationActive: false,
    }) === "free",
  );

  assert(
    "Stored simulated prefers subscription.plan",
    getStoredSimulatedPlan(profile("pro"), canceledPower) === "power",
  );

  // accessAI mapping unchanged
  assert(
    "accessAI Free false",
    canAccessAI(appPlanToSubscriptionTier("free")) === false,
  );
  assert(
    "accessAI Pro false",
    canAccessAI(appPlanToSubscriptionTier("pro")) === false,
  );
  assert(
    "accessAI Power true",
    canAccessAI(appPlanToSubscriptionTier("power")) === true,
  );

  const tierPower = appPlanToSubscriptionTier(
    resolveEntitlementPlan({
      profile: profile("power"),
      subscription: canceledPower,
      developmentSimulationActive: true,
    }),
  );
  assert("Dev Power tier for capabilities is power", tierPower === "power");
  assert("Dev Power accessAI true", canAccessAI(tierPower) === true);

  // Wiring / no Stripe history mutation
  const routeSrc = readFileSync(resolve("app/api/account/subscription/route.ts"), "utf8");
  assert(
    "GET/PATCH use resolveSubscriptionEntitlement",
    routeSrc.includes("resolveSubscriptionEntitlement"),
  );
  assert(
    "PATCH response uses entitlement.tier/plan",
    routeSrc.includes("tier: entitlement.tier") && routeSrc.includes("plan: entitlement.plan"),
  );
  assert(
    "Dev billing hasPaidStripeSubscription forced false",
    routeSrc.includes("developmentSimulationActive") &&
      routeSrc.includes("hasPaidStripeSubscription"),
  );
  assert(
    "updateSubscriptionPlan still only updates plan/status (no stripe clear)",
    (() => {
      const src = readFileSync(resolve("lib/supabase/profiles.ts"), "utf8");
      const fn = src.slice(src.indexOf("export async function updateSubscriptionPlan"));
      const body = fn.slice(0, 2200);
      return (
        body.includes("plan,") &&
        !body.includes("stripe_subscription_id:") &&
        !body.includes("stripe_status:")
      );
    })(),
  );

  const planSrc = readFileSync(resolve("lib/account/plan.ts"), "utf8");
  assert(
    "getEffectivePlan still short-circuits canceled → free",
    planSrc.includes("isTerminalCanceledSubscription(subscription)") &&
      planSrc.includes('return "free"'),
  );
  assert(
    "plan.ts has no Clerk / DEV_SUBSCRIPTION_TEST_USER env coupling",
    !planSrc.includes("canUseDevSubscriptionTools") &&
      !planSrc.includes("IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID"),
  );

  const assertCap = readFileSync(resolve("lib/subscription/assertCapability.ts"), "utf8");
  assert(
    "assertCapability uses resolveSubscriptionEntitlement",
    assertCap.includes("resolveSubscriptionEntitlement"),
  );

  console.log("\nPASS: BLP-BILL-DEV-FIX-002 Dev entitlement authority\n");
}

main();
