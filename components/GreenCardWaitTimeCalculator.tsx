"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  chargeabilityOptions,
  employmentCategoryOptions,
  type LivePriorityDateCheck,
} from "@/lib/visaBulletinData";

const categoryOptions = employmentCategoryOptions.filter(
  (option) => option.value !== "EB4" && option.value !== "EB5",
);

const inputClassName =
  "mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:text-sm";

const statusStyles = {
  current: {
    container: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    label: "Current",
  },
  eligible: {
    container: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    label: "Eligible",
  },
  waiting: {
    container: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    badge: "bg-amber-100 text-amber-900",
    dot: "bg-amber-500",
    label: "Still waiting",
  },
  unavailable: {
    container: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    label: "Unavailable",
  },
} as const;

function StatusBanner({ result }: { result: LivePriorityDateCheck }) {
  const styles = statusStyles[result.status];

  return (
    <div className={`rounded-2xl border p-5 sm:p-6 ${styles.container}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Priority date status
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{styles.label}</p>
          </div>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
        >
          {styles.label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{result.message}</p>
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
      className={`rounded-2xl border p-5 sm:p-6 ${
        highlight
          ? "border-brand-200 bg-gradient-to-br from-brand-50 to-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{label}</p>
      <p className="mt-2 text-xl font-bold leading-snug text-slate-900 sm:text-2xl">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}

export function GreenCardWaitTimeCalculator() {
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");
  const [priorityDate, setPriorityDate] = useState("");
  const [result, setResult] = useState<LivePriorityDateCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const maxDate = new Date().toISOString().split("T")[0];
  const canCalculate = category !== "" && country !== "" && priorityDate !== "";

  async function handleCalculate(event: FormEvent) {
    event.preventDefault();
    if (!canCalculate) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/check-priority-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, country, priorityDate }),
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

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/calculators"
        className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800 sm:mb-8"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </span>
        Back to Calculators
      </Link>

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200/80">
        <div className="border-b border-slate-100 bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-6 sm:px-8 sm:py-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">Priority date check</h2>
              <p className="mt-1 text-sm leading-relaxed text-blue-100">
                Compare your priority date to the latest visa bulletin cutoff for your category and country.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <form className="space-y-8" onSubmit={handleCalculate} aria-label="Green card wait time calculator">
            <div className="space-y-6">
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-slate-900">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value);
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
                <label htmlFor="country" className="block text-sm font-semibold text-slate-900">
                  Country of chargeability
                </label>
                <select
                  id="country"
                  name="country"
                  required
                  value={country}
                  onChange={(event) => {
                    setCountry(event.target.value);
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
                <label htmlFor="priority-date" className="block text-sm font-semibold text-slate-900">
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
                    setResult(null);
                    setError(null);
                  }}
                  className={inputClassName}
                />
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  The priority date listed on your I-140, I-130, or PERM approval notice.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-700/25 transition-all hover:bg-brand-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:text-sm"
              disabled={!canCalculate || loading}
            >
              {loading ? "Checking…" : "Calculate"}
            </button>
          </form>

          {error && (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              {error}
            </div>
          )}

          {!result && !error && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-center sm:px-8">
              <p className="text-sm font-medium text-slate-700">Your results will appear here</p>
              <p className="mt-1 text-xs text-slate-500">
                Choose category, country, and priority date, then tap Calculate.
              </p>
            </div>
          )}

          {result && (
            <div className="mt-8 space-y-4" role="status" aria-live="polite">
              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Your result
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <StatusBanner result={result} />

              <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          )}

          <div className="mt-8 flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-4 sm:p-5">
            <span className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </span>
            <p className="text-sm leading-relaxed text-amber-950/80">
              <strong className="font-semibold text-amber-950">Disclaimer:</strong> This calculator
              uses published visa bulletin cutoffs for informational purposes only. It does not
              constitute legal advice. Final action dates can change monthly and depend on your
              specific case details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
