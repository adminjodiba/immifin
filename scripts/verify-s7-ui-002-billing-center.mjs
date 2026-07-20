/**
 * S7-UI-002 — Billing Center action matrix verification.
 * Run: npx tsx scripts/verify-s7-ui-002-billing-center.mjs
 */

import {
  describeScheduledChange,
  getBillingCenterActions,
} from "../lib/billing/billing-center.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  const freeActions = getBillingCenterActions({
    tier: "free",
    billing: {
      status: "inactive",
      stripeStatus: null,
      billingInterval: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      lastSynchronizedAt: null,
      hasPaidStripeSubscription: false,
    },
  });
  assert("Free user gets checkout actions", freeActions.every((a) => a.kind === "checkout"));
  assert("Free user has Pro checkout", freeActions.some((a) => a.id === "checkout-pro-monthly"));

  const powerActions = getBillingCenterActions({
    tier: "power",
    billing: {
      status: "active",
      stripeStatus: "active",
      billingInterval: "month",
      currentPeriodStart: "2026-07-01T00:00:00Z",
      currentPeriodEnd: "2026-08-01T00:00:00Z",
      cancelAtPeriodEnd: false,
      canceledAt: null,
      lastSynchronizedAt: "2026-07-13T00:00:00Z",
      hasPaidStripeSubscription: true,
    },
  });
  assert(
    "Power monthly includes downgrade",
    powerActions.some((a) => a.kind === "downgrade" && a.targetTier === "pro"),
  );
  assert(
    "Power monthly includes cancel",
    powerActions.some((a) => a.kind === "cancel" && a.label === "Downgrade to Free"),
  );  assert(
    "Power monthly includes annual switch",
    powerActions.some((a) => a.id === "switch-power-annual"),
  );
  assert(
    "Power monthly downgrade shows Pro Monthly list price",
    powerActions.some(
      (a) => a.id === "downgrade-pro-month" && a.listPriceLabel === "$9.99/month",
    ),
  );
  assert(
    "Power monthly annual switch shows Power Annual list price",
    powerActions.some(
      (a) => a.id === "switch-power-annual" && a.listPriceLabel === "$199.99/year",
    ),
  );
  assert(
    "Immediate switch includes proration note",
    powerActions.some(
      (a) =>
        a.id === "switch-power-annual" &&
        a.timingNote === "Stripe may apply prorated charges or credits.",
    ),
  );
  assert(
    "Scheduled downgrade includes next-cycle note",
    powerActions.some(
      (a) =>
        a.id === "downgrade-pro-month" &&
        a.timingNote === "Effective at the next billing cycle.",
    ),
  );

  const canceling = getBillingCenterActions({
    tier: "power",
    billing: {
      status: "active",
      stripeStatus: "active",
      billingInterval: "month",
      currentPeriodStart: "2026-07-01T00:00:00Z",
      currentPeriodEnd: "2026-08-01T00:00:00Z",
      cancelAtPeriodEnd: true,
      canceledAt: null,
      lastSynchronizedAt: "2026-07-13T00:00:00Z",
      hasPaidStripeSubscription: true,
    },
  });
  assert("Canceling subscription has no plan-change actions", canceling.length === 0);
  assert(
    "Scheduled change describes cancellation",
    describeScheduledChange({
      status: "active",
      stripeStatus: "active",
      billingInterval: "month",
      currentPeriodStart: "2026-07-01T00:00:00Z",
      currentPeriodEnd: "2026-08-01T00:00:00Z",
      cancelAtPeriodEnd: true,
      canceledAt: null,
      lastSynchronizedAt: null,
      hasPaidStripeSubscription: true,
    }).includes("Downgrade to Free scheduled"),
  );

  console.log("\nAll S7-UI-002 Billing Center checks passed.");
}

main();
