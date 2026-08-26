"use client";

import { useEffect, useId, useRef } from "react";
import type { PlanChangeReview } from "@/lib/billing/plan-change-intent";
import { formatBillingDate, formatPlanLabel } from "@/lib/billing/billing-center";
import {
  actionRequiresInvoicePreview,
  formatPreviewPlanName,
  formatPreviewPlanPrice,
  formatSignedStripeMinorAmount,
  formatStripeMinorAmount,
  getUpgradeConfirmLabel,
  getUpgradeEffectiveTimingCopy,
  getUpgradeEntitlementCopy,
  resolveUpgradeBillingDetailsMode,
  UPGRADE_PREVIEW_FAILURE_COPY,
  UPGRADE_PREVIEW_LOADING_COPY,
} from "@/lib/billing/upgrade-confirmation-view";
import {
  actionRequiresScheduledDowngradeConfirm,
  REPLACE_SCHEDULED_CHANGE_SUBTITLE,
  REPLACE_SCHEDULED_CONSEQUENCE_COPY,
  SCHEDULED_MISSING_EFFECTIVE_DATE_COPY,
  SCHEDULED_NO_CHARGE_TODAY_DETAIL,
  SCHEDULED_NO_CHARGE_TODAY_LABEL,
  SCHEDULED_STRIPE_MANAGED_COPY,
  type ScheduledDowngradeViewModel,
} from "@/lib/billing/downgrade-confirmation-view";

type PlanChangeConfirmationDialogProps = {
  review: PlanChangeReview;
  isSubmitting: boolean;
  isOpeningPaymentMethod?: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onManagePaymentMethod?: () => void;
  onRetryPreview?: () => void;
};

