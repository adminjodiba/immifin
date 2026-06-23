"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  calculateCitizenshipEligibility,
  formatEligibilityDate,
} from "@/lib/citizenship-eligibility";

const inputClassName =
  "mt-2 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

export function CitizenshipEligibilityCalculator() {
  const [greenCardIssueDate, setGreenCardIssueDate] = useState("");
  const [marriedToUSCitizen, setMarriedToUSCitizen] = useState<boolean | null>(null);

  const result = useMemo(() => {
    if (marriedToUSCitizen === null) {
      return null;
    }
    return calculateCitizenshipEligibility(greenCardIssueDate, marriedToUSCitizen);
  }, [greenCardIssueDate, marriedToUSCitizen]);

  const maxDate = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/calculators"
        className="mb-8 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Calculators
      </Link>

      <div className="card">
        <form
          className="space-y-6"
          onSubmit={(event) => event.preventDefault()}
          aria-label="Citizenship eligibility calculator"
        >
          <div>
            <label htmlFor="green-card-date" className="block text-sm font-medium text-slate-900">
              Green Card issue date
            </label>
            <input
              type="date"
              id="green-card-date"
              name="greenCardIssueDate"
              required
              max={maxDate}
              value={greenCardIssueDate}
              onChange={(event) => setGreenCardIssueDate(event.target.value)}
              className={inputClassName}
            />
            <p className="mt-2 text-xs text-slate-500">
              The date your permanent resident card was issued.
            </p>
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-slate-900">
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
                    onClick={() => setMarriedToUSCitizen(option.value)}
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                      isSelected
                        ? "border-brand-600 bg-brand-50 text-brand-800"
                        : "border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/50"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </form>

        {result && (
          <div
            className="mt-8 rounded-lg border border-brand-200 bg-brand-50 p-6"
            role="status"
            aria-live="polite"
          >
            <h2 className="text-lg font-semibold text-brand-900">Estimated eligibility</h2>
            {result.isEligibleNow ? (
              <p className="mt-3 text-2xl font-bold text-brand-800 sm:text-3xl">
                You may be eligible now
              </p>
            ) : (
              <p className="mt-3 text-2xl font-bold text-brand-800 sm:text-3xl">
                {formatEligibilityDate(result.eligibilityDate)}
              </p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Based on a{" "}
              <strong>{result.waitingPeriodYears}-year</strong> permanent residence requirement
              {result.waitingPeriodYears === 3
                ? " for applicants married to a U.S. citizen."
                : " for most green card holders."}
            </p>

            <div className="mt-6 border-t border-brand-200 pt-6">
              <h3 className="text-base font-semibold text-brand-900">Earliest N-400 filing date</h3>
              {result.canFileNow ? (
                <p className="mt-2 text-xl font-bold text-brand-800 sm:text-2xl">
                  You may be able to file now
                </p>
              ) : (
                <p className="mt-2 text-xl font-bold text-brand-800 sm:text-2xl">
                  {formatEligibilityDate(result.earliestFilingDate)}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                USCIS allows you to file Form N-400 up to{" "}
                <strong>90 days before</strong> your eligibility date.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm leading-relaxed text-amber-900">
            <strong>Disclaimer:</strong> This calculator is for informational purposes only and
            does not constitute legal advice. Actual naturalization eligibility depends on many
            additional factors, including continuous residence, physical presence, good moral
            character, and USCIS discretion. Consult a qualified immigration attorney before
            applying.
          </p>
        </div>
      </div>
    </div>
  );
}
