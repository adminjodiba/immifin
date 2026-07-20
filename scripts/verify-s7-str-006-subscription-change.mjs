/**
 * S7-STR-006 — paid subscription change policy and request validation.
 * Run: npx tsx scripts/verify-s7-str-006-subscription-change.mjs
 */

import { evaluateSubscriptionChangePolicy } from "../lib/stripe/subscription-change-policy.ts";
import { parseSubscriptionChangeRequest } from "../lib/stripe/subscription-change-request.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function expectPolicy(input, expectedChangeType) {
  const result = evaluateSubscriptionChangePolicy(input);
  assert(
    `${input.currentTier} ${input.currentInterval} -> ${input.targetTier} ${input.targetInterval ?? "null"} = ${expectedChangeType}`,
    result.changeType === expectedChangeType,
  );
}

function expectPolicyError(fn, label) {
  try {
    fn();
    throw new Error(`FAIL: ${label} should have thrown`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("FAIL:")) {
      throw error;
    }
    console.log(`✓ ${label}`);
  }
}

function main() {
  expectPolicy(
    {
      currentTier: "pro",
      currentInterval: "month",
      targetTier: "power",
      targetInterval: "month",
      cancelAtPeriodEnd: false,
    },
    "immediate_upgrade",
  );

  expectPolicy(
    {
      currentTier: "pro",
      currentInterval: "year",
      targetTier: "power",
      targetInterval: "year",
      cancelAtPeriodEnd: false,
    },
    "immediate_upgrade",
  );

  expectPolicy(
    {
      currentTier: "pro",
      currentInterval: "month",
      targetTier: "pro",
      targetInterval: "year",
      cancelAtPeriodEnd: false,
    },
    "immediate_upgrade",
  );

  expectPolicy(
    {
      currentTier: "power",
      currentInterval: "month",
      targetTier: "power",
      targetInterval: "year",
      cancelAtPeriodEnd: false,
    },
    "immediate_upgrade",
  );

  expectPolicy(
    {
      currentTier: "power",
      currentInterval: "month",
      targetTier: "pro",
      targetInterval: "month",
      cancelAtPeriodEnd: false,
    },
    "scheduled_downgrade",
  );

  expectPolicy(
    {
      currentTier: "power",
      currentInterval: "year",
      targetTier: "pro",
      targetInterval: "year",
      cancelAtPeriodEnd: false,
    },
    "scheduled_downgrade",
  );

  expectPolicy(
    {
      currentTier: "pro",
      currentInterval: "year",
      targetTier: "pro",
      targetInterval: "month",
      cancelAtPeriodEnd: false,
    },
    "scheduled_interval_change",
  );

  expectPolicy(
    {
      currentTier: "power",
      currentInterval: "year",
      targetTier: "power",
      targetInterval: "month",
      cancelAtPeriodEnd: false,
    },
    "scheduled_interval_change",
  );

  expectPolicy(
    {
      currentTier: "pro",
      currentInterval: "month",
      targetTier: "free",
      targetInterval: null,
      cancelAtPeriodEnd: false,
    },
    "cancel_at_period_end",
  );

  expectPolicy(
    {
      currentTier: "power",
      currentInterval: "year",
      targetTier: "free",
      targetInterval: null,
      cancelAtPeriodEnd: false,
    },
    "cancel_at_period_end",
  );

  expectPolicy(
    {
      currentTier: "pro",
      currentInterval: "month",
      targetTier: "pro",
      targetInterval: "month",
      cancelAtPeriodEnd: false,
    },
    "no_change",
  );

  expectPolicy(
    {
      currentTier: "power",
      currentInterval: "month",
      targetTier: "power",
      targetInterval: "month",
      cancelAtPeriodEnd: true,
    },
    "retain_paid_subscription",
  );

  expectPolicy(
    {
      currentTier: "pro",
      currentInterval: "month",
      targetTier: "free",
      targetInterval: null,
      cancelAtPeriodEnd: true,
    },
    "no_change",
  );

  expectPolicy(
    {
      currentTier: "pro",
      currentInterval: "month",
      targetTier: "power",
      targetInterval: "year",
      cancelAtPeriodEnd: false,
    },
    "forbidden",
  );

  expectPolicy(
    {
      currentTier: "power",
      currentInterval: "year",
      targetTier: "pro",
      targetInterval: "month",
      cancelAtPeriodEnd: false,
    },
    "forbidden",
  );

  const parsed = parseSubscriptionChangeRequest({
    targetTier: "power",
    targetInterval: "annual",
  });
  assert("Request parser accepts tier + interval", parsed.targetTier === "power");
  assert("Request parser maps annual to year", parsed.targetBillingInterval === "year");

  const freeParsed = parseSubscriptionChangeRequest({
    targetTier: "free",
    targetInterval: null,
  });
  assert("Request parser accepts free downgrade", freeParsed.targetTier === "free");

  expectPolicyError(
    () =>
      parseSubscriptionChangeRequest({
        targetTier: "power",
        targetInterval: "annual",
        priceId: "price_secret",
      }),
    "Request parser rejects priceId",
  );

  expectPolicyError(
    () =>
      parseSubscriptionChangeRequest({
        targetTier: "power",
        targetInterval: "annual",
        subscriptionId: "sub_secret",
      }),
    "Request parser rejects subscriptionId",
  );

  expectPolicyError(
    () =>
      parseSubscriptionChangeRequest({
        targetTier: "pro",
        targetInterval: null,
      }),
    "Request parser rejects paid target without interval",
  );

  console.log("\nAll S7-STR-006 subscription change checks passed.");
}

main();
