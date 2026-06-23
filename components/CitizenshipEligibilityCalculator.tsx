"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  calculateCitizenshipEligibility,
  formatEligibilityDate,
  getEligibilityStatus,
  type CitizenshipEligibilityResult,
} from "@/lib/citizenship-eligibility";

const inputClassName =
  "mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-base text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 sm:text-sm";

const statusStyles = {
  eligible: {
    container: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  eligible_to_file: {
    container: "border-brand-200 bg-gradient-to-br from-brand-50 to-white",
    badge: "bg-brand-100 text-brand-800",
    dot: "bg-brand-500",
  },
  not_yet_eligible: {
    container: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
} as const;

function EligibilityStatusBanner({ result }: { result: CitizenshipEligibilityResult }) {
  const statusInfo = getEligibilityStatus(result);
  const styles = statusStyles[statusInfo.status];

  return (
    <div className={`rounded-2xl border p-5 sm:p-6 ${styles.container}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Eligibility status
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{statusInfo.label}</p>
          </div>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
        >
          {statusInfo.label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{statusInfo.description}</p>
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

export function CitizenshipEligibilityCalculator() {
  const [greenCardIssueDate, setGreenCardIssueDate] = useState("");
  const [marriedToUSCitizen, setMarriedToUSCitizen] = useState<boolean | null>(null);
  const [result, setResult] = useState<CitizenshipEligibilityResult | null>(null);

  const maxDate = new Date().toISOString().split("T")[0];
  const canCalculate = greenCardIssueDate !== "" && marriedToUSCitizen !== null;

  function handleCalculate(event: FormEvent) {
    event.preventDefault();
    if (marriedToUSCitizen === null) {
      return;
    }
    setResult(calculateCitizenshipEligibility(greenCardIssueDate, marriedToUSCitizen));
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">Naturalization timeline</h2>
              <p className="mt-1 text-sm leading-relaxed text-blue-100">
                Enter your details below to estimate eligibility and the earliest N-400 filing date.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <form className="space-y-8" onSubmit={handleCalculate} aria-label="Citizenship eligibility calculator">
            <div className="space-y-6">
              <div>
                <label htmlFor="green-card-date" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </span>
                  Green Card issue date
                </label>
                <input
                  type="date"
                  id="green-card-date"
                  name="greenCardIssueDate"
                  required
                  max={maxDate}
                  value={greenCardIssueDate}
                  onChange={(event) => {
                    setGreenCardIssueDate(event.target.value);
                    setResult(null);
                  }}
                  className={inputClassName}
                />
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  The date printed on your permanent resident card.
                </p>
              </div>

              <fieldset>
                <legend className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </span>
                  Married to a U.S. citizen?
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    { label: "Yes", value: true },
                    { label: "No", value: false },
                  ].map((option) => {
                    const isSelected = marriedToUSCitizen === option.value;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => {
                          setMarriedToUSCitizen(option.value);
                          setResult(null);
                        }}
                        className={`min-h-[48px] rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                          isSelected
                            ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/20"
                            : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                        }`}
                        aria-pressed={isSelected}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Married applicants may qualify after 3 years instead of 5.
                </p>
              </fieldset>
            </div>

            <button
              type="submit"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-700/25 transition-all hover:bg-brand-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none sm:text-sm"
              disabled={!canCalculate}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V12zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V12zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V12zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V12z" />
              </svg>
              Calculate
            </button>
          </form>

          {!result && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-8 text-center sm:px-8">
              <p className="text-sm font-medium text-slate-700">Your results will appear here</p>
              <p className="mt-1 text-xs text-slate-500">
                Fill in both fields above, then tap Calculate.
              </p>
            </div>
          )}

          {result && (
            <div className="mt-8 space-y-4" role="status" aria-live="polite">
              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Your estimate
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <EligibilityStatusBanner result={result} />

              <div className="grid gap-4 sm:grid-cols-2">
                <ResultCard
                  label="Eligibility date"
                  value={
                    result.isEligibleNow
                      ? "You may be eligible now"
                      : formatEligibilityDate(result.eligibilityDate)
                  }
                  description={`Based on a ${result.waitingPeriodYears}-year permanent residence requirement${
                    result.waitingPeriodYears === 3
                      ? " for spouses of U.S. citizens."
                      : " for most green card holders."
                  }`}
                  highlight
                />
                <ResultCard
                  label="Earliest N-400 filing"
                  value={
                    result.canFileNow
                      ? "You may be able to file now"
                      : formatEligibilityDate(result.earliestFilingDate)
                  }
                  description="USCIS allows filing up to 90 days before your eligibility date."
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
              is for informational purposes only and does not constitute legal advice. Eligibility
              depends on continuous residence, physical presence, good moral character, and other
              USCIS requirements. Consult a qualified immigration attorney before applying.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
