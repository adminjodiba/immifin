"use client";

import { useEffect, useId, useRef } from "react";

type AdminMonthlyUpdateFailedRecipientRecoveryConfirmModalProps = {
  isOpen: boolean;
  retryableFailedCount: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function retryLabel(retryableFailedCount: number): string {
  return retryableFailedCount === 1
    ? "Retry 1 Failed Recipient"
    : `Retry ${retryableFailedCount} Failed Recipients`;
}

/** Dedicated confirmation for a server-authoritative failed-recipient recovery operation. */
export function AdminMonthlyUpdateFailedRecipientRecoveryConfirmModal({
  isOpen,
  retryableFailedCount,
  isSubmitting,
  onCancel,
  onConfirm,
}: AdminMonthlyUpdateFailedRecipientRecoveryConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    cancelButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isSubmitting, onCancel]);

  if (!isOpen) return null;

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
        className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10"
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">Retry Failed Recipients?</h2>
        <div id={descriptionId} className="mt-3 space-y-4 text-sm leading-relaxed text-slate-600">
          <p>
            {retryableFailedCount === 1 ? (
              <>
                <span className="font-semibold text-slate-800">1</span> recipient with an explicit failure is currently eligible for recovery consideration.
              </>
            ) : (
              <>
                <span className="font-semibold text-slate-800">{retryableFailedCount}</span> recipients with explicit failures are currently eligible for recovery consideration.
              </>
            )}
          </p>
          <p>
            The server determines the actual recipients and rechecks each candidate&apos;s current active status, valid current email, Pro/Power entitlement, notification preferences, and supported profile requirements.
          </p>
          <p>
            Recipients who are no longer eligible become <span className="font-medium text-slate-800">Skipped — Ineligible</span> and receive no email. Submission Unknown and Provider Accepted recipients are excluded.
          </p>
          <p>This does not resend the entire campaign.</p>
          <p className="font-medium text-amber-800">This starts a manual recovery operation for explicit failures only.</p>
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
            {isSubmitting ? "Starting Recovery…" : retryLabel(retryableFailedCount)}
          </button>
        </div>
      </div>
    </div>
  );
}