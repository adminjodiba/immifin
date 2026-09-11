"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { MyProfileQuadrant } from "@/components/profile/MyProfileQuadrant";
import {
  PROFILE_SECTION_IDS,
  useOptionalProfileDirtyState,
} from "@/components/profile/ProfileDirtyStateProvider";
import {
  COUNTRY_CODE_PRESETS,
  inferDefaultCountryCode,
  parseE164Phone,
  stripPhoneInput,
} from "@/lib/account/countryCodes";
import { fetchAccountMe } from "@/lib/account/fetchAccountMe";
import { buildSignupContactMetadata } from "@/lib/clerk/signupMetadata";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import type { Profile } from "@/lib/supabase/types";

const PHONE_DISCLAIMER =
  "Your phone number may be used to send immigration alerts and notifications based on your communication preferences.";

type ContactProfileSectionProps = {
  variant?: "profile" | "onboarding";
  onSaved?: () => void;
};

export function ContactProfileSection({
  variant = "profile",
  onSaved,
}: ContactProfileSectionProps) {
  const { user } = useUser();
  const dirtyState = useOptionalProfileDirtyState();
  const tracksDirty = variant === "profile" && dirtyState !== null;
  const hasLoadedRef = useRef(false);

  const [countryCodePreset, setCountryCodePresetState] = useState("+1");
  const [customCountryCode, setCustomCountryCodeState] = useState("");
  const [phoneLocalNumber, setPhoneLocalNumberState] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOtherCountryCode = countryCodePreset === "other";

  const trackChange = useCallback(
    <T,>(setter: (value: T) => void) =>
      (value: T) => {
        setter(value);
        if (tracksDirty && hasLoadedRef.current) {
          dirtyState?.markDirty(PROFILE_SECTION_IDS.contact);
          setSuccess(null);
        }
      },
    [dirtyState, tracksDirty],
  );

  const setCountryCodePreset = useMemo(
    () => trackChange(setCountryCodePresetState),
    [trackChange],
  );
  const setCustomCountryCode = useMemo(
    () => trackChange(setCustomCountryCodeState),
    [trackChange],
  );
  const setPhoneLocalNumber = useMemo(
    () => trackChange(setPhoneLocalNumberState),
    [trackChange],
  );

  const presetOptions = useMemo(
    () =>
      COUNTRY_CODE_PRESETS.map((option, index) => ({
        ...option,
        key: `${option.value}-${index}`,
      })),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadContact() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchAccountMe();

        if (!result.ok) {
          throw new Error(result.error);
        }

        const data = result.data;
        const parsed = parseE164Phone(data.profile.phone_number);

        if (!cancelled) {
          if (parsed) {
            const isKnown = ["+971", "+91", "+61", "+44", "+1"].includes(parsed.countryCode);
            setCountryCodePresetState(isKnown ? parsed.countryCode : "other");
            setCustomCountryCodeState(isKnown ? "" : parsed.countryCode);
            setPhoneLocalNumberState(parsed.localNumber);
          } else {
            const defaults = inferDefaultCountryCode({
              savedPhone: data.profile.phone_number,
              browserLocale: typeof navigator !== "undefined" ? navigator.language : null,
              immigrationCountry: data.immigrationProfile?.default_country ?? null,
            });
            setCountryCodePresetState(defaults.preset);
            setCustomCountryCodeState(defaults.customCode);
            setPhoneLocalNumberState("");
          }

          hasLoadedRef.current = true;
        }
      } catch (loadError: unknown) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load contact details.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadContact();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveContactDetails = useCallback(async () => {
    if (!hasLoadedRef.current) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: countryCodePreset,
          phoneLocalNumber,
          customCountryCode: isOtherCountryCode ? customCountryCode : undefined,
        }),
      });

      const result = await readJsonResponseBody<{
        error?: string;
        profile?: Profile;
      }>(response);

      if (!result.ok) {
        throw new Error(result.error);
      }

      const payload = result.data;

      if (payload.profile?.phone_number) {
        const parsed = parseE164Phone(payload.profile.phone_number);
        if (parsed) {
          const isKnown = countryCodePreset !== "other" && parsed.countryCode === countryCodePreset;
          setCountryCodePresetState(isKnown ? parsed.countryCode : "other");
          setCustomCountryCodeState(isKnown ? "" : parsed.countryCode);
          setPhoneLocalNumberState(parsed.localNumber);
        }
      }

      if (user && payload.profile?.phone_number) {
        await user.update({
          unsafeMetadata: buildSignupContactMetadata({
            phoneNumber: payload.profile.phone_number,
            automatedAlertsOptIn: false,
          }),
        });
      }

      setSuccess(
        variant === "profile" ? "Contact details saved." : "Contact preferences saved.",
      );
      dirtyState?.markClean(PROFILE_SECTION_IDS.contact);

      if (variant === "onboarding") {
        onSaved?.();
      }
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save contact details.";
      setError(message);
      throw saveError instanceof Error ? saveError : new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    countryCodePreset,
    phoneLocalNumber,
    isOtherCountryCode,
    customCountryCode,
    user,
    variant,
    onSaved,
    dirtyState,
  ]);

  useEffect(() => {
    if (!tracksDirty || !dirtyState) {
      return;
    }

    return dirtyState.registerSaveHandler(PROFILE_SECTION_IDS.contact, saveContactDetails);
  }, [tracksDirty, dirtyState, saveContactDetails]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveContactDetails();
    } catch {
      // Error state is already set by saveContactDetails.
    }
  }

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.fullName || "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  if (variant === "onboarding") {
    return (
      <form
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div>
          <h2 className="ds2-workspace-heading">Complete your contact preferences</h2>
          <p className="mt-2 text-sm text-slate-600">Add your phone number to complete account setup.</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-600">Loading contact details...</p>
        ) : (
          <>
            <div>
              <label
                htmlFor="contact-countryCode"
                className="block text-sm font-semibold text-slate-900"
              >
                Country code <span className="text-red-600">*</span>
              </label>
              <select
                id="contact-countryCode"
                name="countryCode"
                className="input-field"
                value={countryCodePreset}
                onChange={(event) => setCountryCodePreset(event.target.value)}
                required
              >
                {presetOptions.map((option) => (
                  <option key={option.key} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {isOtherCountryCode && (
              <div>
                <label
                  htmlFor="contact-customCountryCode"
                  className="block text-sm font-semibold text-slate-900"
                >
                  Custom country code <span className="text-red-600">*</span>
                </label>
                <input
                  id="contact-customCountryCode"
                  name="customCountryCode"
                  type="text"
                  className="input-field"
                  value={customCountryCode}
                  onChange={(event) => setCustomCountryCode(event.target.value)}
                  required
                  placeholder="+353"
                  pattern="\+\d{1,4}"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="contact-phoneLocalNumber"
                className="block text-sm font-semibold text-slate-900"
              >
                Phone number <span className="text-red-600">*</span>
              </label>
              <input
                id="contact-phoneLocalNumber"
                name="phoneLocalNumber"
                type="tel"
                className="input-field"
                value={phoneLocalNumber}
                onChange={(event) => setPhoneLocalNumber(stripPhoneInput(event.target.value))}
                required
                maxLength={15}
                pattern="[\d\s+\-()]+"
                autoComplete="tel-national"
                placeholder="713 555 1234"
              />
              <p className="mt-1.5 text-xs text-slate-500">{PHONE_DISCLAIMER}</p>
            </div>
          </>
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
          {isSaving ? "Saving..." : "Save & Continue"}
        </button>
      </form>
    );
  }

  return (
    <MyProfileQuadrant
      accent="personal"
      id="profile-contact"
      title="Personal Information"
      subtitle="Keep your personal information up to date. This helps you personalize your experience."
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="8" r="3.1" />
          <path d="M5.4 19c.7-3.2 3.2-5.1 6.6-5.1s5.9 1.9 6.6 5.1" strokeLinecap="round" />
        </svg>
      }
    >
      {isLoading ? (
        <p className="ds2-profile-quad-loading">Loading contact details...</p>
      ) : (
        <div className="ds2-profile-field-grid">
          <div>
            <label htmlFor="profile-full-name" className="ds2-profile-label">
              Full Name
            </label>
            <input
              id="profile-full-name"
              className="input-field ds2-profile-input-readonly"
              value={fullName}
              readOnly
              aria-readonly="true"
            />
            <p className="ds2-profile-help">As it appears on your official documents.</p>
          </div>
          <div>
            <label htmlFor="profile-email" className="ds2-profile-label">
              Email Address
            </label>
            <input
              id="profile-email"
              className="input-field ds2-profile-input-readonly"
              value={email}
              readOnly
              aria-readonly="true"
            />
            <p className="ds2-profile-help">Managed by your account provider.</p>
          </div>
          <div>
            <label htmlFor="contact-countryCode" className="ds2-profile-label">
              Country code <span className="text-red-600">*</span>
            </label>
            <select
              id="contact-countryCode"
              name="countryCode"
              className="input-field"
              value={countryCodePreset}
              onChange={(event) => setCountryCodePreset(event.target.value)}
              required
            >
              {presetOptions.map((option) => (
                <option key={option.key} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contact-phoneLocalNumber" className="ds2-profile-label">
              Phone Number <span className="text-red-600">*</span>
            </label>
            <input
              id="contact-phoneLocalNumber"
              name="phoneLocalNumber"
              type="tel"
              className="input-field"
              value={phoneLocalNumber}
              onChange={(event) => setPhoneLocalNumber(stripPhoneInput(event.target.value))}
              required
              maxLength={15}
              pattern="[\d\s+\-()]+"
              autoComplete="tel-national"
              placeholder="713 555 1234"
            />
            <p className="ds2-profile-help">{PHONE_DISCLAIMER}</p>
          </div>
          {isOtherCountryCode ? (
            <div className="ds2-profile-field-span">
              <label htmlFor="contact-customCountryCode" className="ds2-profile-label">
                Custom country code <span className="text-red-600">*</span>
              </label>
              <input
                id="contact-customCountryCode"
                name="customCountryCode"
                type="text"
                className="input-field"
                value={customCountryCode}
                onChange={(event) => setCustomCountryCode(event.target.value)}
                required
                placeholder="+353"
                pattern="\+\d{1,4}"
              />
            </div>
          ) : null}
        </div>
      )}

      {error ? (
        <div className="ds2-profile-quad-alert ds2-profile-quad-alert-error" role="alert">
          {error}
        </div>
      ) : null}
    </MyProfileQuadrant>
  );
}
