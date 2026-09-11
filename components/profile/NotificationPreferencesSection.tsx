"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MyProfileQuadrant } from "@/components/profile/MyProfileQuadrant";
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
import { fetchAccountMe } from "@/lib/account/fetchAccountMe";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import type { ImmigrationProfile } from "@/lib/supabase/types";

function PreferenceIcon({ name }: { name: keyof NotificationPreferences }) {
  const common = "h-4 w-4";
  if (name === "smsAlerts") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M5 6.5h14v8.5H8.5L5 18.2V6.5Z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "emailAlerts") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="4" y="6.5" width="16" height="11" rx="1.6" />
        <path d="m5 8 7 5 7-5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "visaBulletinUpdates") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M5 17V9M10 17V6M15 17v-5M19 17v-8" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "priorityDateCurrent") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 16.5 9 11l3.5 3.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "citizenshipReminders") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 4.8h7.2L19 8.6v11.1H7V4.8Z" />
        <path d="M14.2 4.8V8.6H19M9.6 12.2h5M9.6 15.4h5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 4.6 13.7 9h4.7l-3.8 3 1.4 4.6L12 14.4 7.96 16.6 9.4 12 5.6 9h4.7L12 4.6Z" />
    </svg>
  );
}

export function NotificationPreferencesSection() {
  const { markDirty, markClean, registerSaveHandler } = useProfileDirtyState();
  const hasLoadedRef = useRef(false);

  const [preferences, setPreferencesState] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreferences() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAccountMe();

        if (!result.ok) {
          throw new Error(result.error);
        }

        if (!cancelled) {
          setPreferencesState(readNotificationPreferences(result.data.immigrationProfile?.preferences));
          hasLoadedRef.current = true;
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load notification preferences.",
          );
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
    }
  }

  const savePreferences = useCallback(
    async (nextPreferences: NotificationPreferences) => {
      setError(null);

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

      if (result.data.immigrationProfile) {
        setPreferencesState(readNotificationPreferences(result.data.immigrationProfile.preferences));
      } else {
        setPreferencesState(nextPreferences);
      }

      markClean(PROFILE_SECTION_IDS.notifications);
    },
    [markClean],
  );

  const saveCurrentPreferences = useCallback(async () => {
    if (!hasLoadedRef.current) {
      return;
    }

    try {
      await savePreferences(preferences);
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save notification preferences.";
      setError(message);
      throw saveError instanceof Error ? saveError : new Error(message);
    }
  }, [preferences, savePreferences]);

  useEffect(() => {
    return registerSaveHandler(PROFILE_SECTION_IDS.notifications, saveCurrentPreferences);
  }, [registerSaveHandler, saveCurrentPreferences]);

  return (
    <MyProfileQuadrant
      accent="notifications"
      id="profile-notifications"
      title="Notification Preferences"
      subtitle="Choose what updates and alerts you’d like to receive. You can change these at any time."
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M12 5.2a4.4 4.4 0 0 1 4.4 4.4v3.1l1.4 2.4H6.2l1.4-2.4V9.6A4.4 4.4 0 0 1 12 5.2Z" />
          <path d="M10 18.2a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
      }
    >
      {isLoading ? (
        <p className="ds2-profile-quad-loading">Loading notification preferences...</p>
      ) : (
        <ul className="ds2-profile-pref-list">
          {NOTIFICATION_PREFERENCE_FIELDS.map((field) => (
            <li key={field.key}>
              <label className="ds2-profile-pref-row">
                <span className="ds2-profile-pref-icon" aria-hidden="true">
                  <PreferenceIcon name={field.key} />
                </span>
                <span className="ds2-profile-pref-copy">
                  <span className="ds2-profile-pref-title">{field.label}</span>
                  <span className="ds2-profile-pref-description">{field.description}</span>
                </span>
                <input
                  type="checkbox"
                  className="ds2-profile-switch"
                  checked={preferences[field.key]}
                  onChange={(event) => updatePreference(field.key, event.target.checked)}
                  aria-label={field.label}
                />
              </label>
            </li>
          ))}
        </ul>
      )}
      {error ? (
        <div className="ds2-profile-quad-alert ds2-profile-quad-alert-error" role="alert">
          {error}
        </div>
      ) : null}
    </MyProfileQuadrant>
  );
}
