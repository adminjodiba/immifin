"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileDirtyState } from "@/components/profile/ProfileDirtyStateProvider";
import { PROFILE_HUB_EXIT_PATH } from "@/lib/onboarding/routes";

export function UserProfileCloseAction() {
  const router = useRouter();
  const { isProfileDirty, saveAllPending, markClean } = useProfileDirtyState();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        setIsOpen(false);
        setSaveError(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isSaving]);

  function navigateAway() {
    router.push(PROFILE_HUB_EXIT_PATH);
  }

  function handleCloseClick() {
    if (!isProfileDirty) {
      navigateAway();
      return;
    }

    setSaveError(null);
    setIsOpen(true);
  }

  function handleCancel() {
    if (isSaving) {
      return;
    }

    setIsOpen(false);
    setSaveError(null);
  }

  function handleLeaveWithoutSaving() {
    if (isSaving) {
      return;
    }

    markClean();
    setIsOpen(false);
    navigateAway();
  }

  async function handleSaveAndClose() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveAllPending();
      setIsOpen(false);
      navigateAway();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save your changes. Please try again.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button type="button" className="btn-secondary shrink-0" onClick={handleCloseClick}>
        Close
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={handleCancel}
            disabled={isSaving}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/10"
          >
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              You have unsaved changes
            </h2>
            <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-slate-600">
              Do you want to save your changes before leaving?
            </p>

            {saveError ? (
              <div
                className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                {saveError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => void handleSaveAndClose()}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save and Close"}
              </button>
              <button
                type="button"
                className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleLeaveWithoutSaving}
                disabled={isSaving}
              >
                Leave Without Saving
              </button>
              <button
                ref={cancelButtonRef}
                type="button"
                className="btn-secondary w-full"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
