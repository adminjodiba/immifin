/**
 * S7-STR-005A — pricing current-plan and paid-user button verification.
 * Updated for S7-UI-003 interval-aware current-plan matching.
 * Run: npx tsx scripts/verify-s7-str-005a-pricing-plan-ui.mjs
 */

import { getEffectivePlan } from "../lib/account/plan.ts";
import {
  getCheckoutPlanButtonConfig,
  isPricingCurrentPlanCard,
} from "../lib/pricing/checkout-plan-actions.ts";

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

function main() {
  assert(
    "Free user: only Free is current",
    isPricingCurrentPlanCard({
      planId: "free",
      currentTier: "free",
      isSignedIn: true,
      currentBillingInterval: null,
      displayedBillingInterval: "monthly",
    }),
  );
  assert(
    "Free user: Pro is not current",
    !isPricingCurrentPlanCard({
      planId: "pro",
      currentTier: "free",
      isSignedIn: true,
      currentBillingInterval: null,
      displayedBillingInterval: "monthly",
    }),
  );

  const freeProButton = getCheckoutPlanButtonConfig(proPlan, "free", true, null, "monthly");
  assert("Free user: Pro checkout enabled", !freeProButton.disabled);
  assert("Free user: Pro is not current button", !freeProButton.isCurrentPlan);

  const proCurrent = getCheckoutPlanButtonConfig(proPlan, "pro", true, "month", "monthly");
  assert("Pro user: Pro is current", proCurrent.isCurrentPlan);
  assert("Pro user: Pro button disabled", proCurrent.disabled);

  const proFreeCard = getCheckoutPlanButtonConfig(freePlan, "pro", true, "month", "monthly");
  assert("Pro user: Free is not current", !proFreeCard.isCurrentPlan);
  assert("Pro user: Free shows downgrade copy", proFreeCard.label === "Downgrade to Free");
  assert("Pro user: Free points to Billing Center", proFreeCard.href?.startsWith("/account/billing") === true);
  assert(
    "Pro user: Free handoff includes targetTier=free",
    proFreeCard.href === "/account/billing?targetTier=free",
  );
  assert(
    "Pro user: Free billing helper",
    proFreeCard.helperText === "Manage plan changes in Subscription & Billing.",
  );
  assert("Pro user: Free navigates to Billing Center", !proFreeCard.disabled);

  const proPowerCard = getCheckoutPlanButtonConfig(powerPlan, "pro", true, "month", "monthly");
  assert("Pro user: Power shows upgrade copy", proPowerCard.label === "Upgrade to Power");
  assert(
    "Pro user: Power billing helper",
    proPowerCard.helperText === "Manage plan changes in Subscription & Billing.",
  );
  assert(
    "Pro user: Power points to Billing Center with intent",
    proPowerCard.href === "/account/billing?targetTier=power&targetInterval=monthly",
  );

  const powerCurrent = getCheckoutPlanButtonConfig(powerPlan, "power", true, "month", "monthly");
  assert("Power user: Power is current", powerCurrent.isCurrentPlan);

  const powerProCard = getCheckoutPlanButtonConfig(proPlan, "power", true, "month", "monthly");
  assert("Power user: Pro shows downgrade copy", powerProCard.label === "Downgrade to Pro");
  assert(
    "Power user: Pro billing helper",
    powerProCard.helperText === "Manage plan changes in Subscription & Billing.",
  );
  assert(
    "Power user: Pro points to Billing Center with intent",
    powerProCard.href === "/account/billing?targetTier=pro&targetInterval=monthly",
  );

  const powerFreeCard = getCheckoutPlanButtonConfig(freePlan, "power", true, "month", "monthly");
  assert("Power user: Free shows downgrade copy", powerFreeCard.label === "Downgrade to Free");
  assert(
    "Power user: Free points to Billing Center with intent",
    powerFreeCard.href === "/account/billing?targetTier=free",
  );

  const syncedPlan = getEffectivePlan(
    { plan: "free" },
    {
      plan: "pro",
      stripe_subscription_id: "sub_123",
      last_synchronized_at: "2026-07-13T00:00:00.000Z",
      stripe_status: "active",
    },
  );
  assert("Synchronized Stripe subscription wins over profile.plan", syncedPlan === "pro");

  console.log("\nAll S7-STR-005A pricing plan UI checks passed.");
}

main();
