"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CalculatorProAutoPopulationHint } from "@/components/CalculatorProAutoPopulationHint";
import { useImmigrationProfileDefaults } from "@/lib/hooks/useImmigrationProfileDefaults";
import {
  chargeabilityOptions,
  employmentCategoryOptions,
  type LivePriorityDateCheck,
} from "@/lib/visaBulletinData";
import { getPublicVisaBulletinCanonicalPath } from "@/lib/visaBulletinPublicSlugs";

const categoryOptions = employmentCategoryOptions.filter(
  (option) => option.value !== "EB4" && option.value !== "EB5",
);

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15";

const statusStyles = {
  current: {
    container: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    dot: "bg-emerald-500",
    label: "Current",
  },
  eligible: {
    container: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    dot: "bg-emerald-500",
    label: "Eligible",
  },
  waiting: {
    container: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    dot: "bg-amber-500",
    label: "Still Waiting",
  },
  unavailable: {
    container: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    dot: "bg-slate-400",
    label: "Unavailable",
  },
} as const;

const statusMeanings: Record<LivePriorityDateCheck["status"], string> = {
  current:
    "The Visa Bulletin lists this category and country as Current. A Final Action Date cutoff is not being applied in the published chart. This is Visa Bulletin status only and does not mean USCIS has approved a Green Card.",
  eligible:
    "Your priority date is on or before the published Final Action Date. The current Final Action chart has reached your priority date. This does not by itself mean your Green Card is approved.",
  waiting:
    "Your priority date is later than the published Final Action Date. You remain behind the current cutoff. IMMIFIN does not estimate how many months or years this will take because Visa Bulletin cutoffs can move forward, remain unchanged, or retrogress.",
  unavailable:
    "The published Final Action chart lists visa numbers as unavailable for this combination. IMMIFIN does not treat Unavailable as a calendar date and does not estimate a future wait from it.",
};

function categoryLinkLabel(category: string): string {
  switch (category) {
    case "EB1":
      return "EB-1";
    case "EB2":
      return "EB-2";
    case "EB3":
      return "EB-3";
    default:
      return category;
  }
}

function countryLinkLabel(country: string): string {
  switch (country) {
    case "all":
      return "Rest of the World";
    case "china":
      return "China";
    case "india":
      return "India";
    case "mexico":
      return "Mexico";
    case "philippines":
      return "Philippines";
    default:
      return country;
  }
}

function getContextualVisaBulletinPath(category: string, country: string): string | null {
  if (!category || !country) {
    return null;
  }

  const categorySlug = category.toLowerCase();
  const countrySlug = country === "all" ? "rest-of-the-world" : country;
  return getPublicVisaBulletinCanonicalPath(categorySlug, countrySlug);
}