export function PlanChangeConfirmationDialog({
  review,
  isSubmitting,
  isOpeningPaymentMethod = false,
  errorMessage,
  onConfirm,
  onCancel,
  onManagePaymentMethod,
  onRetryPreview,
}: PlanChangeConfirmationDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isFreeDowngrade = review.action.kind === "cancel";
  const needsInvoicePreview = actionRequiresInvoicePreview(review.action);
  const isScheduledDowngrade = actionRequiresScheduledDowngradeConfirm(review.action);
  const scheduled = review.scheduledDowngrade;
  const needsPaymentMethod = needsInvoicePreview;
  const previewReady = review.upgradePreviewStatus === "ready" && review.upgradePreview != null;
  const previewLoading = needsInvoicePreview && review.upgradePreviewStatus === "loading";
  const previewFailed = needsInvoicePreview && review.upgradePreviewStatus === "error";
  const paymentMethodBlocksConfirm =
    needsPaymentMethod &&
    (review.paymentMethodStatus === "missing" || review.paymentMethodStatus === "unavailable");
  const scheduledBlocksConfirm = Boolean(isScheduledDowngrade && scheduled?.missingEffectiveDate);
  const busy = isSubmitting || isOpeningPaymentMethod;
  const confirmDisabled =
    busy ||
    paymentMethodBlocksConfirm ||
    scheduledBlocksConfirm ||
    (needsInvoicePreview && (!previewReady || !review.previewAuthorization)) ||
    previewFailed ||
    previewLoading;
  const showPaymentMethodActions = needsPaymentMethod && Boolean(onManagePaymentMethod);

  const confirmLabel = previewReady
    ? getUpgradeConfirmLabel(review.upgradePreview!)
    : review.confirmLabel;

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [busy, onCancel]);

  const isReplacement = Boolean(scheduled?.isReplacement);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        className={`card-static w-full overflow-y-auto shadow-xl shadow-slate-900/15 ${
          isReplacement
            ? "max-h-[min(96vh,54rem)] max-w-xl p-4 sm:p-5"
            : "max-h-[min(92vh,44rem)] max-w-lg"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={previewLoading || busy}
      >
        {isReplacement ? (
          <header className="flex gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-800 ring-1 ring-amber-200"
              aria-hidden="true"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h16.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="heading-3 text-brand-700">
                {review.dialogTitle}
              </h2>
              <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-slate-600">
                {REPLACE_SCHEDULED_CHANGE_SUBTITLE}
              </p>
            </div>
          </header>
        ) : (
          <>
            <h2 id={titleId} className="heading-3 text-slate-900">
              {needsInvoicePreview ? "Confirm your upgrade" : review.dialogTitle}
            </h2>
            <p
              id={descriptionId}
              className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-600"
            >
              {needsInvoicePreview ? "Immediate upgrade" : review.changeTypeLabel}
            </p>
          </>
        )}

        {review.previewInfoBanner ? (
          <p
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            {review.previewInfoBanner}
          </p>
        ) : null}

        {previewLoading ? (
          <p className="mt-6 text-sm text-slate-600" role="status" aria-live="polite">
            {UPGRADE_PREVIEW_LOADING_COPY}
          </p>
        ) : null}

        {previewFailed ? (
          <div className="mt-6 space-y-3">
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {review.upgradePreviewError ?? UPGRADE_PREVIEW_FAILURE_COPY}
            </p>
            {onRetryPreview ? (
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={onRetryPreview}
                disabled={busy}
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}

        {needsInvoicePreview && previewReady ? (
          <UpgradeConfirmationBody
            review={review}
            busy={busy}
            isOpeningPaymentMethod={isOpeningPaymentMethod}
            showPaymentMethodActions={showPaymentMethodActions}
            onManagePaymentMethod={onManagePaymentMethod}
          />
        ) : null}

        {isScheduledDowngrade && scheduled ? (
          isReplacement ? (
            <ReplacementScheduledBody scheduled={scheduled} />
          ) : (
            <ScheduledDowngradeBody scheduled={scheduled} />
          )
        ) : null}

        {!needsInvoicePreview && !isScheduledDowngrade ? (
          <LegacyPlanChangeBody
            review={review}
            isFreeDowngrade={isFreeDowngrade}
            needsPaymentMethod={needsPaymentMethod}
            busy={busy}
            isOpeningPaymentMethod={isOpeningPaymentMethod}
            showPaymentMethodActions={showPaymentMethodActions}
            onManagePaymentMethod={onManagePaymentMethod}
          />
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </p>
        ) : null}

        <div className={`${isReplacement ? "mt-5" : "mt-6"} flex flex-col gap-3 sm:flex-row-reverse`}>
          {!previewFailed ? (
            <button
              type="button"
              className={`${isReplacement ? "btn-danger-solid" : "btn-primary"} flex-1`}
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {isSubmitting ? "Submitting…" : confirmLabel}
            </button>
          ) : null}
          <button
            ref={closeButtonRef}
            type="button"
            className={`${isReplacement ? "btn-primary" : "btn-secondary"} flex-1`}
            onClick={onCancel}
            disabled={busy}
          >
            {review.dismissLabel}
          </button>
        </div>
        {isReplacement ? (
          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
            {SCHEDULED_STRIPE_MANAGED_COPY}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ReplacementScheduledBody({ scheduled }: { scheduled: ScheduledDowngradeViewModel }) {
  const existingBegins =
    scheduled.existingScheduledEffectiveLabel && scheduled.existingScheduledEffectiveLabel !== "—"
      ? `Begins ${scheduled.existingScheduledEffectiveLabel}`
      : null;
  const hasStructuredLead = Boolean(scheduled.existingScheduledPlanLine && existingBegins);
  const existingLead = hasStructuredLead
    ? `You currently have ${scheduled.existingScheduledPlanLine} scheduled to begin ${scheduled.existingScheduledEffectiveLabel}.`
    : scheduled.replacementExplanationCopy;

  return (
    <div className="mt-4 space-y-3">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Current plan
          </dt>
          <dd className="mt-1.5 text-sm font-semibold text-slate-900">{scheduled.currentPlanLine}</dd>
          <dd className="mt-0.5 text-sm text-slate-700">{scheduled.currentPriceLine}</dd>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
            Currently scheduled
          </dt>
          <dd className="mt-1.5 text-sm font-semibold text-slate-900">
            {scheduled.existingScheduledPlanLine}
          </dd>
          {existingBegins ? <dd className="mt-0.5 text-sm text-slate-700">{existingBegins}</dd> : null}
        </div>
      </dl>

      {existingLead ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-relaxed text-amber-950"
          role="status"
        >
          <p>{existingLead}</p>
          {hasStructuredLead ? (
            <p className="mt-1.5">{REPLACE_SCHEDULED_CONSEQUENCE_COPY}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3"
        role="status"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-900">
          {SCHEDULED_NO_CHARGE_TODAY_LABEL}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-emerald-950">
          {SCHEDULED_NO_CHARGE_TODAY_DETAIL}
        </p>
      </div>

      {scheduled.missingEffectiveDate ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
          {SCHEDULED_MISSING_EFFECTIVE_DATE_COPY}
        </p>
      ) : (
        <p className="rounded-xl border border-brand-100 bg-brand-50/70 px-3.5 py-3 text-sm leading-relaxed text-slate-800">
          {scheduled.benefitRetentionCopy}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {scheduled.startingCopyTitle}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-slate-900">{scheduled.startingPlanLine}</p>
        {scheduled.startingPriceLine ? (
          <p className="mt-0.5 text-sm text-slate-700">{scheduled.startingPriceLine}</p>
        ) : null}
        {scheduled.paidSubscriptionEndsCopy ? (
          <p className="mt-2 text-sm text-slate-700">{scheduled.paidSubscriptionEndsCopy}</p>
        ) : null}
      </section>

      {!scheduled.missingEffectiveDate ? (
        <p className="text-sm leading-relaxed text-slate-600">{scheduled.autoChangeCopy}</p>
      ) : null}
    </div>
  );
}

function ScheduledDowngradeBody({ scheduled }: { scheduled: ScheduledDowngradeViewModel }) {
  return (
    <div className="mt-5 space-y-5">
      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current plan
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{scheduled.currentPlanLine}</dd>
          <dd className="mt-0.5 text-sm text-slate-700">{scheduled.currentPriceLine}</dd>
        </div>
        {scheduled.changeTypeLabel.toLowerCase().includes("free") ? null : (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              New plan
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{scheduled.targetPlanLine}</dd>
            {scheduled.targetPriceLine ? (
              <dd className="mt-0.5 text-sm text-slate-700">{scheduled.targetPriceLine}</dd>
            ) : null}
          </div>
        )}
      </dl>

      <p
        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-emerald-900"
        role="status"
      >
        {SCHEDULED_NO_CHARGE_TODAY_LABEL}
      </p>

      {scheduled.missingEffectiveDate ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {SCHEDULED_MISSING_EFFECTIVE_DATE_COPY}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-slate-700">{scheduled.benefitRetentionCopy}</p>
      )}

      <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {scheduled.startingCopyTitle}
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-900">{scheduled.startingPlanLine}</p>
        {scheduled.startingPriceLine ? (
          <p className="mt-0.5 text-sm text-slate-700">{scheduled.startingPriceLine}</p>
        ) : null}
        {scheduled.noFurtherChargeCopy ? (
          <p className="mt-2 text-sm text-slate-700">{scheduled.noFurtherChargeCopy}</p>
        ) : null}
      </section>

      {!scheduled.missingEffectiveDate ? (
        <p className="text-sm text-slate-600">{scheduled.autoChangeCopy}</p>
      ) : null}
    </div>
  );
}

function UpgradeConfirmationBody({
  review,
  busy,
  isOpeningPaymentMethod,
  showPaymentMethodActions,
  onManagePaymentMethod,
}: {
  review: PlanChangeReview;
  busy: boolean;
  isOpeningPaymentMethod: boolean;
  showPaymentMethodActions: boolean;
  onManagePaymentMethod?: () => void;
}) {
  const preview = review.upgradePreview!;
  const billingMode = resolveUpgradeBillingDetailsMode(preview);
  const currency = preview.currency;
  const targetName = formatPreviewPlanName(preview.targetPlan);
  const currentName = formatPreviewPlanName(preview.currentPlan);

  return (
    <div className="mt-5 space-y-5">
      <dl className="space-y-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current plan
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{currentName}</dd>
          <dd className="mt-0.5 text-sm text-slate-700">
            {formatPreviewPlanPrice(preview.currentPlan, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">New plan</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{targetName}</dd>
          <dd className="mt-0.5 text-sm text-slate-700">
            {formatPreviewPlanPrice(preview.targetPlan, currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Effective
          </dt>
          <dd className="mt-1 text-sm text-slate-800">{getUpgradeEffectiveTimingCopy()}</dd>
        </div>
      </dl>

      <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Billing details
        </h3>
        {billingMode === "classified" ? (
          <dl className="mt-3 space-y-2 text-sm">
            {preview.preview.creditAmount != null ? (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-700">Unused {formatPlanLabel(preview.currentPlan.tier)} credit</dt>
                <dd className="shrink-0 font-semibold tabular-nums text-slate-900">
                  {formatSignedStripeMinorAmount(preview.preview.creditAmount, currency)}
                </dd>
              </div>
            ) : null}
            {preview.preview.proratedChargeAmount != null ? (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-slate-700">
                  {formatPlanLabel(preview.targetPlan.tier)} for the remainder of this billing period
                </dt>
                <dd className="shrink-0 font-semibold tabular-nums text-slate-900">
                  {formatSignedStripeMinorAmount(preview.preview.proratedChargeAmount, currency)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-4 border-t border-slate-200 pt-2">
              <dt className="font-semibold text-slate-900">Amount due now</dt>
              <dd className="shrink-0 font-semibold tabular-nums text-slate-900">
                {formatStripeMinorAmount(preview.preview.amountDue, currency)}
              </dd>
            </div>
          </dl>
        ) : null}

        {billingMode === "line_items" ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-medium text-slate-800">Billing adjustments</p>
            <ul className="space-y-2">
              {preview.preview.lines.map((line, index) => (
                <li
                  key={`${line.description ?? "line"}-${line.amount}-${index}`}
                  className="flex items-start justify-between gap-4"
                >
                  <span className="text-slate-700">
                    {line.description?.trim() || "Billing adjustment"}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                    {formatSignedStripeMinorAmount(line.amount, line.currency || currency)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-start justify-between gap-4 border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-900">Amount due now</span>
              <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                {formatStripeMinorAmount(preview.preview.amountDue, currency)}
              </span>
            </div>
          </div>
        ) : null}

        {billingMode === "amount_only" ? (
          <div className="mt-3 flex items-start justify-between gap-4 text-sm">
            <span className="font-semibold text-slate-900">Amount due now</span>
            <span className="shrink-0 font-semibold tabular-nums text-slate-900">
              {formatStripeMinorAmount(preview.preview.amountDue, currency)}
            </span>
          </div>
        ) : null}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Next renewal
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-900">
          {formatBillingDate(preview.nextRenewal.date)}
        </p>
        <p className="mt-0.5 text-sm text-slate-700">
          {formatPreviewPlanPrice(preview.targetPlan, currency)}
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Payment method
        </h3>
        {review.paymentMethodStatus === "present" && review.paymentMethodDisplay ? (
          <>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {review.paymentMethodDisplay}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              This payment method will be used for your upgrade.
            </p>
            {showPaymentMethodActions ? (
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-blue-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onManagePaymentMethod}
                disabled={busy}
              >
                {isOpeningPaymentMethod
                  ? "Opening secure payment settings…"
                  : "Change payment method"}
              </button>
            ) : null}
          </>
        ) : review.paymentMethodStatus === "missing" ||
          review.paymentMethodStatus === "unavailable" ? (
          <>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              No payment method available.
            </p>
            <p className="mt-1 text-sm text-slate-700">Add a payment method before upgrading.</p>
            {showPaymentMethodActions ? (
              <button
                type="button"
                className="mt-3 text-sm font-semibold text-blue-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onManagePaymentMethod}
                disabled={busy}
              >
                {isOpeningPaymentMethod
                  ? "Opening secure payment settings…"
                  : "Add payment method"}
              </button>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-600">Loading payment method…</p>
        )}
      </section>

      <p className="text-sm leading-relaxed text-slate-600">
        {getUpgradeEntitlementCopy(formatPlanLabel(preview.targetPlan.tier))}
      </p>
    </div>
  );
}

function LegacyPlanChangeBody({
  review,
  isFreeDowngrade,
  needsPaymentMethod,
  busy,
  isOpeningPaymentMethod,
  showPaymentMethodActions,
  onManagePaymentMethod,
}: {
  review: PlanChangeReview;
  isFreeDowngrade: boolean;
  needsPaymentMethod: boolean;
  busy: boolean;
  isOpeningPaymentMethod: boolean;
  showPaymentMethodActions: boolean;
  onManagePaymentMethod?: () => void;
}) {
  return (
    <>
      <dl className="mt-5 space-y-4">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{review.currentPlanLine}</dd>
          <dd className="mt-0.5 text-sm text-slate-700">{review.currentPriceLine}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">New</dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">{review.targetPlanLine}</dd>
          {review.targetPriceLine ? (
            <dd className="mt-0.5 text-sm text-slate-700">{review.targetPriceLine}</dd>
          ) : null}
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {isFreeDowngrade ? "Effective" : "Timing"}
          </dt>
          <dd className="mt-1 text-sm text-slate-800">{review.timingLabel}</dd>
        </div>
      </dl>

      {isFreeDowngrade ? (
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
          {review.accessExplanation ? <p>{review.accessExplanation}</p> : null}
          {review.transitionExplanation ? <p>{review.transitionExplanation}</p> : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">{review.billingNote}</p>
      )}

      {needsPaymentMethod ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment method
          </p>
          {review.paymentMethodStatus === "present" && review.paymentMethodDisplay ? (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {review.paymentMethodDisplay}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                This payment method will be used for your upgrade.
              </p>
              {showPaymentMethodActions ? (
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-blue-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={onManagePaymentMethod}
                  disabled={busy}
                >
                  {isOpeningPaymentMethod
                    ? "Opening secure payment settings…"
                    : "Change payment method"}
                </button>
              ) : null}
            </>
          ) : review.paymentMethodStatus === "missing" ||
            review.paymentMethodStatus === "unavailable" ? (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                No payment method available.
              </p>
              <p className="mt-1 text-sm text-slate-700">Add a payment method before upgrading.</p>
              {showPaymentMethodActions ? (
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-blue-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={onManagePaymentMethod}
                  disabled={busy}
                >
                  {isOpeningPaymentMethod
                    ? "Opening secure payment settings…"
                    : "Add payment method"}
                </button>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-sm text-slate-600">Loading payment method…</p>
          )}
        </div>
      ) : null}
    </>
  );
}
