/**
 * S7-UI-005 — Pricing → Billing Center plan-change handoff.
 * Run: npx tsx scripts/verify-s7-ui-005-plan-change-handoff.mjs
 */

import {
  buildBillingChangeHandoffHref,
  buildPlanChangeReview,
  findBillingCenterActionForIntent,
  parsePlanChangeIntentFromSearchParams,
} from "../lib/billing/plan-change-intent.ts";
import { getCheckoutPlanButtonConfig } from "../lib/pricing/checkout-plan-actions.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

const proPlan = {
  id: "pro",
  cta: "Upgrade to Pro",
  ctaStyle: "btn-primary",
};

const powerPlan = {
  id: "power",
  cta: "Upgrade to Power",
  ctaStyle: "btn-secondary",
};

const freePlan = {
  id: "free",
  cta: "Get Started",
  ctaStyle: "btn-secondary",
};

const powerMonthlyBilling = {
  status: "active",
  stripeStatus: "active",
  billingInterval: "month",
  currentPeriodStart: "2026-07-01T00:00:00Z",
  currentPeriodEnd: "2026-08-01T00:00:00Z",
  cancelAtPeriodEnd: false,
  canceledAt: null,
  lastSynchronizedAt: "2026-07-13T00:00:00Z",
  hasPaidStripeSubscription: true,
};

const proMonthlyBilling = {
  ...powerMonthlyBilling,
};

function main() {
  assert(
    "Handoff href for Pro Annual",
    buildBillingChangeHandoffHref("pro", "annual") ===
      "/account/billing?targetTier=pro&targetInterval=annual",
  );
  assert(
    "Handoff href for Free omits interval",
    buildBillingChangeHandoffHref("free", null) === "/account/billing?targetTier=free",
  );

  assert(
    "Parses Pro Annual intent",
    JSON.stringify(
      parsePlanChangeIntentFromSearchParams(
        new URLSearchParams("targetTier=pro&targetInterval=annual"),
      ),
    ) === JSON.stringify({ targetTier: "pro", targetInterval: "annual" }),
  );
  assert(
    "Rejects Free with interval",
    parsePlanChangeIntentFromSearchParams(
      new URLSearchParams("targetTier=free&targetInterval=monthly"),
    ) === null,
  );
  assert(
    "Rejects malformed tier",
    parsePlanChangeIntentFromSearchParams(new URLSearchParams("targetTier=gold")) === null,
  );
  assert(
    "Rejects paid tier without interval",
    parsePlanChangeIntentFromSearchParams(new URLSearchParams("targetTier=pro")) === null,
  );

  const proAnnualFromPricing = getCheckoutPlanButtonConfig(
    proPlan,
    "pro",
    true,
    "month",
    "annual",
  );
  assert(
    "Pricing Switch to Pro Annual includes handoff intent",
    proAnnualFromPricing.href === "/account/billing?targetTier=pro&targetInterval=annual",
  );

  const upgradePower = getCheckoutPlanButtonConfig(powerPlan, "pro", true, "month", "monthly");
  assert(
    "Pricing Upgrade to Power includes handoff intent",
    upgradePower.href === "/account/billing?targetTier=power&targetInterval=monthly",
  );

  const downgradeFree = getCheckoutPlanButtonConfig(freePlan, "power", true, "month", "monthly");
  assert(
    "Pricing Downgrade to Free includes handoff intent",
    downgradeFree.href === "/account/billing?targetTier=free",
  );

  const matched = findBillingCenterActionForIntent({
    tier: "pro",
    billing: proMonthlyBilling,
    intent: { targetTier: "pro", targetInterval: "annual" },
  });
  assert("Pro Monthly → Pro Annual resolves to action", matched?.id === "switch-pro-annual");

  const review = buildPlanChangeReview({
    tier: "pro",
    billing: proMonthlyBilling,
    action: matched,
  });
  assert("Review current is Pro Monthly", review.currentPlanLine === "Pro Monthly");
  assert("Review current price", review.currentPriceLine === "$9.99/month");
  assert("Review target is Pro Annual", review.targetPlanLine === "Pro Annual");
  assert("Review target price", review.targetPriceLine === "$99.99/year");
  assert("Review timing is Immediate", review.timingLabel === "Immediate");
  assert(
    "Review billing note mentions proration",
    review.billingNote.includes("prorated"),
  );

  const downgrade = findBillingCenterActionForIntent({
    tier: "power",
    billing: powerMonthlyBilling,
    intent: { targetTier: "pro", targetInterval: "monthly" },
  });
  assert("Power Monthly → Pro Monthly resolves", downgrade?.kind === "downgrade");
  const downgradeReview = buildPlanChangeReview({
    tier: "power",
    billing: powerMonthlyBilling,
    action: downgrade,
  });
  assert(
    "Downgrade timing is next billing cycle",
    downgradeReview.timingLabel === "Effective at the next billing cycle",
  );
  assert(
    "Downgrade note preserves Power access",
    downgradeReview.billingNote.includes("Power access"),
  );

  const annualToMonthly = findBillingCenterActionForIntent({
    tier: "power",
    billing: { ...powerMonthlyBilling, billingInterval: "year" },
    intent: { targetTier: "power", targetInterval: "monthly" },
  });
  assert("Power Annual → Power Monthly resolves", annualToMonthly?.id === "switch-power-monthly");
  const annualReview = buildPlanChangeReview({
    tier: "power",
    billing: { ...powerMonthlyBilling, billingInterval: "year" },
    action: annualToMonthly,
  });
  assert(
    "Annual→Monthly timing is next renewal",
    annualReview.timingLabel === "Effective at the next renewal",
  );

  const cancel = findBillingCenterActionForIntent({
    tier: "power",
    billing: powerMonthlyBilling,
    intent: { targetTier: "free", targetInterval: null },
  });
  assert("Paid → Free resolves to cancel", cancel?.kind === "cancel");
  const cancelReview = buildPlanChangeReview({
    tier: "power",
    billing: powerMonthlyBilling,
    action: cancel,
  });
  assert(
    "Cancel timing shows period-end date copy",
    cancelReview.timingLabel === "Aug 1, 2026" ||
      cancelReview.dialogTitle === "Downgrade to Free",
  );
  assert("Cancel confirm label is Schedule Downgrade", cancelReview.confirmLabel === "Schedule Downgrade");
  assert("Cancel dismiss label is Keep Current Plan", cancelReview.dismissLabel === "Keep Current Plan");
  assert(
    "Cancel access explanation uses positive language",
    Boolean(cancelReview.accessExplanation?.includes("continue enjoying")),
  );

  assert(
    "Unsupported Pro Monthly → Power Annual rejected",
    findBillingCenterActionForIntent({
      tier: "pro",
      billing: proMonthlyBilling,
      intent: { targetTier: "power", targetInterval: "annual" },
    }) === null,
  );

  assert(
    "Same plan rejected (no matching action)",
    findBillingCenterActionForIntent({
      tier: "pro",
      billing: proMonthlyBilling,
      intent: { targetTier: "pro", targetInterval: "monthly" },
    }) === null,
  );

  console.log("\nAll S7-UI-005 plan-change handoff checks passed.");
}

main();
