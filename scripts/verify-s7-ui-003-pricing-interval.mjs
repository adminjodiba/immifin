/**
 * S7-UI-003 — Pricing current-plan interval awareness.
 * Run: npx tsx scripts/verify-s7-ui-003-pricing-interval.mjs
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

function isCurrent(planId, currentTier, interval, displayed) {
  return isPricingCurrentPlanCard({
    planId,
    currentTier,
    isSignedIn: true,
    currentBillingInterval: interval,
    displayedBillingInterval: displayed,
  });
}

function button(plan, currentTier, interval, displayed) {
  return getCheckoutPlanButtonConfig(plan, currentTier, true, interval, displayed);
}

function main() {
  assert("Free on Monthly: Free is current", isCurrent("free", "free", null, "monthly"));
  assert("Free on Annual: Free is current", isCurrent("free", "free", null, "annual"));
  assert("Free on Monthly: Pro is not current", !isCurrent("pro", "free", null, "monthly"));

  const freePro = button(proPlan, "free", null, "annual");
  assert("Free user: Pro checkout enabled", !freePro.disabled && !freePro.href);
  assert("Free user: Pro is not current button", !freePro.isCurrentPlan);

  assert("Pro Monthly + Monthly: Pro current", isCurrent("pro", "pro", "month", "monthly"));
  assert("Pro Monthly + Annual: Pro not current", !isCurrent("pro", "pro", "month", "annual"));

  const proOnMonthly = button(proPlan, "pro", "month", "monthly");
  assert("Pro Monthly view: Current Plan button", proOnMonthly.isCurrentPlan && proOnMonthly.disabled);

  const proSwitchAnnual = button(proPlan, "pro", "month", "annual");
  assert(
    "Pro Monthly viewing Annual: Switch to Pro Annual",
    proSwitchAnnual.label === "Switch to Pro Annual",
  );
  assert(
    "Pro Monthly viewing Annual: Billing Center link",
    proSwitchAnnual.href === "/account/billing?targetTier=pro&targetInterval=annual",
  );
  assert("Pro Monthly viewing Annual: not current", !proSwitchAnnual.isCurrentPlan);

  const proUpgradePower = button(powerPlan, "pro", "month", "monthly");
  assert("Pro Monthly viewing Power Monthly: Upgrade to Power", proUpgradePower.label === "Upgrade to Power");
  assert("Pro Monthly viewing Power: no Checkout", Boolean(proUpgradePower.href));

  assert("Pro Annual + Annual: Pro current", isCurrent("pro", "pro", "year", "annual"));
  assert("Pro Annual + Monthly: Pro not current", !isCurrent("pro", "pro", "year", "monthly"));

  const proSwitchMonthly = button(proPlan, "pro", "year", "monthly");
  assert(
    "Pro Annual viewing Monthly: Switch to Pro Monthly",
    proSwitchMonthly.label === "Switch to Pro Monthly",
  );

  assert("Power Monthly + Monthly: Power current", isCurrent("power", "power", "month", "monthly"));
  assert("Power Monthly + Annual: Power not current", !isCurrent("power", "power", "month", "annual"));

  const powerSwitchAnnual = button(powerPlan, "power", "month", "annual");
  assert(
    "Power Monthly viewing Annual: Switch to Power Annual",
    powerSwitchAnnual.label === "Switch to Power Annual",
  );
  assert(
    "Power Monthly viewing Annual: Billing Center",
    powerSwitchAnnual.href === "/account/billing?targetTier=power&targetInterval=annual",
  );

  const powerDowngrade = button(proPlan, "power", "month", "monthly");
  assert("Power Monthly viewing Pro Monthly: Downgrade to Pro", powerDowngrade.label === "Downgrade to Pro");

  assert("Power Annual + Annual: Power current", isCurrent("power", "power", "year", "annual"));
  assert("Power Annual + Monthly: Power not current", !isCurrent("power", "power", "year", "monthly"));

  const powerSwitchMonthly = button(powerPlan, "power", "year", "monthly");
  assert(
    "Power Annual viewing Monthly: Switch to Power Monthly",
    powerSwitchMonthly.label === "Switch to Power Monthly",
  );

  assert(
    "At most one current among paid cards for Power monthly / Annual toggle",
    !isCurrent("pro", "power", "month", "annual") && !isCurrent("power", "power", "month", "annual"),
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

  console.log("\nAll S7-UI-003 pricing interval checks passed.");
}

main();
