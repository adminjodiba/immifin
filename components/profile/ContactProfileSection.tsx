"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  COUNTRY_CODE_PRESETS,
  inferDefaultCountryCode,
  parseE164Phone,
  stripPhoneInput,
} from "@/lib/account/countryCodes";
import { buildSignupContactMetadata } from "@/lib/clerk/signupMetadata";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import type { ImmigrationProfile, Profile } from "@/lib/supabase/types";

const PHONE_DISCLAIMER =
  "Your phone number may be used to send immigration alerts and notifications based on your communication preferences.";

type AccountMeResponse = {
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
};

type ContactProfileSectionProps = {
  variant?: "profile" | "onboarding";
  onSaved?: () => void;
};

export function ContactProfileSection({
  variant = "profile",
  onSaved,
}: ContactProfileSectionProps) {
  const { user } = useUser();
  const [countryCodePreset, setCountryCodePreset] = useState("+1");
  const [customCountryCode, setCustomCountryCode] = useState("");
  const [phoneLocalNumber, setPhoneLocalNumber] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOtherCountryCode = countryCodePreset === "other";

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
        const response = await fetch("/api/account/me");
        const result = await readJsonResponseBody<AccountMeResponse>(response);

        if (!result.ok) {
          throw new Error(result.error);
        }

        const data = result.data;
        const parsed = parseE164Phone(data.profile.phone_number);

        if (!cancelled) {
          if (parsed) {
            const isKnown = ["+971", "+91", "+61", "+44", "+1"].includes(parsed.countryCode);
            setCountryCodePreset(isKnown ? parsed.countryCode : "other");
            setCustomCountryCode(isKnown ? "" : parsed.countryCode);
            setPhoneLocalNumber(parsed.localNumber);
          } else {
            const defaults = inferDefaultCountryCode({
              savedPhone: data.profile.phone_number,
              browserLocale: typeof navigator !== "undefined" ? navigator.language : null,
              immigrationCountry: data.immigrationProfile?.default_country ?? null,
            });
            setCountryCodePreset(defaults.preset);
            setCustomCountryCode(defaults.customCode);
            setPhoneLocalNumber("");
          }
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          setCountryCodePreset(isKnown ? parsed.countryCode : "other");
          setCustomCountryCode(isKnown ? "" : parsed.countryCode);
          setPhoneLocalNumber(parsed.localNumber);
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

      if (variant === "onboarding") {
        onSaved?.();
      }
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save contact details.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  const heading =
    variant === "profile" ? "Contact" : "Complete your contact preferences";

  const description =
    variant === "profile"
      ? "Your IMMIFIN contact phone for alerts and notifications. This is separate from your Clerk sign-in credentials."
      : "Add your phone number to complete account setup.";

  const formClassName =
    variant === "profile" ? "space-y-5 p-1" : "space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

  return (
    <form className={formClassName} onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <h2 className="heading-2 text-lg">{heading}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        {variant === "profile" && (
          <p className="mt-2 text-sm text-slate-600">
            Manage alert and notification preferences in the{" "}
            <a href="#/notifications" className="font-semibold text-brand-700 underline underline-offset-2">
              Notifications
            </a>{" "}
            tab.
          </p>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading contact details...</p>
      ) : (
        <>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Not verified yet</p>
            <p className="mt-1 text-xs text-amber-800">Phone verification is coming soon.</p>
          </div>

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
              onChange={(event) =>
                setPhoneLocalNumber(stripPhoneInput(event.target.value))
              }
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

      {variant === "profile" ? (
        <button type="submit" className="btn-primary w-full" disabled={isLoading || isSaving}>
          {isSaving ? "Saving..." : "Save contact details"}
        </button>
      ) : (
        <button type="submit" className="btn-primary w-full" disabled={isLoading || isSaving}>
          {isSaving ? "Saving..." : "Save & Continue"}
        </button>
      )}
    </form>
  );
}
