/**
 * S7-BILLING-UX-008D — Scheduled plan replacement dialog visual redesign.
 * Run: npx tsx scripts/verify-s7-billing-ux-008d-replacement-dialog-visual.mjs
 *
 * Presentation-only. Does not call Stripe or mutate schedules.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { buildPlanChangeReview } from "../lib/billing/plan-change-intent.ts";
import {
  buildScheduledDowngradeViewModel,
  REPLACE_SCHEDULED_CHANGE_SUBTITLE,
  REPLACE_SCHEDULED_CONSEQUENCE_COPY,
  REPLACE_WITH_FREE_CONFIRM_LABEL,
  SCHEDULED_NO_CHARGE_TODAY_DETAIL,
  SCHEDULED_NO_CHARGE_TODAY_LABEL,
  SCHEDULED_STRIPE_MANAGED_COPY,
} from "../lib/billing/downgrade-confirmation-view.ts";

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
  scheduledPlanChange: {
    targetTier: "pro",
    targetInterval: "month",
    effectiveAt: "2026-09-25T17:46:58.000Z",
  },
};

const FREE_ACTION = {
  id: "downgrade-to-free",
  kind: "cancel",
  label: "Downgrade to Free",
  description: "x",
  listPriceLabel: "$0",
  timingNote: "x",
  targetTier: "free",
  targetInterval: null,
  variant: "secondary",
};

function main() {
  const replacement = buildScheduledDowngradeViewModel({
    tier: "power",
    billing: POWER_BILLING,
    action: FREE_ACTION,
  });
  const review = buildPlanChangeReview({
    tier: "power",
    billing: POWER_BILLING,
    action: FREE_ACTION,
  });

  assert("1. existing scheduled destination is Pro Monthly", replacement.existingScheduledPlanLine === "Pro Monthly");
  assert("2. current plan is Power Monthly from billing", replacement.currentPlanLine === "Power Monthly");
  assert("2. current price comes from catalog, not a fixture literal in the dialog", Boolean(replacement.currentPriceLine));
  assert("3. proposed destination is Free", replacement.startingPlanLine === "Free");
  assert("4. effective date is authoritative billing period end", replacement.effectiveDateLabel === "Sep 25, 2026");
  assert("5. no-charge label exists", SCHEDULED_NO_CHARGE_TODAY_LABEL === "No charge today");
  assert("6. Power access-through copy includes date", replacement.benefitRetentionCopy.includes("Sep 25, 2026"));
  assert("6. Power access-through copy names Power", replacement.benefitRetentionCopy.includes("Power"));
  assert("7. one future destination: Free", replacement.autoChangeCopy.includes("one future destination: Free"));
  assert("Keep Pro Scheduled remains dismiss", review.dismissLabel === "Keep Pro Scheduled");
  assert("Replace With Free remains confirm", review.confirmLabel === REPLACE_WITH_FREE_CONFIRM_LABEL);

  const dialogSrc = readSource("components/billing/PlanChangeConfirmationDialog.tsx");
  assert("replacement body is a dedicated presentation component", /function ReplacementScheduledBody/.test(dialogSrc));
  assert("desktop two-column comparison", /sm:grid-cols-2/.test(dialogSrc));
  assert("renders Currently scheduled", /Currently scheduled/.test(dialogSrc));
  assert("renders Current plan", /Current plan/.test(dialogSrc));
  assert("5. NO CHARGE TODAY constant still used", /SCHEDULED_NO_CHARGE_TODAY_LABEL/.test(dialogSrc));
  assert("no-charge supporting copy is used", /SCHEDULED_NO_CHARGE_TODAY_DETAIL/.test(dialogSrc));
  assert("subtitle is used", dialogSrc.includes("REPLACE_SCHEDULED_CHANGE_SUBTITLE"));
  assert("consequence copy is used", dialogSrc.includes("REPLACE_SCHEDULED_CONSEQUENCE_COPY"));
  assert("Keep uses canonical primary CTA for replacement", /isReplacement \? "btn-primary" : "btn-secondary"/.test(dialogSrc));
  assert("Replace uses IMMIFIN solid destructive", /btn-danger-solid/.test(dialogSrc));
  assert("replacement dialog is tall enough to avoid 40rem clip", /54rem/.test(dialogSrc));
  assert("8. Keep remains onCancel", /onClick=\{onCancel\}/.test(dialogSrc) && /review\.dismissLabel/.test(dialogSrc));
  assert("9. Replace remains onConfirm", /onClick=\{onConfirm\}/.test(dialogSrc));
  assert("dialog does not hard-code Power Monthly", !/Power Monthly/.test(dialogSrc));
  assert("dialog does not hard-code Pro Monthly", !/Pro Monthly/.test(dialogSrc));
  assert("dialog does not hard-code Sep 25, 2026", !/Sep 25, 2026/.test(dialogSrc));
  assert("narrow screens stack (grid without forced row)", /grid gap-3 sm:grid-cols-2/.test(dialogSrc));
  assert("dialog semantics retained", /role="dialog"/.test(dialogSrc) && /aria-modal="true"/.test(dialogSrc));
  assert("Escape still dismisses", /event\.key === "Escape"/.test(dialogSrc));
  assert("body scroll locking retained", /document\.body\.style\.overflow = "hidden"/.test(dialogSrc));
  assert("focus remains on keep/dismiss control", /closeButtonRef\.current\?\.focus/.test(dialogSrc));
  assert("Stripe-managed footer is optional existing copy", SCHEDULED_STRIPE_MANAGED_COPY.includes("Stripe"));
  assert("subtitle is static product copy, not fixture data", REPLACE_SCHEDULED_CHANGE_SUBTITLE === "You already have a plan change scheduled.");
  assert(
    "consequence copy does not hard-code a plan name",
    REPLACE_SCHEDULED_CONSEQUENCE_COPY === "If you continue, that scheduled change will be replaced with Free.",
  );
  assert("no-charge detail is generic", SCHEDULED_NO_CHARGE_TODAY_DETAIL.includes("no charge"));

  const centerSrc = readSource("components/billing/BillingCenter.tsx");
  assert(
    "8. Keep Pro Scheduled still non-mutating",
    /onCancel=\{handleCancelConfirmation\}/.test(centerSrc) &&
      /function handleCancelConfirmation\(\)/.test(centerSrc) &&
      !/handleCancelConfirmation[\s\S]{0,250}requestPaidSubscriptionChange/.test(centerSrc),
  );
  assert("9. confirm still calls existing paid-change helper", /requestPaidSubscriptionChange/.test(centerSrc));

  const changeSrc = readSource("lib/stripe/subscription-change.ts");
  const scheduleSrc = readSource("lib/stripe/subscription-schedule.ts");
  assert("10. cancel-to-Free still uses 008C release helper", /releaseAttachedScheduleThenCancelAtPeriodEnd/.test(changeSrc));
  assert("10. schedule file still releases then cancel_at_period_end", /subscriptionSchedules\.release/.test(scheduleSrc));
  assert("10. dialog does not import Stripe server modules", !/from "@\/lib\/stripe\/server"/.test(dialogSrc));
  assert("10. dialog does not call schedule APIs", !/subscriptionSchedules/.test(dialogSrc));

  const cssSrc = readSource("app/globals.css");
  assert("Replace With Free uses gold flow-through on red rest", /\.btn-danger-solid::before/.test(cssSrc));
  assert("outlined danger still has no gold sweep", !/\.btn-danger::before/.test(cssSrc));

  console.log("\nS7-BILLING-UX-008D verification passed.");
}

main();
