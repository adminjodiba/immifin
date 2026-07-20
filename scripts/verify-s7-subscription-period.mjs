/**
 * S7 subscription period extraction — Dahlia API shape verification.
 * Run: npx tsx scripts/verify-s7-subscription-period.mjs
 */

import { getSubscriptionPeriodBounds } from "../lib/stripe/subscription-period.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function makeSubscription(overrides) {
  return {
    id: "sub_test",
    object: "subscription",
    status: "active",
    items: { data: [] },
    ...overrides,
  };
}

function main() {
  const dahliaStart = 1_768_000_000;
  const dahliaEnd = 1_770_678_400;

  const dahlia = getSubscriptionPeriodBounds(
    makeSubscription({
      items: {
        data: [
          {
            id: "si_test",
            object: "subscription_item",
            current_period_start: dahliaStart,
            current_period_end: dahliaEnd,
          },
        ],
      },
    }),
  );

  assert(
    "Dahlia item-level start persisted",
    dahlia.currentPeriodStart === new Date(dahliaStart * 1000).toISOString(),
  );
  assert(
    "Dahlia item-level end persisted",
    dahlia.currentPeriodEnd === new Date(dahliaEnd * 1000).toISOString(),
  );

  const legacy = getSubscriptionPeriodBounds(
    makeSubscription({
      current_period_start: 1_700_000_000,
      current_period_end: 1_702_592_000,
      items: { data: [{ id: "si_legacy", object: "subscription_item" }] },
    }),
  );

  assert("Legacy subscription-level start fallback", legacy.currentPeriodStart !== null);
  assert("Legacy subscription-level end fallback", legacy.currentPeriodEnd !== null);

  const itemPreferred = getSubscriptionPeriodBounds(
    makeSubscription({
      current_period_start: 1_600_000_000,
      current_period_end: 1_602_592_000,
      items: {
        data: [
          {
            id: "si_primary",
            object: "subscription_item",
            current_period_start: dahliaStart,
            current_period_end: dahliaEnd,
          },
        ],
      },
    }),
  );

  assert(
    "Item-level fields preferred over subscription-level",
    itemPreferred.currentPeriodStart === new Date(dahliaStart * 1000).toISOString(),
  );

  const missing = getSubscriptionPeriodBounds(
    makeSubscription({
      items: { data: [{ id: "si_empty", object: "subscription_item" }] },
    }),
  );

  assert("Missing periods remain null", missing.currentPeriodStart === null);
  assert("Missing periods remain null (end)", missing.currentPeriodEnd === null);

  const invalid = getSubscriptionPeriodBounds(
    makeSubscription({
      items: {
        data: [
          {
            id: "si_invalid",
            object: "subscription_item",
            current_period_start: "not-a-number",
            current_period_end: -1,
          },
        ],
      },
    }),
  );

  assert("Invalid timestamps are not invented", invalid.currentPeriodStart === null);
  assert("Invalid timestamps are not invented (end)", invalid.currentPeriodEnd === null);

  console.log("\nAll subscription period extraction checks passed.");
}

main();
