/**
 * S7-BILLING-UX-006 — Transparent upgrade confirmation experience.
 * Run: npx tsx scripts/verify-s7-billing-ux-006-transparent-upgrade-confirmation.mjs
 *
 * Injected fakes / source contracts only — no LIVE Stripe / no paid upgrade mutation.
 */

import { readFileSync, existsSync } from "node:fs";
import Module from "node:module";
import { resolve } from "node:path";

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad(request, parent, isMain);
};

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

function assertSource(relPath, needle, label = `${relPath} contains expected: ${needle}`) {
  assert(label, readSource(relPath).includes(needle));
}

function assertSourceAbsent(relPath, needle, label = `${relPath} lacks ${needle}`) {
  assert(label, !readSource(relPath).includes(needle));
}

async function main() {
  assert(
    "upgrade confirmation helper exists",
    existsSync("lib/billing/upgrade-confirmation-view.ts"),
  );

  const {
    actionRequiresInvoicePreview,
    formatStripeMinorAmount,
    formatSignedStripeMinorAmount,
    getUpgradeConfirmLabel,
    getUpgradeEffectiveTimingCopy,
    resolveUpgradeBillingDetailsMode,
    isPreviewExpiredErrorMessage,
    UPGRADE_PREVIEW_LOADING_COPY,
    UPGRADE_PREVIEW_FAILURE_COPY,
    UPGRADE_PREVIEW_EXPIRED_REFRESH_COPY,
    UPGRADE_SUBMITTED_PENDING_COPY,
  } = await import("../lib/billing/upgrade-confirmation-view.ts");

  assert(
    "upgrade opens preview-first confirmation",
    actionRequiresInvoicePreview({ kind: "upgrade", targetInterval: "monthly" }),
  );
  assert(
    "downgrade does not require invoice preview",
    !actionRequiresInvoicePreview({ kind: "downgrade", targetInterval: "monthly" }),
  );

  assert("amount formats from Stripe minor units", formatStripeMinorAmount(1234, "usd") === "$12.34");
  assert(
    "signed credit uses Stripe amount sign only",
    formatSignedStripeMinorAmount(-500, "usd") === "-$5.00",
  );

  const basePreview = {
    changeType: "immediate_upgrade",
    billingChargeModel: "invoice_now",
    currentPlan: { tier: "pro", interval: "month", amount: 999 },
    targetPlan: { tier: "power", interval: "month", amount: 1999 },
    effectiveTiming: "immediate",
    currency: "usd",
    preview: {
      amountDue: 1000,
      creditAmount: -400,
      proratedChargeAmount: 1400,
      lines: [
        { description: "Unused time on Pro", amount: -400, currency: "usd", isProration: true },
        { description: "Time on Power", amount: 1400, currency: "usd", isProration: true },
      ],
    },
    nextRenewal: { amount: 1999, date: "2026-09-24T00:00:00.000Z" },
    prorationDate: 1,
    previewAuthorization: "tok",
    paymentMethod: { brand: "visa", last4: "4242", displayLabel: "Visa •••• 4242" },
    paymentMethodStatus: "present",
  };

  assert(
    "amount due now uses Stripe preview (confirm pay label)",
    getUpgradeConfirmLabel(basePreview) === "Confirm & Pay $10.00",
  );
  assert(
    "zero due → Confirm Upgrade label",
    getUpgradeConfirmLabel({
      ...basePreview,
      preview: { ...basePreview.preview, amountDue: 0 },
    }) === "Confirm Upgrade",
  );
  assert(
    "classified billing mode when credit/charge present",
    resolveUpgradeBillingDetailsMode(basePreview) === "classified",
  );
  assert(
    "safe line-item fallback works",
    resolveUpgradeBillingDetailsMode({
      ...basePreview,
      preview: {
        amountDue: 1000,
        creditAmount: null,
        proratedChargeAmount: null,
        lines: basePreview.preview.lines,
      },
    }) === "line_items",
  );
  assert(
    "effective timing explained",
    getUpgradeEffectiveTimingCopy().includes("after Stripe confirms payment"),
  );
  assert(
    "stale preview detection",
    isPreviewExpiredErrorMessage("Preview authorization has expired. Please review the upgrade again."),
  );

  const dialogSrc = readSource("components/billing/PlanChangeConfirmationDialog.tsx");
  assert("current plan displayed", dialogSrc.includes("Current plan"));
  assert("target plan displayed", dialogSrc.includes("New plan"));
  assert("amount due now label", dialogSrc.includes("Amount due now"));
  assert("next renewal section", dialogSrc.includes("Next renewal"));
  assert("payment method section", dialogSrc.includes("Payment method"));
  assert("Change PM action", dialogSrc.includes("Change payment method"));
  assert("Add PM action", dialogSrc.includes("Add payment method"));
  assert("preview loading copy constant used", dialogSrc.includes("UPGRADE_PREVIEW_LOADING_COPY"));
  assert("preview failure copy constant used", dialogSrc.includes("UPGRADE_PREVIEW_FAILURE_COPY"));
  assertSource(
    "lib/billing/upgrade-confirmation-view.ts",
    UPGRADE_PREVIEW_LOADING_COPY,
    "loading copy defined in helper",
  );
  assertSource(
    "lib/billing/upgrade-confirmation-view.ts",
    UPGRADE_PREVIEW_FAILURE_COPY,
    "failure copy defined in helper",
  );
  assert("no list-price disclaimer on upgrade path", !dialogSrc.includes("not invoice previews"));

  const centerSrc = readSource("components/billing/BillingCenter.tsx");
  assert("preview-first loading status", centerSrc.includes('upgradePreviewStatus: "loading"'));
  assert(
    "preview failure blocks execution",
    centerSrc.includes("UPGRADE_PREVIEW_FAILURE_COPY") &&
      centerSrc.includes("upgradePreviewStatus !== \"ready\""),
  );
  assert(
    "stale preview requires re-preview",
    centerSrc.includes("UPGRADE_PREVIEW_EXPIRED_REFRESH_COPY") &&
      centerSrc.includes("isPreviewExpiredErrorMessage"),
  );
  assert(
    "does not silently re-execute after refresh",
    centerSrc.includes("applyPreviewToReview(current, refreshed"),
  );
  assert(
    "success waits for webhook-backed state",
    centerSrc.includes("UPGRADE_SUBMITTED_PENDING_COPY"),
  );
  assert("requires_action uses hosted payment path", centerSrc.includes("hostedInvoiceUrl"));
  assert("Keep Current Plan clears pending review", centerSrc.includes("handleCancelConfirmation"));
  assertSource(
    "components/billing/BillingCenter.tsx",
    "setPendingReview(null)",
    "Keep Current Plan / success clears confirmation",
  );
  assertSourceAbsent(
    "components/billing/BillingCenter.tsx",
    "amountDue +",
    "no client-side proration arithmetic",
  );
  assertSourceAbsent(
    "lib/billing/upgrade-confirmation-view.ts",
    "amountDue +",
    "helper has no proration arithmetic",
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
    "lib/stripe/subscription-change.ts",
    "always_invoice",
    "UX-003 charge-now path unchanged",
  );

  console.log("\nS7-BILLING-UX-006 verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
