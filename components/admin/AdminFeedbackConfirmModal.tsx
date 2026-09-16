"use client";

import { useEffect, useId, useRef } from "react";

type AdminFeedbackConfirmModalProps = {
  isOpen: boolean;
  title: string;
  confirmLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AdminFeedbackConfirmModal({
  isOpen,
  title,
  confirmLabel,
  isSubmitting,
  onCancel,
  onConfirm,
}: AdminFeedbackConfirmModalProps) {
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

  return (
    <div className="ds2-afrq-modal-root">
      <button
        type="button"
        className="ds2-afrq-modal-backdrop"
        aria-label="Close dialog"
        onClick={onCancel}
        disabled={isSubmitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="ds2-afrq-modal"
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>This action cannot be undone.</p>
        <div className="ds2-afrq-modal-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="ds2-afrq-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="button" className="ds2-afrq-modal-confirm" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
