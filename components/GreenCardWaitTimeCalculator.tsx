"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import {
  chargeabilityOptions,
  employmentCategoryOptions,
  type LivePriorityDateCheck,
} from "@/lib/visaBulletinData";
import { CalculatorProAutoPopulationHint } from "@/components/CalculatorProAutoPopulationHint";
import { CalculatorProfilePrefillHint } from "@/components/CalculatorProfilePrefillHint";
import { RelatedImmigrationResources } from "@/components/RelatedImmigrationResources";
import { useImmigrationProfileDefaults } from "@/lib/hooks/useImmigrationProfileDefaults";

const PAGE_HREF = "/calculators/green-card-wait-time";
const PAGE_TITLE = "Green Card Calculator";

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
    label: "Still waiting",
  },
  unavailable: {
    container: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    dot: "bg-slate-400",
    label: "Unavailable",
  },
} as const;

function StatusBanner({ result }: { result: LivePriorityDateCheck }) {
  const styles = statusStyles[result.status];

  return (
    <div className={`rounded-lg border p-4 ${styles.container}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Priority date status
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden="true" />
        <p className="text-lg font-semibold text-slate-900">{styles.label}</p>
      </div>
      <p className="mt-2 text-sm text-slate-600 lg:whitespace-nowrap">{result.message}</p>
    </div>
  );
}

function ResultCard({
  label,
  value,
  description,
  highlight,
}: {
  label: string;
  value: string;
  description: string;
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
      <p className="mt-1.5 text-sm text-slate-600 lg:whitespace-nowrap">{description}</p>
    </div>
  );
}

export function GreenCardWaitTimeCalculator() {
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

    if (
      !defaults.greenCardIssueDate &&
      profileCategory &&
      profileCountry &&
      profilePriority
    ) {
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
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">{PAGE_TITLE}</h1>
              <FavoriteStar pageLabel={PAGE_TITLE} pageHref={PAGE_HREF} />
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Compare your priority date to the latest visa bulletin cutoff for your category and country.
            </p>
          </div>
        </div>
        <Link
          href="/calculators"
          className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30"
          aria-label="Close and return to calculators"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      </header>

      <div className="mt-3 space-y-5">
        {showProAutoPopulationHint ? <CalculatorProAutoPopulationHint /> : null}
        {prefilledFromProfile && autoPopulationEnabled ? <CalculatorProfilePrefillHint /> : null}

        <form onSubmit={handleCalculate} aria-label="Green card calculator">
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
                    Category
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
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-slate-900">
                    Country of chargeability
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
                </div>

                <div>
                  <label htmlFor="priority-date" className="block text-sm font-medium text-slate-900">
                    Priority date
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
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 flex min-h-[40px] w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canCalculate || loading}
              >
                {loading ? "Checking…" : "Calculate"}
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
                  <p className="text-sm font-medium text-slate-700">Results will appear here</p>
                  <p className="mt-1 max-w-[16rem] text-xs text-slate-500">
                    Choose category, country, and priority date, then tap Calculate.
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <StatusBanner result={result} />
                  <ResultCard
                    label="Bulletin cutoff"
                    value={result.formattedCutoff}
                    description={`Final action date for ${result.category} (${result.country}).`}
                    highlight
                  />
                  <ResultCard
                    label="Your priority date"
                    value={new Date(`${result.priorityDate}T00:00:00`).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    description="Compared against the latest published visa bulletin data."
                  />
                </div>
              )}
            </section>
          </div>
        </form>

        <RelatedImmigrationResources
          resources={[
            {
              title: "Visa Bulletin Dashboard",
              description:
                "View the latest employment-based visa bulletin dates and priority date cutoffs.",
              href: "/immigration/visa-bulletin",
            },
            {
              title: "Citizenship Eligibility Calculator",
              description: "Estimate when you may apply for U.S. citizenship.",
              href: "/calculators/citizenship-eligibility",
            },
          ]}
        />

        <div className="flex gap-2.5 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/80 p-4">
          <span className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </span>
          <p className="text-sm text-amber-950/80">
            <strong className="font-semibold text-amber-950">Disclaimer:</strong> This calculator
            uses published visa bulletin cutoffs for informational purposes only. It does not
            constitute legal advice. Final action dates can change monthly and depend on your
            specific case details.
          </p>
        </div>
      </div>
    </>
  );
}
