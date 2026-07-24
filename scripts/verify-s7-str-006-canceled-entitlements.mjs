/**
 * S7-STR-006 — canceled subscription entitlements.
 * Run: npx tsx scripts/verify-s7-str-006-canceled-entitlements.mjs
 */

import {
  getEffectivePlan,
  isTerminalCanceledSubscription,
  resolvePlanForStripeBillingSync,
} from "../lib/account/plan.ts";
import { getStoredSubscriptionTier } from "../lib/subscription/service.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function baseSub(overrides = {}) {
  return {
    id: "sub-row",
    profile_id: "profile-1",
    plan: "pro",
    status: "active",
    stripe_customer_id: "cus_test",
    stripe_subscription_id: "sub_test",
    stripe_price_id: "price_test",
    billing_interval: "month",
    stripe_status: "active",
    cancel_at_period_end: false,
    canceled_at: null,
    current_period_start: "2026-07-01T00:00:00.000Z",
    current_period_end: "2026-08-01T00:00:00.000Z",
    last_synchronized_at: "2026-07-22T00:00:00.000Z",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-22T00:00:00.000Z",
    ...overrides,
  };
}

function baseProfile(plan = "free") {
  return {
    id: "profile-1",
    clerk_user_id: "user_1",
    email: "test@example.com",
    role: "user",
    plan,
    display_name: null,
    avatar_url: null,
    phone_number: null,
    status: "active",
    role_updated_at: null,
    role_updated_by_clerk_user_id: null,
    last_seen_at: null,
    last_login_at: null,
    clerk_synced_at: null,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  };
}

function main() {
  assert(
    "Active Pro resolves to Pro",
    getEffectivePlan(baseProfile("free"), baseSub({ plan: "pro", stripe_status: "active" })) ===
      "pro",
  );
  assert(
    "Active Power resolves to Power",
    getEffectivePlan(baseProfile("free"), baseSub({ plan: "power", stripe_status: "active" })) ===
      "power",
  );
  assert(
    "Active Pro cancel_at_period_end remains Pro",
    getEffectivePlan(
      baseProfile("free"),
      baseSub({
        plan: "pro",
        stripe_status: "active",
        status: "active",
        cancel_at_period_end: true,
        canceled_at: null,
      }),
    ) === "pro",
  );
  assert(
    "Active Power cancel_at_period_end remains Power",
    getEffectivePlan(
      baseProfile("free"),
      baseSub({
        plan: "power",
        stripe_status: "active",
        status: "active",
        cancel_at_period_end: true,
      }),
    ) === "power",
  );
  assert(
    "Canceled Pro (stale plan=pro) resolves to Free",
    getEffectivePlan(
      baseProfile("free"),
      baseSub({
        plan: "pro",
        stripe_status: "canceled",
        status: "canceled",
        cancel_at_period_end: false,
        canceled_at: "2026-07-22T15:42:46.000Z",
      }),
    ) === "free",
  );
  assert(
    "Canceled Power resolves to Free",
    getEffectivePlan(
      baseProfile("free"),
      baseSub({
        plan: "power",
        stripe_status: "canceled",
        status: "canceled",
      }),
    ) === "free",
  );
  assert(
    "App status canceled alone is terminal",
    isTerminalCanceledSubscription({ stripe_status: "active", status: "canceled" }),
  );
  assert(
    "Active cancel_at_period_end is not terminal",
    !isTerminalCanceledSubscription({
      stripe_status: "active",
      status: "active",
    }),
  );
  assert(
    "Deleted sync maps catalog pro → free plan",
    resolvePlanForStripeBillingSync({ stripeStatus: "canceled", catalogTier: "pro" }) === "free",
  );
  assert(
    "Active sync keeps catalog pro",
    resolvePlanForStripeBillingSync({ stripeStatus: "active", catalogTier: "pro" }) === "pro",
  );
  assert(
    "Free user remains Free",
    getEffectivePlan(baseProfile("free"), baseSub({ plan: "free", stripe_subscription_id: null, last_synchronized_at: null, stripe_status: null })) ===
      "free",
  );
  assert(
    "Null subscription uses profile plan",
    getEffectivePlan(baseProfile("free"), null) === "free",
  );

  const canceledTier = getStoredSubscriptionTier({
    profile: baseProfile("free"),
    subscription: baseSub({
      plan: "pro",
      stripe_status: "canceled",
      status: "canceled",
    }),
  });
  assert("Capability resolver uses Free for canceled Pro", canceledTier === "free");

  const scheduledCancelTier = getStoredSubscriptionTier({
    profile: baseProfile("free"),
    subscription: baseSub({
      plan: "pro",
      stripe_status: "active",
      cancel_at_period_end: true,
    }),
  });
  assert("Capability resolver keeps Pro for scheduled cancel", scheduledCancelTier === "pro");

  console.log("ALL_OK=true");
}

main();
