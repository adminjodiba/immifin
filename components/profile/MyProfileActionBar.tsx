"use client";

import { useState } from "react";
import { UserProfileCloseAction } from "@/components/profile/UserProfileCloseAction";
import { useProfileDirtyState } from "@/components/profile/ProfileDirtyStateProvider";

export function MyProfileActionBar() {
  const { saveAllPending } = useProfileDirtyState();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSaveAll() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await saveAllPending();
      setSuccess("All changes saved.");
    } catch (saveError: unknown) {
      setSuccess(null);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save some profile changes. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="ds2-profile-action-bar">
      <div className="ds2-profile-action-bar-copy">
        <span className="ds2-profile-action-bar-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="8" r="3.1" />
            <path d="M5.4 19c.7-3.2 3.2-5.1 6.6-5.1s5.9 1.9 6.6 5.1" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <h1 className="ds2-profile-action-bar-title">My Profile</h1>
          <p className="ds2-profile-action-bar-subtitle">
            Manage your information and preferences in one place.
          </p>
        </div>
      </div>

      <div className="ds2-profile-action-bar-actions">
        <UserProfileCloseAction className="landing-v6-btn-secondary ds2-profile-action-close inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#0B1B3A] bg-white px-5 py-2 text-sm font-semibold text-[#0B1B3A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]" />
        <button
          type="button"
          className="landing-v6-btn-primary ds2-profile-action-save inline-flex items-center justify-center gap-2 rounded-full bg-[#E3B636] px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]"
          onClick={() => void handleSaveAll()}
          disabled={isSaving}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M5 5h11.5L19 8.5V19H5V5Z" strokeLinejoin="round" />
            <path d="M8 5v4h7V5M8 19v-6h8v6" strokeLinecap="round" />
          </svg>
          {isSaving ? "Saving..." : "Save All Changes"}
        </button>
        <p className="ds2-profile-action-security">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <path d="M12 3.6 5.6 6.2v5.2c0 4.1 2.8 7 6.4 8.4 3.6-1.4 6.4-4.3 6.4-8.4V6.2L12 3.6Z" />
            <path d="m9.3 12 1.8 1.8 3.7-3.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            Your information is secure
            <br />
            and always private.
          </span>
        </p>
      </div>

      {error ? (
        <p className="ds2-profile-action-status ds2-profile-action-status-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="ds2-profile-action-status ds2-profile-action-status-success" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}
