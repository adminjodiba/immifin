/**
 * S7-BILLING-UX-008C — Replace existing scheduled paid downgrade with Free.
 * Run: npx tsx scripts/verify-s7-billing-ux-008c-schedule-replacement-free.mjs
 *
 * Pure view-model + source-contract checks only.
 * Does NOT call Stripe, release schedules, or mutate the TEST Power→Pro fixture.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  describeScheduledChange,
  getBillingCenterActions,
} from "../lib/billing/billing-center.ts";
import { buildPlanChangeReview } from "../lib/billing/plan-change-intent.ts";
import {
  actionRequiresScheduledPaidToFreeReplacementConfirm,
  buildScheduledDowngradeViewModel,
  formatScheduledFreeSuccessCopy,
  REPLACE_SCHEDULED_CHANGE_TITLE,
  REPLACE_WITH_FREE_CONFIRM_LABEL,
  SCHEDULED_NO_CHARGE_TODAY_LABEL,
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
  scheduledPlanChange: null,
};

const POWER_TO_PRO = {
  targetTier: "pro",
  targetInterval: "month",
  effectiveAt: "2026-09-25T17:46:58.000Z",
};

const FREE_ACTION = {
  id: "downgrade-to-free",
  kind: "cancel",
  label: "Downgrade to Free",
  description: "Schedule a transition to the Free plan at the end of your current billing period.",
  listPriceLabel: "$0",
  timingNote: "Effective at the end of the current billing period.",
  targetTier: "free",
  targetInterval: null,
  variant: "secondary",
};

function main() {
  const scheduledBilling = {
    ...POWER_BILLING,
    scheduledPlanChange: POWER_TO_PRO,
  };

  assert(
    "A. Power→Pro schedule + Free requires replacement confirmation",
    actionRequiresScheduledPaidToFreeReplacementConfirm({
      action: FREE_ACTION,
      billing: scheduledBilling,
    }),
  );
  assert(
    "A. Power without paid schedule does not require replacement confirmation",
    !actionRequiresScheduledPaidToFreeReplacementConfirm({
      action: FREE_ACTION,
      billing: POWER_BILLING,
    }),
  );

  const replacement = buildScheduledDowngradeViewModel({
    tier: "power",
    billing: scheduledBilling,
    action: FREE_ACTION,
  });

  assert("B. dialog names existing Pro scheduled destination", /Pro Monthly/.test(replacement.existingScheduledPlanLine ?? ""));
  assert(
    "B. explanation names Pro Monthly",
    /Pro Monthly/.test(replacement.replacementExplanationCopy ?? ""),
  );
  assert("C. replacement destination is Free", replacement.startingPlanLine === "Free");
  assert("C. target plan line is Free", replacement.targetPlanLine === "Free");
  assert("D. exact effective date is shown", replacement.effectiveDateLabel === "Sep 25, 2026");
  assert(
    "D. existing scheduled date is shown",
    replacement.existingScheduledEffectiveLabel === "Sep 25, 2026",
  );
  assert(
    "E. No charge today label is the existing uppercase-styled constant",
    SCHEDULED_NO_CHARGE_TODAY_LABEL === "No charge today",
  );
  assert("F. Keep Pro Scheduled dismiss label", replacement.dismissLabel === "Keep Pro Scheduled");
  assert("F. Replace With Free confirm label", replacement.confirmLabel === REPLACE_WITH_FREE_CONFIRM_LABEL);
  assert("F. title is replacement-specific", replacement.dialogTitle === REPLACE_SCHEDULED_CHANGE_TITLE);
  assert("replacement flag is set", replacement.isReplacement === true);
  assert(
    "paid subscription ends on the effective date",
    /paid subscription will end on that date/i.test(replacement.paidSubscriptionEndsCopy ?? ""),
  );
  assert(
    "Power remains through the exact date",
    replacement.benefitRetentionCopy.includes("Power") &&
      replacement.benefitRetentionCopy.includes("Sep 25, 2026"),
  );
  assert(
    "does not imply immediate Free",
    !/immediately|right now|today you will lose/i.test(
      `${replacement.benefitRetentionCopy} ${replacement.replacementExplanationCopy}`,
    ),
  );

  const review = buildPlanChangeReview({
    tier: "power",
    billing: scheduledBilling,
    action: FREE_ACTION,
  });
  assert("review uses replacement title", review.dialogTitle === REPLACE_SCHEDULED_CHANGE_TITLE);
  assert("review confirm is Replace With Free", review.confirmLabel === "Replace With Free");
  assert("review dismiss is Keep Pro Scheduled", review.dismissLabel === "Keep Pro Scheduled");
  assert("review is not generic Confirm", review.confirmLabel !== "Confirm");
  assert("review is not generic Cancel", review.dismissLabel !== "Cancel");

  const dialogSrc = readSource("components/billing/PlanChangeConfirmationDialog.tsx");
  assert("E. dialog renders NO CHARGE TODAY constant", /SCHEDULED_NO_CHARGE_TODAY_LABEL/.test(dialogSrc));
  assert("F. dismiss button uses review.dismissLabel", /review\.dismissLabel/.test(dialogSrc));
  assert("F. confirm button uses confirmLabel", /confirmLabel/.test(dialogSrc));
  assert("replacement uses destructive confirm class", /btn-danger/.test(dialogSrc));

  const centerSrc = readSource("components/billing/BillingCenter.tsx");
  assert(
    "G. Keep Pro Scheduled is the cancel handler (no Stripe call)",
    /function handleCancelConfirmation\(\)/.test(centerSrc) &&
      /onCancel=\{handleCancelConfirmation\}/.test(centerSrc) &&
      !/handleCancelConfirmation[\s\S]{0,250}requestPaidSubscriptionChange/.test(centerSrc),
  );

  const scheduleSrc = readSource("lib/stripe/subscription-schedule.ts");
  const releaseFn = scheduleSrc.split("export async function releaseAttachedScheduleThenCancelAtPeriodEnd")[1] ?? "";
  const releaseIndex = releaseFn.indexOf("subscriptionSchedules.release");
  const cancelIndex = releaseFn.indexOf("cancel_at_period_end: true");
  assert("H. release helper exists", /releaseAttachedScheduleThenCancelAtPeriodEnd/.test(scheduleSrc));
  assert("H. uses Stripe schedule release", releaseIndex >= 0);
  assert("H. then sets cancel_at_period_end", cancelIndex > releaseIndex);
  assert(
    "H. does not call schedule cancel (would cancel the subscription now)",
    !/subscriptionSchedules\.cancel\(/.test(releaseFn),
  );
  assert(
    "H. documents why not to combine schedule + cancel blindly",
    /does not treat `cancel_at_period_end` as a second destination/i.test(scheduleSrc),
  );

  const changeSrc = readSource("lib/stripe/subscription-change.ts");
  assert(
    "H. cancel-to-Free execute path uses the replacement helper",
    /releaseAttachedScheduleThenCancelAtPeriodEnd/.test(changeSrc),
  );
  assert(
    "I. execute path does not write profiles.plan",
    !/profiles\.plan|updateSubscriptionPlan/.test(changeSrc),
  );
  assert(
    "I. execute path documents webhook authority",
    /Does not mutate local billing state or capabilities/.test(changeSrc),
  );

  const resultingBilling = {
    ...POWER_BILLING,
    cancelAtPeriodEnd: true,
    scheduledPlanChange: null,
  };
  const resultingSummary = describeScheduledChange(resultingBilling);
  assert("J. resulting destination is Free only", /Free on Sep 25, 2026/.test(resultingSummary));
  assert("K. Pro destination no longer appears", !/Pro Monthly/.test(resultingSummary));
  assert(
    "L. duplicate Downgrade to Free suppressed once Free is scheduled",
    !getBillingCenterActions({ tier: "power", billing: resultingBilling }).some(
      (action) => action.id === "downgrade-to-free",
    ),
  );
  assert(
    "Power→Pro still offers Downgrade to Free before replacement",
    getBillingCenterActions({ tier: "power", billing: scheduledBilling }).some(
      (action) => action.id === "downgrade-to-free",
    ),
  );

  const success = formatScheduledFreeSuccessCopy({
    effectiveAt: "2026-09-25T17:46:58.000Z",
    currentTier: "power",
  });
  assert(
    "success copy includes exact date and Power retention",
    success.includes("Sep 25, 2026") &&
      success.includes("Power") &&
      success.includes("downgrade to Free"),
  );
  assert("Billing Center uses dated Free success copy", /formatScheduledFreeSuccessCopy/.test(centerSrc));

  const routeSrc = readSource("app/api/account/subscription/route.ts");
  assert("GET still does not return schedule ids", !/scheduleId|sub_sched/.test(routeSrc));
  assert(
    "N. GET uses live Stripe cancel_at_period_end after retrieve (no browser IDs)",
    /stripeCancelAtPeriodEnd/.test(routeSrc),
  );

  const readSrc = readSource("lib/stripe/scheduled-plan-change-read.ts");
  assert("read path still retrieve-only for schedules", !/subscriptionSchedules\.create/.test(readSrc));
  assert("read path still does not release", !/subscriptionSchedules\.release/.test(readSrc));
  assert("read path still does not update subscriptions", !/subscriptions\.update/.test(readSrc));

  const clientSrc = readSource("lib/stripe/client-subscription-change.ts");
  assert("O. client change helper sends only tier/interval", /targetTier/.test(clientSrc));
  assert("O. client does not send schedule ids", !/scheduleId|sub_sched|price_/.test(clientSrc));

  const dialogHasGenericPair =
    />\s*Cancel\s*</.test(dialogSrc) && />\s*Confirm\s*</.test(dialogSrc);
  assert("F. dialog does not hardcode Cancel/Confirm pair", !dialogHasGenericPair);

  console.log("\nS7-BILLING-UX-008C verification passed.");
}

main();
