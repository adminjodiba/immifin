/**
 * S7-BILLING-UX-008B — Scheduled plan change visibility & duplicate action suppression.
 * Run: npx tsx scripts/verify-s7-billing-ux-008b-scheduled-plan-visibility.mjs
 *
 * Injected fakes / source contracts only — no Stripe network / no schedule mutation.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  mapScheduleToCustomerSafePlanChange,
  scheduledPlanChangeMatchesAction,
} from "../lib/billing/scheduled-plan-change.ts";
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

function readSource(relPath) {
  const full = resolve(relPath);
  if (!existsSync(full)) {
    throw new Error(`Missing file: ${relPath}`);
  }
  return readFileSync(full, "utf8");
}

const CATALOG = {
  price_power_month: { tier: "power", interval: "month" },
  price_pro_month: { tier: "pro", interval: "month" },
  price_power_year: { tier: "power", interval: "year" },
};

function lookup(priceId) {
  return CATALOG[priceId] ?? null;
}

const POWER_BILLING = {
  status: "active",
  stripeStatus: "active",
  billingInterval: "month",
  currentPeriodStart: "2026-08-25T17:46:58.000Z",
  currentPeriodEnd: "2026-09-25T17:46:58.000Z",
  cancelAtPeriodEnd: false,
  canceledAt: null,
  lastSynchronizedAt: "2026-08-25T19:40:31.000Z",
  hasPaidStripeSubscription: true,
  scheduledPlanChange: null,
};

function main() {
  const none = mapScheduleToCustomerSafePlanChange({
    schedule: null,
    currentPriceId: "price_power_month",
    lookupCatalogPrice: lookup,
  });
  assert("no Stripe schedule → scheduledPlanChange null", none === null);

  const powerToPro = mapScheduleToCustomerSafePlanChange({
    schedule: {
      status: "active",
      currentPhase: {
        startDateUnix: 1787680018,
        endDateUnix: 1790358418,
      },
      phases: [
        { startDateUnix: 1787680018, priceId: "price_power_month" },
        { startDateUnix: 1790358418, priceId: "price_pro_month" },
      ],
    },
    currentPriceId: "price_power_month",
    lookupCatalogPrice: lookup,
  });
  assert("Power→Pro next phase maps to pro", powerToPro?.targetTier === "pro");
  assert("Power→Pro next phase maps to month", powerToPro?.targetInterval === "month");
  assert(
    "effective date is Stripe unix converted to ISO",
    powerToPro?.effectiveAt === "2026-09-25T17:46:58.000Z",
  );

  const unknown = mapScheduleToCustomerSafePlanChange({
    schedule: {
      status: "active",
      currentPhase: { startDateUnix: 1787680018, endDateUnix: 1790358418 },
      phases: [
        { startDateUnix: 1787680018, priceId: "price_power_month" },
        { startDateUnix: 1790358418, priceId: "price_unknown_not_in_catalog" },
      ],
    },
    currentPriceId: "price_power_month",
    lookupCatalogPrice: lookup,
  });
  assert("unknown price fails safely → null", unknown === null);

  for (const status of ["canceled", "completed", "released"]) {
    const terminal = mapScheduleToCustomerSafePlanChange({
      schedule: {
        status,
        currentPhase: { startDateUnix: 1787680018, endDateUnix: 1790358418 },
        phases: [
          { startDateUnix: 1787680018, priceId: "price_power_month" },
          { startDateUnix: 1790358418, priceId: "price_pro_month" },
        ],
      },
      currentPriceId: "price_power_month",
      lookupCatalogPrice: lookup,
    });
    assert(`${status} schedule does not create a false scheduled change`, terminal === null);
  }

  const samePrice = mapScheduleToCustomerSafePlanChange({
    schedule: {
      status: "active",
      currentPhase: { startDateUnix: 1787680018, endDateUnix: 1790358418 },
      phases: [
        { startDateUnix: 1787680018, priceId: "price_power_month" },
        { startDateUnix: 1790358418, priceId: "price_power_month" },
      ],
    },
    currentPriceId: "price_power_month",
    lookupCatalogPrice: lookup,
  });
  assert("same-plan next phase does not show a plan change", samePrice === null);

  const describedNone = describeScheduledChange(POWER_BILLING);
  assert("no schedule → Scheduled plan change None", describedNone === "None");

  const described = describeScheduledChange({
    ...POWER_BILLING,
    scheduledPlanChange: powerToPro,
  });
  assert("summary names Pro Monthly", /Pro Monthly/.test(described));
  assert("summary includes effective date", /Sep 25, 2026/.test(described));
  assert("does not say None when schedule is recognized", !/^None$/.test(described));

  const withoutSchedule = getBillingCenterActions({
    tier: "power",
    billing: POWER_BILLING,
  });
  assert(
    "without schedule, Downgrade to Pro Monthly is available",
    withoutSchedule.some((a) => a.id === "downgrade-pro-month"),
  );

  const withSchedule = getBillingCenterActions({
    tier: "power",
    billing: { ...POWER_BILLING, scheduledPlanChange: powerToPro },
  });
  assert(
    "exact duplicate Downgrade to Pro Monthly is suppressed",
    !withSchedule.some((a) => a.id === "downgrade-pro-month"),
  );
  assert(
    "Downgrade to Free remains available (not a duplicate paid destination)",
    withSchedule.some((a) => a.id === "downgrade-to-free"),
  );
  assert(
    "Switch to Power Annual suppressed (immediate upgrade 409s while schedule exists)",
    !withSchedule.some((a) => a.id === "switch-power-annual"),
  );

  assert(
    "matcher: duplicate Pro Monthly",
    scheduledPlanChangeMatchesAction({
      scheduled: powerToPro,
      targetTier: "pro",
      targetInterval: "monthly",
    }),
  );
  assert(
    "matcher: Power Annual is not the scheduled destination",
    !scheduledPlanChangeMatchesAction({
      scheduled: powerToPro,
      targetTier: "power",
      targetInterval: "annual",
    }),
  );

  const readSrc = readSource("lib/stripe/scheduled-plan-change-read.ts");
  assert("read path retrieves subscriptions", /subscriptions\.retrieve/.test(readSrc));
  assert("read path retrieves schedules", /subscriptionSchedules\.retrieve/.test(readSrc));
  assert("read path does not create schedules", !/subscriptionSchedules\.create/.test(readSrc));
  assert("read path does not update schedules", !/subscriptionSchedules\.update/.test(readSrc));
  assert("read path does not cancel schedules", !/subscriptionSchedules\.cancel/.test(readSrc));
  assert("read path does not release schedules", !/subscriptionSchedules\.release/.test(readSrc));
  assert("read path does not update subscriptions", !/subscriptions\.update/.test(readSrc));

  const routeSrc = readSource("app/api/account/subscription/route.ts");
  assert(
    "GET uses server-side schedule resolver",
    /resolveLiveScheduledBillingStateFromStripe/.test(routeSrc),
  );
  assert("GET response includes scheduledPlanChange", /scheduledPlanChange/.test(routeSrc));
  assert("GET does not return schedule id", !/scheduleId|sub_sched/.test(routeSrc));

  const uiSrc = readSource("components/billing/BillingCenter.tsx");
  assert("Billing Center still uses describeScheduledChange", /describeScheduledChange/.test(uiSrc));
  assert("Billing Center notes remaining access until effective date", /access remains active until/.test(uiSrc));

  const mapperSrc = readSource("lib/billing/scheduled-plan-change.ts");
  assert("mapper has no Stripe IDs in customer-safe type", !/scheduleId|priceId/.test(
    mapperSrc.split("export type ScheduledPlanChange")[1]?.split("export type Catalog")[0] ?? "",
  ));

  console.log("\nS7-BILLING-UX-008B verification passed.");
}

main();
