/**
 * BLP-BILL-FIX-001 / REV1 — Billing Center + Pricing entitlement vs Stripe billing.
 * Run: npx tsx scripts/verify-blp-bill-fix-001-billing-center-actions.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BILLING_NOT_BILLED_LABEL,
  DEVELOPMENT_PLAN_OVERRIDE_LABEL,
  formatCurrentSubscriptionAmount,
  getBillingCenterActions,
  isEntitlementWithoutStripeBilling,
} from "../lib/billing/billing-center.ts";
import { getEffectivePlan, isExecutivePlan } from "../lib/account/plan.ts";
import {
  getCheckoutPlanButtonConfig,
  isPricingCurrentPlanCard,
  isSimulatedPaidEntitlement,
} from "../lib/pricing/checkout-plan-actions.ts";

const proPlan = { id: "pro", cta: "Upgrade to Pro", ctaStyle: "btn-primary" };
const powerPlan = { id: "power", cta: "Upgrade to Power", ctaStyle: "btn-secondary" };
const freePlan = { id: "free", cta: "Get Started", ctaStyle: "btn-secondary" };

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function billing(overrides = {}) {
  return {
    status: "inactive",
    stripeStatus: null,
    billingInterval: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    lastSynchronizedAt: null,
    hasPaidStripeSubscription: false,
    ...overrides,
  };
}

function actionIds(actions) {
  return actions.map((a) => a.id);
}

function main() {
  console.log("\nBLP-BILL-FIX-001 Billing Center actions verification\n");

  // 1. Free + no Stripe
  const freeActions = getBillingCenterActions({
    tier: "free",
    billing: billing(),
  });
  assert("Free: Pro Checkout shown", freeActions.some((a) => a.id === "checkout-pro-monthly"));
  assert("Free: Power Checkout shown", freeActions.some((a) => a.id === "checkout-power-monthly"));
  assert("Free: all actions are checkout", freeActions.every((a) => a.kind === "checkout"));
  assert(
    "Free amount is catalog $0",
    formatCurrentSubscriptionAmount("free", billing()) === "$0",
  );

  // 2. Dev Pro + no Stripe
  const devProBilling = billing({ status: "active" });
  const devProActions = getBillingCenterActions({
    tier: "pro",
    billing: devProBilling,
  });
  assert("Dev Pro: no actions", devProActions.length === 0);
  assert(
    "Dev Pro: Upgrade to Pro Checkout absent",
    !actionIds(devProActions).includes("checkout-pro-monthly"),
  );
  assert(
    "Dev Pro: Power Checkout absent",
    !actionIds(devProActions).includes("checkout-power-monthly"),
  );
  assert("Dev Pro: entitlement without Stripe", isEntitlementWithoutStripeBilling("pro", devProBilling));
  assert(
    "Dev Pro amount is Not billed",
    formatCurrentSubscriptionAmount("pro", devProBilling) === BILLING_NOT_BILLED_LABEL,
  );

  // 3. Dev Power + no Stripe
  const devPowerBilling = billing({ status: "active" });
  const devPowerActions = getBillingCenterActions({
    tier: "power",
    billing: devPowerBilling,
  });
  assert("Dev Power: no actions", devPowerActions.length === 0);
  assert("Dev Power: Pro Checkout absent", !actionIds(devPowerActions).includes("checkout-pro-monthly"));
  assert("Dev Power: Power Checkout absent", !actionIds(devPowerActions).includes("checkout-power-monthly"));
  assert(
    "Dev Power amount is Not billed",
    formatCurrentSubscriptionAmount("power", devPowerBilling) === BILLING_NOT_BILLED_LABEL,
  );

  // 4. Paid Pro Monthly
  const paidProMonth = billing({
    status: "active",
    stripeStatus: "active",
    billingInterval: "month",
    currentPeriodStart: "2026-07-01T00:00:00Z",
    currentPeriodEnd: "2026-08-01T00:00:00Z",
    hasPaidStripeSubscription: true,
  });
  const paidProMonthActions = getBillingCenterActions({
    tier: "pro",
    billing: paidProMonth,
  });
  assert(
    "Paid Pro Monthly: Upgrade to Pro Checkout absent",
    !actionIds(paidProMonthActions).includes("checkout-pro-monthly"),
  );
  assert(
    "Paid Pro Monthly: Power Monthly upgrade available",
    paidProMonthActions.some((a) => a.id === "upgrade-power-month" && a.kind === "upgrade"),
  );
  assert(
    "Paid Pro Monthly amount uses catalog",
    formatCurrentSubscriptionAmount("pro", paidProMonth) === "$9.99/month",
  );

  // 5. Paid Pro Annual
  const paidProYear = billing({
    status: "active",
    stripeStatus: "active",
    billingInterval: "year",
    currentPeriodStart: "2026-01-01T00:00:00Z",
    currentPeriodEnd: "2027-01-01T00:00:00Z",
    hasPaidStripeSubscription: true,
  });
  const paidProYearActions = getBillingCenterActions({
    tier: "pro",
    billing: paidProYear,
  });
  assert(
    "Paid Pro Annual: Upgrade to Pro Checkout absent",
    !actionIds(paidProYearActions).includes("checkout-pro-monthly"),
  );
  assert(
    "Paid Pro Annual: Power Annual upgrade available",
    paidProYearActions.some((a) => a.id === "upgrade-power-year" && a.kind === "upgrade"),
  );

  // 6. Paid Power — no duplicate upgrade-to-power
  const paidPower = billing({
    status: "active",
    stripeStatus: "active",
    billingInterval: "month",
    currentPeriodStart: "2026-07-01T00:00:00Z",
    currentPeriodEnd: "2026-08-01T00:00:00Z",
    hasPaidStripeSubscription: true,
  });
  const paidPowerActions = getBillingCenterActions({
    tier: "power",
    billing: paidPower,
  });
  assert(
    "Paid Power: no Power upgrade / checkout",
    !paidPowerActions.some(
      (a) =>
        a.kind === "checkout" ||
        (a.kind === "upgrade" && a.targetTier === "power"),
    ),
  );

  // 7. Checkout guard remains Free-only (effective Pro still fails the server rule)
  const effectivePro = getEffectivePlan(
    { plan: "pro" },
    {
      plan: "pro",
      status: "active",
      stripe_status: null,
      stripe_subscription_id: null,
    },
  );
  assert("Effective plan for simulated Pro is pro", effectivePro === "pro");
  assert("Simulated Pro is executive (Checkout-blocked)", isExecutivePlan(effectivePro));

  const checkoutSrc = readFileSync(resolve("lib/stripe/checkout.ts"), "utf8");
  assert(
    "Checkout Free-only message preserved",
    checkoutSrc.includes(
      "Checkout is only available when starting a new paid subscription from Free.",
    ),
  );
  assert(
    "Checkout still uses Free-user entitlement gate",
    checkoutSrc.includes("assertFreeUserForNewSubscriptionCheckout") &&
      (checkoutSrc.includes("getEffectivePlan") ||
        checkoutSrc.includes("resolveEntitlementPlan")),
  );

  // UI / docs markers
  const uiSrc = readFileSync(resolve("components/billing/BillingCenter.tsx"), "utf8");
  assert("UI references development override label", uiSrc.includes("DEVELOPMENT_PLAN_OVERRIDE_LABEL"));
  assert(
    "Override label constant text",
    DEVELOPMENT_PLAN_OVERRIDE_LABEL === "Development plan override",
  );
  assert(
    "UI routes checkout kinds through startStripeCheckout only",
    uiSrc.includes('action.kind === "checkout"') && uiSrc.includes("startStripeCheckout"),
  );

  const actionsSrc = readFileSync(resolve("lib/billing/billing-center.ts"), "utf8");
  assert(
    "Action matrix no longer treats all no-Stripe as Free checkout",
    !/tier === "free" \|\| !billing\.hasPaidStripeSubscription/.test(actionsSrc),
  );
  assert(
    "Action matrix gates Checkout on free tier only",
    actionsSrc.includes('if (tier === "free")'),
  );

  // ── BLP-BILL-FIX-001-REV1: Pricing current-plan / action matrix ──────────
  console.log("\nBLP-BILL-FIX-001-REV1 Pricing current-plan verification\n");

  assert(
    "Simulated Pro detected",
    isSimulatedPaidEntitlement("pro", false) === true,
  );
  assert(
    "Real Pro not simulated",
    isSimulatedPaidEntitlement("pro", true) === false,
  );
  assert(
    "Free not simulated paid",
    isSimulatedPaidEntitlement("free", false) === false,
  );

  // Free + no Stripe
  assert(
    "Pricing Free: Free current",
    isPricingCurrentPlanCard({
      planId: "free",
      currentTier: "free",
      isSignedIn: true,
      currentBillingInterval: null,
      displayedBillingInterval: "monthly",
      hasPaidStripeSubscription: false,
    }),
  );
  const freeUpgradePro = getCheckoutPlanButtonConfig(
    proPlan,
    "free",
    true,
    null,
    "monthly",
    false,
  );
  assert("Pricing Free: Pro checkout enabled", !freeUpgradePro.disabled && !freeUpgradePro.href);
  assert("Pricing Free: Pro not current", !freeUpgradePro.isCurrentPlan);

  // Dev Pro + no Stripe + authorized override — entitlement current; no interval ownership
  assert(
    "Pricing Dev Pro without override: not treated as Current Plan",
    !isPricingCurrentPlanCard({
      planId: "pro",
      currentTier: "pro",
      isSignedIn: true,
      currentBillingInterval: null,
      displayedBillingInterval: "monthly",
      hasPaidStripeSubscription: false,
      developmentSubscriptionOverrideActive: false,
    }),
  );
  assert(
    "Pricing Dev Pro Monthly toggle: Pro is current entitlement",
    isPricingCurrentPlanCard({
      planId: "pro",
      currentTier: "pro",
      isSignedIn: true,
      currentBillingInterval: null,
      displayedBillingInterval: "monthly",
      hasPaidStripeSubscription: false,
      developmentSubscriptionOverrideActive: true,
    }),
  );
  assert(
    "Pricing Dev Pro Annual toggle: Pro still current entitlement (no interval ownership)",
    isPricingCurrentPlanCard({
      planId: "pro",
      currentTier: "pro",
      isSignedIn: true,
      currentBillingInterval: null,
      displayedBillingInterval: "annual",
      hasPaidStripeSubscription: false,
      developmentSubscriptionOverrideActive: true,
    }),
  );
  const devProCurrent = getCheckoutPlanButtonConfig(
    proPlan,
    "pro",
    true,
    null,
    "monthly",
    false,
    true,
  );
  assert("Pricing Dev Pro: Current Plan label", devProCurrent.isCurrentPlan && devProCurrent.disabled);
  assert(
    "Pricing Dev Pro: override helper",
    String(devProCurrent.helperText).includes("Development plan override"),
  );
  assert(
    "Pricing Dev Pro: no Switch to Pro Monthly",
    !String(devProCurrent.label).includes("Switch to Pro"),
  );
  const devProPower = getCheckoutPlanButtonConfig(
    powerPlan,
    "pro",
    true,
    null,
    "monthly",
    false,
    true,
  );
  assert("Pricing Dev Pro: Power Stripe action suppressed", devProPower.disabled === true);
  assert("Pricing Dev Pro: Power has no Checkout/handoff href", !devProPower.href);
  const devProFree = getCheckoutPlanButtonConfig(
    freePlan,
    "pro",
    true,
    null,
    "monthly",
    false,
    true,
  );
  assert("Pricing Dev Pro: Free Stripe handoff suppressed", devProFree.disabled === true);
  assert("Pricing Dev Pro: Free has no Billing href", !devProFree.href);

  // Dev Power + no Stripe + authorized override
  assert(
    "Pricing Dev Power: Power current entitlement",
    isPricingCurrentPlanCard({
      planId: "power",
      currentTier: "power",
      isSignedIn: true,
      currentBillingInterval: null,
      displayedBillingInterval: "monthly",
      hasPaidStripeSubscription: false,
      developmentSubscriptionOverrideActive: true,
    }),
  );
  const devPowerCurrent = getCheckoutPlanButtonConfig(
    powerPlan,
    "power",
    true,
    null,
    "annual",
    false,
    true,
  );
  assert("Pricing Dev Power: Current Plan", devPowerCurrent.isCurrentPlan && devPowerCurrent.disabled);
  const devPowerPro = getCheckoutPlanButtonConfig(
    proPlan,
    "power",
    true,
    null,
    "monthly",
    false,
    true,
  );
  assert("Pricing Dev Power: Pro Stripe action suppressed", devPowerPro.disabled === true);
  assert("Pricing Dev Power: Pro has no handoff href", !devPowerPro.href);

  // Real Pro Monthly — tier + interval intact
  assert(
    "Pricing Real Pro Monthly + Monthly: current",
    isPricingCurrentPlanCard({
      planId: "pro",
      currentTier: "pro",
      isSignedIn: true,
      currentBillingInterval: "month",
      displayedBillingInterval: "monthly",
      hasPaidStripeSubscription: true,
    }),
  );
  assert(
    "Pricing Real Pro Monthly + Annual: not current",
    !isPricingCurrentPlanCard({
      planId: "pro",
      currentTier: "pro",
      isSignedIn: true,
      currentBillingInterval: "month",
      displayedBillingInterval: "annual",
      hasPaidStripeSubscription: true,
    }),
  );
  const realProSwitchAnnual = getCheckoutPlanButtonConfig(
    proPlan,
    "pro",
    true,
    "month",
    "annual",
    true,
  );
  assert(
    "Pricing Real Pro Monthly viewing Annual: Switch to Pro Annual",
    realProSwitchAnnual.label === "Switch to Pro Annual" && Boolean(realProSwitchAnnual.href),
  );
  assert(
    "Pricing Real Pro: helper is not Dev override",
    !String(realProSwitchAnnual.helperText ?? "").includes("Development plan override"),
  );

  // Real Pro Annual
  assert(
    "Pricing Real Pro Annual + Annual: current",
    isPricingCurrentPlanCard({
      planId: "pro",
      currentTier: "pro",
      isSignedIn: true,
      currentBillingInterval: "year",
      displayedBillingInterval: "annual",
      hasPaidStripeSubscription: true,
    }),
  );
  const realProSwitchMonthly = getCheckoutPlanButtonConfig(
    proPlan,
    "pro",
    true,
    "year",
    "monthly",
    true,
  );
  assert(
    "Pricing Real Pro Annual viewing Monthly: Switch to Pro Monthly",
    realProSwitchMonthly.label === "Switch to Pro Monthly",
  );

  // Real Power Monthly / Annual
  assert(
    "Pricing Real Power Monthly + Monthly: current",
    isPricingCurrentPlanCard({
      planId: "power",
      currentTier: "power",
      isSignedIn: true,
      currentBillingInterval: "month",
      displayedBillingInterval: "monthly",
      hasPaidStripeSubscription: true,
    }),
  );
  assert(
    "Pricing Real Power Annual + Annual: current",
    isPricingCurrentPlanCard({
      planId: "power",
      currentTier: "power",
      isSignedIn: true,
      currentBillingInterval: "year",
      displayedBillingInterval: "annual",
      hasPaidStripeSubscription: true,
    }),
  );

  const pricingUi = readFileSync(resolve("components/pricing/PricingPlans.tsx"), "utf8");
  assert(
    "Pricing UI passes hasPaidStripeSubscription into matchers",
    pricingUi.includes("hasPaidStripeSubscription"),
  );
  assert(
    "Pricing UI uses Development plan override label",
    pricingUi.includes("DEVELOPMENT_PLAN_OVERRIDE_LABEL"),
  );
  assert(
    "Pricing provider exposes hasPaidStripeSubscription",
    readFileSync(resolve("lib/hooks/SubscriptionTierProvider.tsx"), "utf8").includes(
      "hasPaidStripeSubscription",
    ),
  );

  console.log("\nPASS: BLP-BILL-FIX-001 / REV1 Billing Center + Pricing verification\n");
}

main();