function ResultCard({
  label,
  value,
  description,
  highlight,
}: {
  label: string;
  value: string;
  description?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-brand-200 bg-gradient-to-br from-brand-50/80 to-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">{label}</p>
      <p className="mt-1 text-base font-semibold leading-snug text-slate-900">{value}</p>
      {description ? <p className="mt-1.5 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

export function GreenCardWaitTimeCalculator({ children }: { children?: ReactNode }) {
  const { defaults, loaded, autoPopulationEnabled, showProAutoPopulationHint } =
    useImmigrationProfileDefaults();
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [priorityDate, setPriorityDate] = useState("");
  const [result, setResult] = useState<LivePriorityDateCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);
  const profileDefaultsApplied = useRef(false);

  const savedGreenCardIssueDate =
    loaded && defaults?.greenCardIssueDate ? defaults.greenCardIssueDate : null;
  const contextualVisaBulletinPath = getContextualVisaBulletinPath(category, country);

  async function runCheck(cat: string, ctry: string, date: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/check-priority-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, country: ctry, priorityDate: date }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to check priority date.");
        return;
      }

      setResult(data as LivePriorityDateCheck);
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loaded || !autoPopulationEnabled || !defaults || profileDefaultsApplied.current) {
      return;
    }

    profileDefaultsApplied.current = true;

    const profileCategory =
      defaults.category && categoryOptions.some((option) => option.value === defaults.category)
        ? defaults.category
        : "";
    const profileCountry =
      defaults.countryChargeability &&
      chargeabilityOptions.some((option) => option.value === defaults.countryChargeability)
        ? defaults.countryChargeability
        : "";
    const profilePriority = defaults.priorityDate ?? "";

    if (profileCategory || profileCountry || profilePriority) {
      setPrefilledFromProfile(true);
    }

    setCategory((current) => current || profileCategory);
    setCountry((current) => current || profileCountry);
    setPriorityDate((current) => current || profilePriority);

    if (!defaults.greenCardIssueDate && profileCategory && profileCountry && profilePriority) {
      void runCheck(profileCategory, profileCountry, profilePriority);
    }
  }, [loaded, autoPopulationEnabled, defaults]);

  const maxDate = new Date().toISOString().split("T")[0];
  const canCalculate = category !== "" && country !== "" && priorityDate !== "";

  async function handleCalculate(event: FormEvent) {
    event.preventDefault();
    if (!canCalculate) {
      return;
    }

    await runCheck(category, country, priorityDate);
  }

  return (
    <div className="space-y-5">
      {showProAutoPopulationHint ? <CalculatorProAutoPopulationHint /> : null}
      {prefilledFromProfile && autoPopulationEnabled ? (
        <div
          className="mb-6 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-slate-700"
          role="status"
        >
          <p className="font-medium text-slate-900">Loaded from your immigration profile</p>
          <p className="mt-1 text-slate-600">
            Values were prefilled automatically. Change any field and click Check My Status to run a
            different scenario.
          </p>
        </div>
      ) : null}

      <form onSubmit={handleCalculate} aria-label="Employment-based Green Card wait time calculator">
        <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <section
            className="border-b border-slate-200 p-4 sm:p-5 lg:border-b-0 lg:border-r"
            aria-labelledby="green-card-input-heading"
          >
            <h2 id="green-card-input-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Your information
            </h2>

            <div className="mt-3 space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-900">
                  Employment Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
                    setPrefilledFromProfile(false);
                    setResult(null);
                    setError(null);
                  }}
                  className={inputClassName}
                >
                  <option value="">Select a category</option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">EB-1, EB-2, or EB-3</p>
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-slate-900">
                  Country of Chargeability
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={country}
                  onChange={(event) => {
                    setCountry(event.target.value);
                    setPrefilledFromProfile(false);
                    setResult(null);
                    setError(null);
                  }}
                  className={inputClassName}
                >
                  <option value="">Select a country</option>
                  {chargeabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  The country that counts for Visa Bulletin chargeability, usually your country of
                  birth.
                </p>
              </div>

              <div>
                <label htmlFor="priority-date" className="block text-sm font-medium text-slate-900">
                  Priority Date
                </label>
                <input
                  type="date"
                  id="priority-date"
                  name="priorityDate"
                  required
                  max={maxDate}
                  value={priorityDate}
                  onChange={(event) => {
                    setPriorityDate(event.target.value);
                    setPrefilledFromProfile(false);
                    setResult(null);
                    setError(null);
                  }}
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-slate-500">
                  The priority date listed on your I-140, I-130, or PERM approval notice.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Used only to compare with the current Final Action Date.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary mt-4 w-full min-h-[40px] rounded-lg px-4 py-2 shadow-sm disabled:opacity-50"
              disabled={!canCalculate || loading}
            >
              {loading ? "Checking…" : "Check My Status"}
            </button>
          </section>

          <section
            className="bg-slate-50/50 p-4 sm:p-5"
            aria-labelledby="green-card-result-heading"
            aria-live="polite"
          >
            <h2 id="green-card-result-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Your result
            </h2>

            {savedGreenCardIssueDate && !loading && !error && !result ? (
              <div
                className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5"
                role="status"
              >
                <p className="text-sm font-semibold text-emerald-950">
                  You already have a Green Card based on your saved profile.
                </p>
                <p className="mt-1.5 text-sm text-emerald-900">
                  Green card issue date:{" "}
                  <span className="font-medium">
                    {new Date(`${savedGreenCardIssueDate}T00:00:00`).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </p>
              </div>
            ) : loading ? (
              <div className="mt-3 flex min-h-[12rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-700">Checking priority date…</p>
              </div>
            ) : error ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
                {error}
              </div>
            ) : !result ? (
              <div className="mt-3 flex min-h-[12rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Enter your category, country, and priority date, then check your current status.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <ResultCard
                  label="Your priority date"
                  value={new Date(`${result.priorityDate}T00:00:00`).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
                <ResultCard
                  label="Current Final Action Date"
                  value={result.formattedCutoff}
                  highlight
                />
                <div className={`rounded-lg border p-4 ${statusStyles[result.status].container}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Current status
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${statusStyles[result.status].dot}`}
                      aria-hidden="true"
                    />
                    <p className="text-lg font-semibold text-slate-900">
                      {statusStyles[result.status].label}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                    What this means
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {statusMeanings[result.status]}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </form>

      {children}

      {contextualVisaBulletinPath ? (
        <p className="px-1 text-sm text-slate-600">
          <Link
            href={contextualVisaBulletinPath}
            className="font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            See the current {categoryLinkLabel(category)} {countryLinkLabel(country)} Visa Bulletin
          </Link>
        </p>
      ) : null}
    </div>
  );
}
