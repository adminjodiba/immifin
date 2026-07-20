"use client";

import type { PlanChangeReview } from "@/lib/billing/plan-change-intent";

type PlanChangeConfirmationDialogProps = {
  review: PlanChangeReview;
  isSubmitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PlanChangeConfirmationDialog({
  review,
  isSubmitting,
  errorMessage,
  onConfirm,
  onCancel,
}: PlanChangeConfirmationDialogProps) {
  const isFreeDowngrade = review.action.kind === "cancel";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-change-confirm-title"
    >
      <div className="card-static w-full max-w-lg shadow-xl">
        <h2 id="plan-change-confirm-title" className="heading-3 text-slate-900">
          {review.dialogTitle}
        </h2>
        {!isFreeDowngrade ? (
          <p className="mt-2 text-sm text-slate-600">{review.changeTypeLabel}</p>
        ) : null}

        <dl className="mt-5 space-y-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {review.currentPlanLine}
            </dd>
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

        {!isFreeDowngrade ? (
          <p className="mt-4 text-xs text-slate-500">
            Listed amounts are destination list prices, not invoice previews. IMMIFIN updates your
            access after Stripe confirms the change.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting…" : review.confirmLabel}
          </button>
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {review.dismissLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
