/**
 * S7-UI-006 — Downgrade to Free subscription experience.
 * Run: npx tsx scripts/verify-s7-ui-006-downgrade-to-free.mjs
 */

import {
  describeScheduledChange,
  getBillingCenterActions,
} from "../lib/billing/billing-center.ts";
import { buildPlanChangeReview } from "../lib/billing/plan-change-intent.ts";
import { evaluateSubscriptionChangePolicy } from "../lib/stripe/subscription-change-policy.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

const billing = {
  status: "active",
  stripeStatus: "active",
  billingInterval: "month",
  currentPeriodStart: "2026-07-13T00:00:00Z",
  currentPeriodEnd: "2026-08-13T12:00:00Z",
  cancelAtPeriodEnd: false,
  canceledAt: null,
  lastSynchronizedAt: "2026-07-13T00:00:00Z",
  hasPaidStripeSubscription: true,
};

function main() {
  const proActions = getBillingCenterActions({ tier: "pro", billing });
  assert(
    "Pro has Downgrade to Free action",
    proActions.some((a) => a.id === "downgrade-to-free" && a.label === "Downgrade to Free"),
  );
  assert(
    "Pro Free action uses Free list price",
    proActions.some((a) => a.id === "downgrade-to-free" && a.listPriceLabel === "$0"),
  );
  assert(
    "No Cancel Subscription label",
    !proActions.some((a) => /cancel subscription/i.test(a.label)),
  );

  const powerActions = getBillingCenterActions({ tier: "power", billing });
  assert(
    "Power has Downgrade to Free action",
    powerActions.some((a) => a.id === "downgrade-to-free"),
  );

  const freeAction = proActions.find((a) => a.id === "downgrade-to-free");
  const review = buildPlanChangeReview({
    tier: "pro",
    billing,
    action: freeAction,
  });

  assert("Dialog title is Downgrade to Free", review.dialogTitle === "Downgrade to Free");
  assert("Confirm is Schedule Downgrade", review.confirmLabel === "Schedule Downgrade");
  assert("Dismiss is Keep Current Plan", review.dismissLabel === "Keep Current Plan");
  assert("Target plan is Free", review.targetPlanLine === "Free");
  assert("Effective date shown", /Aug 13, 2026/.test(review.timingLabel));
  assert(
    "Access explanation is positive",
    Boolean(review.accessExplanation?.includes("continue enjoying all Pro features")),
  );
  assert(
    "Transition explanation mentions Free",
    Boolean(review.transitionExplanation?.includes("Free plan")),
  );

  assert(
    "Policy Pro → Free uses cancel_at_period_end",
    evaluateSubscriptionChangePolicy({
      currentTier: "pro",
      currentInterval: "month",
      targetTier: "free",
      targetInterval: null,
      cancelAtPeriodEnd: false,
    }).changeType === "cancel_at_period_end",
  );

  assert(
    "Policy Power → Free uses cancel_at_period_end",
    evaluateSubscriptionChangePolicy({
      currentTier: "power",
      currentInterval: "month",
      targetTier: "free",
      targetInterval: null,
      cancelAtPeriodEnd: false,
    }).changeType === "cancel_at_period_end",
  );

  assert(
    "Keep My Subscription maps to retain_paid_subscription",
    evaluateSubscriptionChangePolicy({
      currentTier: "power",
      currentInterval: "month",
      targetTier: "power",
      targetInterval: "month",
      cancelAtPeriodEnd: true,
    }).changeType === "retain_paid_subscription",
  );

  assert(
    "Scheduled copy uses Downgrade to Free",
    describeScheduledChange({
      ...billing,
      cancelAtPeriodEnd: true,
    }).includes("Downgrade to Free scheduled"),
  );

  const cancelingActions = getBillingCenterActions({
    tier: "power",
    billing: { ...billing, cancelAtPeriodEnd: true },
  });
  assert("No other plan actions while Free downgrade scheduled", cancelingActions.length === 0);

  console.log("\nAll S7-UI-006 Downgrade to Free checks passed.");
}

main();
