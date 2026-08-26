/**
 * S7-BILLING-UX-007 — Scheduled downgrade transparency.
 * Run: npx tsx scripts/verify-s7-billing-ux-007-scheduled-downgrade-transparency.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import Module from "node:module";
import { resolve } from "node:path";

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") return {};
  return originalLoad(request, parent, isMain);
};

function assert(label, condition) {
  if (!condition) throw new Error(`FAIL: ${label}`);
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

function assertSource(relPath, needle, label = `${relPath} contains ${needle}`) {
  assert(label, readSource(relPath).includes(needle));
}

function assertSourceAbsent(relPath, needle, label = `${relPath} lacks ${needle}`) {
  assert(label, !readSource(relPath).includes(needle));
}

async function main() {
  assert(
    "downgrade confirmation helper exists",
    existsSync("lib/billing/downgrade-confirmation-view.ts"),
  );

  const {
    actionRequiresScheduledDowngradeConfirm,
    hasAuthoritativePeriodEnd,
    buildScheduledDowngradeViewModel,
    SCHEDULED_NO_CHARGE_TODAY_LABEL,
    SCHEDULED_MISSING_EFFECTIVE_DATE_COPY,
    SCHEDULED_DOWNGRADE_SUCCESS_COPY,
  } = await import("../lib/billing/downgrade-confirmation-view.ts");

  const { actionRequiresInvoicePreview } = await import(
    "../lib/billing/upgrade-confirmation-view.ts"
  );

  assert(
    "Power→Pro is scheduled downgrade confirm",
    actionRequiresScheduledDowngradeConfirm({
      kind: "downgrade",
      targetTier: "pro",
      targetInterval: "monthly",
    }),
  );
  assert(
    "Paid→Free is scheduled confirm",
    actionRequiresScheduledDowngradeConfirm({ kind: "cancel", targetTier: "free", targetInterval: null }),
  );
  assert(
    "year→month is scheduled interval confirm",
    actionRequiresScheduledDowngradeConfirm({
      kind: "interval_change",
      targetTier: "power",
      targetInterval: "monthly",
    }),
  );
  assert(
    "immediate upgrade is NOT scheduled downgrade UI",
    !actionRequiresScheduledDowngradeConfirm({
      kind: "upgrade",
      targetTier: "power",
      targetInterval: "monthly",
    }),
  );
  assert(
    "immediate upgrade still uses invoice preview",
    actionRequiresInvoicePreview({ kind: "upgrade", targetInterval: "monthly" }),
  );

  const billing = {
    status: "active",
    stripeStatus: "active",
    billingInterval: "month",
    currentPeriodStart: "2026-08-24T00:00:00.000Z",
    currentPeriodEnd: "2026-09-24T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    canceledAt: null,
    lastSynchronizedAt: null,
    hasPaidStripeSubscription: true,
  };

  assert("effective date uses authoritative billing period", hasAuthoritativePeriodEnd(billing));
  assert(
    "missing effective date blocks confirmation",
    !hasAuthoritativePeriodEnd({ ...billing, currentPeriodEnd: null }),
  );

  const powerToPro = buildScheduledDowngradeViewModel({
    tier: "power",
    billing,
    action: {
      id: "downgrade-pro-month",
      kind: "downgrade",
      label: "Downgrade to Pro Monthly",
      description: "x",
      listPriceLabel: "$9.99/month",
      timingNote: "x",
      targetTier: "pro",
      targetInterval: "monthly",
      variant: "secondary",
    },
  });

  assert("scheduled downgrade label", powerToPro.changeTypeLabel === "Scheduled downgrade");
  assert("no charge today label constant", SCHEDULED_NO_CHARGE_TODAY_LABEL === "No charge today");
  assert(
    "current benefits retained through exact period end",
    powerToPro.benefitRetentionCopy.includes("Power") &&
      powerToPro.benefitRetentionCopy.includes(powerToPro.effectiveDateLabel) &&
      powerToPro.effectiveDateLabel !== "—",
  );
  assert("target paid plan displayed", powerToPro.startingPlanLine.includes("Pro"));
  assert("target price displayed", Boolean(powerToPro.startingPriceLine));
  assert("confirm is Schedule downgrade", powerToPro.confirmLabel === "Schedule downgrade");
  assert("dismiss Keep Power", powerToPro.dismissLabel === "Keep Power");
  assert("missingEffectiveDate false when period end present", powerToPro.missingEffectiveDate === false);

  const paidToFree = buildScheduledDowngradeViewModel({
    tier: "power",
    billing,
    action: {
      id: "downgrade-to-free",
      kind: "cancel",
      label: "Downgrade to Free",
      description: "x",
      listPriceLabel: "Free",
      timingNote: "x",
      targetTier: "free",
      targetInterval: null,
      variant: "secondary",
    },
  });

  assert("Paid→Free says no further charge", Boolean(paidToFree.noFurtherChargeCopy));
  assert("Paid→Free starts Free", paidToFree.startingPlanLine === "Free");
  assert(
    "Paid→Free confirm includes date",
    paidToFree.confirmLabel.includes("Switch to Free on"),
  );

  const missingDate = buildScheduledDowngradeViewModel({
    tier: "power",
    billing: { ...billing, currentPeriodEnd: null },
    action: {
      id: "downgrade-pro-month",
      kind: "downgrade",
      label: "x",
      description: "x",
      listPriceLabel: null,
      timingNote: null,
      targetTier: "pro",
      targetInterval: "monthly",
      variant: "secondary",
    },
  });
  assert("missing date flagged", missingDate.missingEffectiveDate === true);
  assert(
    "missing date copy available",
    SCHEDULED_MISSING_EFFECTIVE_DATE_COPY.includes("billing period end"),
  );

  const dialogSrc = readSource("components/billing/PlanChangeConfirmationDialog.tsx");
  assert("dialog shows No charge today", dialogSrc.includes("SCHEDULED_NO_CHARGE_TODAY_LABEL"));
  assert("dialog has ScheduledDowngradeBody", dialogSrc.includes("ScheduledDowngradeBody"));
  assert("upgrade body still present", dialogSrc.includes("UpgradeConfirmationBody"));

  const centerSrc = readSource("components/billing/BillingCenter.tsx");
  assert("success uses scheduled downgrade copy", centerSrc.includes("SCHEDULED_DOWNGRADE_SUCCESS_COPY"));
  assert(
    "missing period end blocks execution",
    centerSrc.includes("SCHEDULED_MISSING_EFFECTIVE_DATE_COPY") &&
      centerSrc.includes("hasAuthoritativePeriodEnd"),
  );
  assert(
    "duplicate Free scheduling prevented by existing cancelAtPeriodEnd gate",
    readSource("lib/billing/billing-center.ts").includes("if (billing.cancelAtPeriodEnd)"),
  );

  assertSourceAbsent(
    "lib/billing/downgrade-confirmation-view.ts",
    "createPreview",
    "no invoice preview for scheduled downgrade",
  );
  assertSourceAbsent(
    "lib/billing/downgrade-confirmation-view.ts",
    "Date.now() +",
    "no client-side date math",
  );
  assertSourceAbsent(
    "lib/billing/downgrade-confirmation-view.ts",
    "30 *",
    "no 30-day date invention",
  );
  assertSource(
    "lib/billing/upgrade-confirmation-view.ts",
    "Preparing your billing preview",
    "immediate upgrade UX helper unchanged",
  );
  assertSource(
    "lib/stripe/server.ts",
    "Stripe.createFetchHttpClient()",
    "FetchHttpClient unchanged",
  );
  assertSource(
    "lib/stripe/checkout.ts",
    "checkout.sessions.create",
    "Free→Paid Checkout unchanged",
  );
  assertSource(
    "lib/stripe/subscription-change-policy.ts",
    "scheduled_downgrade",
    "policy classification retained",
  );

  console.log("\nS7-BILLING-UX-007 verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
