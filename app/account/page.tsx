"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import type { ImmigrationProfile, Profile } from "@/lib/supabase/types";

type AccountMeResponse = {
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
};

const categoryOptions = [
  { value: "", label: "No default" },
  { value: "EB1", label: "EB1" },
  { value: "EB2", label: "EB2" },
  { value: "EB3", label: "EB3" },
];

const countryOptions = [
  { value: "", label: "No default" },
  { value: "India", label: "India" },
  { value: "China", label: "China" },
  { value: "Mexico", label: "Mexico" },
  { value: "Philippines", label: "Philippines" },
  { value: "ROW", label: "Rest of World (ROW)" },
];

const bulletinTypeOptions = [
  { value: "", label: "No default" },
  { value: "final_action", label: "Final Action Dates" },
  { value: "dates_for_filing", label: "Dates for Filing" },
];

const marriedToUsCitizenOptions = [
  { value: "", label: "No default" },
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

function marriedToFormValue(value: boolean | null | undefined): string {
  if (value === true) {
    return "true";
  }

  if (value === false) {
    return "false";
  }

  return "";
}

export default function AccountPage() {
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultCountry, setDefaultCountry] = useState("");
  const [defaultBulletinType, setDefaultBulletinType] = useState("");
  const [greenCardIssueDate, setGreenCardIssueDate] = useState("");
  const [marriedToUsCitizen, setMarriedToUsCitizen] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileEmail, setProfileEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/account/me");

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? "Failed to load account settings.");
        }

        const data = (await response.json()) as AccountMeResponse;

        if (cancelled) {
          return;
        }

        setProfileEmail(data.profile.email);
        setDefaultCategory(data.immigrationProfile?.default_category ?? "");
        setDefaultCountry(data.immigrationProfile?.default_country ?? "");
        setDefaultBulletinType(data.immigrationProfile?.default_bulletin_type ?? "");
        setGreenCardIssueDate(data.immigrationProfile?.green_card_issue_date ?? "");
        setMarriedToUsCitizen(marriedToFormValue(data.immigrationProfile?.married_to_us_citizen));
      } catch (loadError: unknown) {
        if (!cancelled) {
          const message =
            loadError instanceof Error ? loadError.message : "Failed to load account settings.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadAccount();

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
      const response = await fetch("/api/account/immigration-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultCategory,
          defaultCountry,
          defaultBulletinType,
          greenCardIssueDate,
          marriedToUsCitizen:
            marriedToUsCitizen === "" ? null : marriedToUsCitizen === "true",
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        immigrationProfile?: ImmigrationProfile;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save immigration profile.");
      }

      const immigrationProfile = payload.immigrationProfile;

      if (immigrationProfile) {
        setDefaultCategory(immigrationProfile.default_category ?? "");
        setDefaultCountry(immigrationProfile.default_country ?? "");
        setDefaultBulletinType(immigrationProfile.default_bulletin_type ?? "");
        setGreenCardIssueDate(immigrationProfile.green_card_issue_date ?? "");
        setMarriedToUsCitizen(marriedToFormValue(immigrationProfile.married_to_us_citizen));
      }

      setSuccess("Immigration profile saved.");
    } catch (saveError: unknown) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save immigration profile.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        breadcrumb="Account"
        title="Account Settings"
        description="Manage your immigration defaults for calculators and bulletin tools."
      />

      <section className="section-padding !pt-10 sm:!pt-16">
        <div className="container-main">
          <div className="mx-auto max-w-2xl">
            {profileEmail && (
              <p className="mb-6 text-sm text-slate-600">
                Signed in as <span className="font-medium text-slate-900">{profileEmail}</span>
              </p>
            )}

            <form className="card-static space-y-5" onSubmit={handleSubmit}>
              <div>
                <h2 className="heading-2">Immigration Profile</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Set employment-based defaults, country of chargeability, bulletin date type, and
                  optional citizenship planning fields.
                </p>
              </div>

              {isLoading ? (
                <p className="text-sm text-slate-600">Loading account settings...</p>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="defaultCategory"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Default category
                    </label>
                    <select
                      id="defaultCategory"
                      name="defaultCategory"
                      className="input-field"
                      value={defaultCategory}
                      onChange={(event) => setDefaultCategory(event.target.value)}
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value || "empty"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="defaultCountry"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Default country
                    </label>
                    <select
                      id="defaultCountry"
                      name="defaultCountry"
                      className="input-field"
                      value={defaultCountry}
                      onChange={(event) => setDefaultCountry(event.target.value)}
                    >
                      {countryOptions.map((option) => (
                        <option key={option.value || "empty"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="defaultBulletinType"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Default bulletin type
                    </label>
                    <select
                      id="defaultBulletinType"
                      name="defaultBulletinType"
                      className="input-field"
                      value={defaultBulletinType}
                      onChange={(event) => setDefaultBulletinType(event.target.value)}
                    >
                      {bulletinTypeOptions.map((option) => (
                        <option key={option.value || "empty"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="greenCardIssueDate"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Green card issue date{" "}
                      <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <input
                      id="greenCardIssueDate"
                      name="greenCardIssueDate"
                      type="date"
                      className="input-field"
                      value={greenCardIssueDate}
                      onChange={(event) => setGreenCardIssueDate(event.target.value)}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Leave blank if you do not have a green card yet.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="marriedToUsCitizen"
                      className="block text-sm font-semibold text-slate-900"
                    >
                      Married to U.S. citizen{" "}
                      <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <select
                      id="marriedToUsCitizen"
                      name="marriedToUsCitizen"
                      className="input-field"
                      value={marriedToUsCitizen}
                      onChange={(event) => setMarriedToUsCitizen(event.target.value)}
                    >
                      {marriedToUsCitizenOptions.map((option) => (
                        <option key={option.value || "empty"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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
                {isSaving ? "Saving..." : "Save immigration profile"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
