"use client";

import { useEffect, useId, useRef, useState } from "react";

type ProfileSectionResetButtonProps = {
  label?: string;
  /** @deprecated Prefer title/message/confirmLabel. Kept for call-site compatibility. */
  confirmMessage?: string;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onReset: () => Promise<void>;
  disabled?: boolean;
};

const DEFAULT_TITLE = "Are you sure you want to clear this data?";
const DEFAULT_MESSAGE =
  "This will clear this section only. It will not affect your account or other profile sections.";
const DEFAULT_CONFIRM_LABEL = "Yes, Clear Data";

export function ProfileSectionResetButton({
  label = "Clear Section",
  confirmMessage,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  confirmLabel = DEFAULT_CONFIRM_LABEL,
  onReset,
  disabled = false,
}: ProfileSectionResetButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const dialogTitle = title;
  const dialogMessage = confirmMessage ?? message;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isResetting) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isResetting]);

  function openModal() {
    if (disabled || isResetting) {
      return;
    }

    setIsOpen(true);
  }

  function closeModal() {
    if (isResetting) {
      return;
    }

    setIsOpen(false);
  }

  async function handleConfirm() {
    if (isResetting) {
      return;
    }

    setIsResetting(true);

    try {
      await onReset();
      setIsOpen(false);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary w-full"
        onClick={openModal}
        disabled={disabled || isResetting}
      >
        {label}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={closeModal}
            disabled={isResetting}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10"
          >
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {dialogTitle}
            </h2>
            <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-slate-600">
              {dialogMessage}
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                className="btn-secondary"
                onClick={closeModal}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-solid disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void handleConfirm()}
                disabled={isResetting}
              >
                {isResetting ? "Clearing..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
