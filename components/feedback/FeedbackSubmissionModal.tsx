"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type FeedbackSubmissionModalKind =
  | "success-private"
  | "success-public"
  | "throttle"
  | "system";

const SUCCESS_AUTO_CLOSE_MS = 5000;
const CONTACT_SUPPORT_HREF = "/contact#contact-form-heading";

const COPY = {
  "success-private": {
    tone: "success" as const,
    title: "Feedback received",
    support: "Thank you for helping us make IMMIFIN better.",
    detail: "Your feedback has been received privately by IMMIFIN.",
    action: "Done",
  },
  "success-public": {
    tone: "success" as const,
    title: "Feedback received",
    support: "Thank you for helping us make IMMIFIN better.",
    detail:
      "Your feedback has been received and will be reviewed before it can appear publicly.",
    action: "Done",
  },
  throttle: {
    tone: "warning" as const,
    title: "You recently submitted feedback",
    support: "You can share another response 24 hours after your last submission.",
    detail: null,
    action: "OK",
  },
  system: {
    tone: "error" as const,
    title: "We couldn't submit your feedback",
    support: "Please try again later.",
    detail: null,
    action: "Close",
  },
};

function ModalIcon({ tone }: { tone: "success" | "warning" | "error" }) {
  return (
    <span className={`ds2-feedback-modal-icon ds2-feedback-modal-icon--${tone}`} aria-hidden="true">
      {tone === "success" ? (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M6.6 12.2 10.2 16l7.2-8.2"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      {tone === "warning" ? (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 8.2v5.1M12 16.6h.01"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M11.1 4.8 2.9 18.4c-.4.7.1 1.6.9 1.6h16.4c.8 0 1.3-.9.9-1.6L12.9 4.8c-.4-.7-1.4-.7-1.8 0Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      {tone === "error" ? (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.1" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 8.2v5M12 16.4h.01" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      ) : null}
    </span>
  );
}

export function FeedbackSubmissionModal({
  kind,
  onClose,
}: {
  kind: FeedbackSubmissionModalKind | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const actionRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!kind) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      actionRef.current?.focus();
    }, 0);

    const isSuccess = kind === "success-private" || kind === "success-public";
    const autoCloseTimer = isSuccess ? window.setTimeout(onClose, SUCCESS_AUTO_CLOSE_MS) : undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      if (autoCloseTimer !== undefined) {
        window.clearTimeout(autoCloseTimer);
      }
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
  }, [kind, onClose]);

  if (!mounted || !kind) {
    return null;
  }

  const copy = COPY[kind];

  return createPortal(
    <div
      className="ds2-feedback-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`ds2-feedback-modal ds2-feedback-modal--${copy.tone}`}
      >
        <ModalIcon tone={copy.tone} />
        <h2 id={titleId} className="ds2-feedback-modal-title">
          {copy.title}
        </h2>
        <div id={descriptionId} className="ds2-feedback-modal-copy">
          <p>{copy.support}</p>
          {copy.detail ? <p>{copy.detail}</p> : null}
        </div>
        {kind === "system" ? (
          <p className="ds2-feedback-modal-support">
            <Link href={CONTACT_SUPPORT_HREF}>Contact IMMIFIN Support →</Link>
          </p>
        ) : null}
        <button
          ref={actionRef}
          type="button"
          className="ds2-feedback-modal-action"
          onClick={onClose}
        >
          {copy.action}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export { SUCCESS_AUTO_CLOSE_MS };
