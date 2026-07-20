/**
 * S7-UI-004 / S7-UI-004A — compare display catalog amounts to Stripe Sandbox Price unit_amounts.
 * Run: npx tsx scripts/verify-s7-ui-004-pricing-display.mjs
 *
 * Does not print Stripe Price IDs.
 */
import { config } from "dotenv";
import Stripe from "stripe";
import {
  APPROVED_BETA_AMOUNT_MINORS,
  formatPriceAmount,
  getAnnualSavings,
  getPaidPlanPricePresentation,
  getPricingDisplayEntry,
} from "../lib/pricing/pricing-display-catalog.ts";

config({ path: ".env.local" });

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

async function retrieveUnitAmount(stripe, envName) {
  const priceId = process.env[envName]?.trim();

  if (!priceId) {
    return { envName, missing: true, unitAmount: null };
  }

  const price = await stripe.prices.retrieve(priceId);
  return {
    envName,
    missing: false,
    unitAmount: price.unit_amount,
    currency: price.currency,
  };
}

async function main() {
  console.log("S7-UI-004A Pricing Display Catalog\n");

  assert("Free is $0", getPricingDisplayEntry("free").amountMinor === 0);
  assert("Pro Monthly is $9.99", getPricingDisplayEntry("pro", "month").amountMinor === 999);
  assert("Pro Annual is $99.99", getPricingDisplayEntry("pro", "year").amountMinor === 9999);
  assert("Power Monthly is $19.99", getPricingDisplayEntry("power", "month").amountMinor === 1999);
  assert("Power Annual is $199.99", getPricingDisplayEntry("power", "year").amountMinor === 19999);

  const proSavings = getAnnualSavings("pro");
  assert("Pro annual savings is $19.89", proSavings.annualSavingsMinor === 1989);
  assert(
    "Pro effective monthly rounds to $8.33",
    proSavings.effectiveMonthlyMinor === Math.round(9999 / 12) &&
      proSavings.effectiveMonthlyMinor === 833,
  );

  const powerSavings = getAnnualSavings("power");
  assert("Power annual savings is $39.89", powerSavings.annualSavingsMinor === 3989);
  assert(
    "Power effective monthly rounds to $16.67",
    powerSavings.effectiveMonthlyMinor === Math.round(19999 / 12) &&
      powerSavings.effectiveMonthlyMinor === 1667,
  );

  assert("formatPriceAmount($9.99)", formatPriceAmount(999) === "$9.99");
  assert("formatPriceAmount($99.99)", formatPriceAmount(9999) === "$99.99");
  assert("formatPriceAmount($199.99)", formatPriceAmount(19999) === "$199.99");
  assert("formatPriceAmount($0)", formatPriceAmount(0) === "$0");

  const proAnnualUi = getPaidPlanPricePresentation("pro", "annual");
  assert("Pro annual UI amount is $99.99", proAnnualUi.amountLabel === "$99.99");
  assert(
    "Pro annual savings label includes $19.89",
    Boolean(proAnnualUi.savingsLabel?.includes("$19.89")),
  );
  assert(
    "Pro annual equivalent uses $8.33",
    Boolean(proAnnualUi.equivalentMonthlyLabel?.includes("$8.33")),
  );

  const powerAnnualUi = getPaidPlanPricePresentation("power", "annual");
  assert("Power annual UI amount is $199.99", powerAnnualUi.amountLabel === "$199.99");
  assert(
    "Power annual savings label includes $39.89",
    Boolean(powerAnnualUi.savingsLabel?.includes("$39.89")),
  );
  assert(
    "Power annual equivalent uses $16.67",
    Boolean(powerAnnualUi.equivalentMonthlyLabel?.includes("$16.67")),
  );

  const secret = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secret) {
    console.log("\n⚠ STRIPE_SECRET_KEY missing — skipped Sandbox amount match");
    console.log("\nAll local S7-UI-004A display catalog checks passed.");
    return;
  }

  const stripe = new Stripe(secret, {
    apiVersion: "2026-06-24.dahlia",
  });

  const checks = [
    ["STRIPE_PRICE_PRO_MONTHLY", APPROVED_BETA_AMOUNT_MINORS.pro_month],
    ["STRIPE_PRICE_PRO_ANNUAL", APPROVED_BETA_AMOUNT_MINORS.pro_year],
    ["STRIPE_PRICE_POWER_MONTHLY", APPROVED_BETA_AMOUNT_MINORS.power_month],
    ["STRIPE_PRICE_POWER_ANNUAL", APPROVED_BETA_AMOUNT_MINORS.power_year],
  ];

  console.log("\nStripe Sandbox unit_amount match (IDs not printed):\n");

  for (const [envName, expected] of checks) {
    const result = await retrieveUnitAmount(stripe, envName);

    if (result.missing) {
      throw new Error(`FAIL: ${envName} not set — required for S7-UI-004A Stripe verification`);
    }

    assert(
      `${envName} unit_amount matches display catalog (${expected})`,
      result.unitAmount === expected,
    );
    assert(`${envName} currency is usd`, result.currency === "usd");
  }

  console.log("\nAll S7-UI-004A pricing display checks passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
