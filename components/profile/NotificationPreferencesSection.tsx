"use client";

import { useEffect, useState, type FormEvent } from "react";
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

type AccountMeResponse = {
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
};

export function NotificationPreferencesSection() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
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
          setPreferences(readNotificationPreferences(data.immigrationProfile?.preferences));
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
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPreferences: preferences }),
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
        setPreferences(readNotificationPreferences(payload.immigrationProfile.preferences));
      }

      setSuccess("Notification preferences saved.");
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save notification preferences.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
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
                <span className="mt-1 block text-xs text-slate-500">{field.description}</span>
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

      <button type="submit" className="btn-primary w-full" disabled={isLoading || isSaving}>
        {isSaving ? "Saving..." : "Save notification preferences"}
      </button>
    </form>
  );
}
