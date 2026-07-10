"use client";

import { useEffect, useId, useRef } from "react";

type AdminMonthlyUpdateConfirmModalProps = {
  isOpen: boolean;
  bulletinMonthLabel: string;
  totalRecipients: number;
  proCount: number;
  powerCount: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * In-app confirmation for Admin Monthly Immigration Update bulk send.
 * Reuses FavoritesDialog accessibility patterns (Escape, focus, body scroll lock).
 */
export function AdminMonthlyUpdateConfirmModal({
  isOpen,
  bulletinMonthLabel,
  totalRecipients,
  proCount,
  powerCount,
  isSubmitting,
  onCancel,
  onConfirm,
}: AdminMonthlyUpdateConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
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
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) {
    return null;
  }

  const monthLabel = bulletinMonthLabel.trim() || "current";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onCancel}
        disabled={isSubmitting}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10"
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          Send Monthly Immigration Updates?
        </h2>

        <div id={descriptionId} className="mt-3 space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            You are about to send the personalized{" "}
            <span className="font-semibold text-slate-800">{monthLabel}</span>{" "}
            Immigration Update to{" "}
            <span className="font-semibold text-slate-800">{totalRecipients}</span>{" "}
            eligible Pro and Power subscribers.
          </p>

          <dl className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-baseline justify-between gap-4 border-b border-slate-200/80 py-1.5">
              <dt className="text-slate-600">Bulletin month</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {monthLabel}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-slate-200/80 py-1.5">
              <dt className="text-slate-600">Total eligible recipients</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {totalRecipients}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-b border-slate-200/80 py-1.5">
              <dt className="text-slate-600">Pro</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {proCount}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-1.5">
              <dt className="text-slate-600">Power</dt>
              <dd className="font-semibold tabular-nums text-slate-900">
                {powerCount}
              </dd>
            </div>
          </dl>

          <p className="font-medium text-amber-800">
            This action will send real emails and cannot be undone.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending…" : "Send Updates"}
          </button>
        </div>
      </div>
    </div>
  );
}
