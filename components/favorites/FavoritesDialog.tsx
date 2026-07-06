"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { MAX_FAVORITES } from "@/lib/account/favorites";

type FavoritesDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  badge?: string;
  onClose: () => void;
  onSecondary?: () => void;
};

function FavoritesDialog({
  isOpen,
  title,
  description,
  primaryLabel = "Upgrade to Pro",
  primaryHref = "/pricing",
  secondaryLabel = "Close",
  badge = "Pro Feature",
  onClose,
  onSecondary,
}: FavoritesDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10"
      >
        {badge ? <p className="text-sm font-medium text-brand-600">{badge}</p> : null}
        <h2 id={titleId} className={`${badge ? "mt-2" : ""} text-lg font-semibold text-slate-900`}>
          {title}
        </h2>
        <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-slate-600">
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {primaryHref ? (
            <Link href={primaryHref} className="btn-primary w-full sm:flex-1" onClick={onClose}>
              {primaryLabel}
            </Link>
          ) : (
            <button type="button" className="btn-primary w-full" onClick={onClose}>
              {primaryLabel}
            </button>
          )}
          {secondaryLabel ? (
            <button
              ref={closeButtonRef}
              type="button"
              className={`btn-secondary w-full ${primaryHref ? "sm:flex-1" : ""}`}
              onClick={onSecondary ?? onClose}
            >
              {secondaryLabel}
            </button>
          ) : (
            !primaryHref && <button ref={closeButtonRef} type="button" className="sr-only" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FavoritesProGateDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <FavoritesDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Favorites are available in Pro"
      description="Upgrade to Pro to save your most-used pages and access them quickly from the Favorites menu."
    />
  );
}

export function FavoritesLimitDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <FavoritesDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Maximum favorites reached"
      description={`You can save up to ${MAX_FAVORITES} favorite pages. Remove one from your Favorites menu before adding another.`}
      primaryLabel="Close"
      primaryHref={undefined}
      secondaryLabel={undefined}
      badge=""
    />
  );
}
