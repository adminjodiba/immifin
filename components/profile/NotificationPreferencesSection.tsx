"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ProfileSectionResetButton } from "@/components/profile/ProfileSectionResetButton";
import {
  PROFILE_SECTION_IDS,
  useProfileDirtyState,
} from "@/components/profile/ProfileDirtyStateProvider";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_FIELDS,
  readNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/account/notificationPreferences";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import type { ImmigrationProfile, Profile } from "@/lib/supabase/types";

const PHONE_DISCLAIMER =
  "Your phone number may be used to send immigration alerts and notifications based on your communication preferences.";

const SECTION_CLEARED_MESSAGE = "Section cleared. Click Save to apply changes.";

type AccountMeResponse = {
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
};

export function NotificationPreferencesSection() {
  const { markDirty, markClean, registerSaveHandler } = useProfileDirtyState();
  const hasLoadedRef = useRef(false);

  const [preferences, setPreferencesState] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/account/me");
        const result = await readJsonResponseBody<AccountMeResponse>(response);

        if (!result.ok) {
          throw new Error(result.error);
        }

        const data = result.data;

        if (!cancelled) {
          setPreferencesState(readNotificationPreferences(data.immigrationProfile?.preferences));
          hasLoadedRef.current = true;
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Failed to load notification preferences.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  function updatePreference(key: keyof NotificationPreferences, value: boolean) {
    setPreferencesState((current) => ({ ...current, [key]: value }));
    if (hasLoadedRef.current) {
      markDirty(PROFILE_SECTION_IDS.notifications);
      setSuccess(null);
    }
  }

  const savePreferences = useCallback(
    async (nextPreferences: NotificationPreferences, successMessage: string) => {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationPreferences: nextPreferences }),
        });

        const result = await readJsonResponseBody<{
          error?: string;
          immigrationProfile?: ImmigrationProfile;
        }>(response);

        if (!result.ok) {
          throw new Error(result.error);
        }

        const payload = result.data;

        if (payload.immigrationProfile) {
          setPreferencesState(readNotificationPreferences(payload.immigrationProfile.preferences));
        } else {
          setPreferencesState(nextPreferences);
        }

        setSuccess(successMessage);
        markClean(PROFILE_SECTION_IDS.notifications);
      } catch (saveError: unknown) {
        const message =
          saveError instanceof Error
            ? saveError.message
            : "Failed to save notification preferences.";
        setError(message);
        throw saveError instanceof Error ? saveError : new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [markClean],
  );

  const saveCurrentPreferences = useCallback(async () => {
    await savePreferences(preferences, "Notification preferences saved.");
  }, [preferences, savePreferences]);

  useEffect(() => {
    return registerSaveHandler(PROFILE_SECTION_IDS.notifications, saveCurrentPreferences);
  }, [registerSaveHandler, saveCurrentPreferences]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await savePreferences(preferences, "Notification preferences saved.");
    } catch {
      // Error state is already set by savePreferences.
    }
  }

  async function resetToDefault() {
    setPreferencesState(DEFAULT_NOTIFICATION_PREFERENCES);
    setError(null);
    setSuccess(SECTION_CLEARED_MESSAGE);
    markDirty(PROFILE_SECTION_IDS.notifications);
  }

  return (
    <form className="space-y-5 p-1" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <h2 className="heading-2 text-lg">Notification Preferences</h2>
        <p className="mt-2 text-sm text-slate-600">
          Choose how IMMIFIN should notify you about immigration updates and reminders.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading notification preferences...</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">{PHONE_DISCLAIMER}</p>
          {NOTIFICATION_PREFERENCE_FIELDS.map((field) => (
            <label key={field.key} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={preferences[field.key]}
                onChange={(event) => updatePreference(field.key, event.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold text-slate-900">{field.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                  {field.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
        >
          {success}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="btn-primary w-full sm:flex-1"
          disabled={isLoading || isSaving}
        >
          {isSaving ? "Saving..." : "Save notification preferences"}
        </button>
        <div className="sm:flex-1">
          <ProfileSectionResetButton
            label="Reset to Default"
            title="Are you sure you want to reset this data?"
            message="This will reset this section only. It will not affect your account or other profile sections."
            confirmLabel="Yes, Reset Data"
            onReset={resetToDefault}
            disabled={isLoading || isSaving}
          />
        </div>
      </div>
    </form>
  );
}
