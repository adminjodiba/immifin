"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getPremiumNavPreviewContent,
  type PremiumNavPreviewKey,
} from "@/lib/premium-nav-preview";

type PremiumNavPreviewDialogProps = {
  previewKey: PremiumNavPreviewKey | null;
  onClose: () => void;
};

/**
 * Feature-specific Pro discovery modal for navigation clicks.
 * Portaled to document.body so sticky/backdrop-filter header ancestors
 * cannot create a containing block that clips position:fixed.
 *
 * Does not grant access — page and API capability gates remain authoritative.
 */
export function PremiumNavPreviewDialog({
  previewKey,
  onClose,
}: PremiumNavPreviewDialogProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!previewKey) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
  }, [onClose, previewKey]);

  if (!mounted || !previewKey) {
    return null;
  }

  const content = getPremiumNavPreviewContent(previewKey);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card-static relative mx-auto max-h-[min(90vh,44rem)] w-full max-w-lg overflow-y-auto shadow-xl shadow-slate-900/15 ring-brand-200/60"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
          aria-label="Close feature preview"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </button>

        <header className="text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"
            aria-hidden="true"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h2 id={titleId} className="heading-3 mt-4 text-slate-900">
            {content.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {content.description}
          </p>
        </header>

        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/50 p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {content.featureGroupTitle}
          </p>
          <ul className="mt-3 space-y-2.5">
            {content.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/pricing" className="btn-primary flex-1" onClick={onClose}>
            Upgrade to Pro
          </Link>
          <Link href="/pricing#plans" className="btn-secondary flex-1" onClick={onClose}>
            Compare Plans
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
