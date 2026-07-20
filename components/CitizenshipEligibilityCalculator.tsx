"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import {
  calculateCitizenshipEligibility,
  formatEligibilityDate,
  getEligibilityStatus,
  type CitizenshipEligibilityResult,
} from "@/lib/citizenship-eligibility";
import { CalculatorProAutoPopulationHint } from "@/components/CalculatorProAutoPopulationHint";
import { CalculatorProfilePrefillHint } from "@/components/CalculatorProfilePrefillHint";
import { RelatedImmigrationResources } from "@/components/RelatedImmigrationResources";
import { useImmigrationProfileDefaults } from "@/lib/hooks/useImmigrationProfileDefaults";

const PAGE_HREF = "/calculators/citizenship-eligibility";
const PAGE_TITLE = "Citizenship Eligibility Calculator";

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15";

const statusStyles = {
  eligible: {
    container: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    dot: "bg-emerald-500",
  },
  eligible_to_file: {
    container: "border-brand-200 bg-gradient-to-br from-brand-50 to-white",
    dot: "bg-brand-500",
  },
  not_yet_eligible: {
    container: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    dot: "bg-slate-400",
  },
} as const;

function EligibilityStatusBanner({ result }: { result: CitizenshipEligibilityResult }) {
  const statusInfo = getEligibilityStatus(result);
  const styles = statusStyles[statusInfo.status];

  return (
    <div className={`rounded-lg border p-4 ${styles.container}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Eligibility status
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} aria-hidden="true" />
        <p className="text-lg font-semibold text-slate-900">{statusInfo.label}</p>
      </div>
      <p className="mt-2 text-sm text-slate-600 lg:whitespace-nowrap">{statusInfo.description}</p>
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

export function CitizenshipEligibilityCalculator() {
  const { defaults, loaded, autoPopulationEnabled, showProAutoPopulationHint } =
    useImmigrationProfileDefaults();
  const [greenCardIssueDate, setGreenCardIssueDate] = useState("");
  const [marriedToUSCitizen, setMarriedToUSCitizen] = useState<boolean | null>(null);
  const [result, setResult] = useState<CitizenshipEligibilityResult | null>(null);
  const [prefilledFromProfile, setPrefilledFromProfile] = useState(false);
  const profileDefaultsApplied = useRef(false);

  useEffect(() => {
    if (!loaded || !autoPopulationEnabled || !defaults || profileDefaultsApplied.current) {
      return;
    }

    profileDefaultsApplied.current = true;

    const profileDate = defaults.greenCardIssueDate ?? "";
    const profileMarried = defaults.marriedToUSCitizen;

    if (profileDate || profileMarried !== null) {
      setPrefilledFromProfile(true);
    }

    setGreenCardIssueDate((current) => current || profileDate);
    setMarriedToUSCitizen((current) => {
      if (current !== null) {
        return current;
      }

      if (profileMarried === null || profileMarried === undefined) {
        return null;
      }

      return profileMarried;
    });

    if (profileDate && profileMarried !== null && profileMarried !== undefined) {
      setResult(calculateCitizenshipEligibility(profileDate, profileMarried));
    }
  }, [loaded, autoPopulationEnabled, defaults]);

  const maxDate = new Date().toISOString().split("T")[0];
  const canCalculate = greenCardIssueDate !== "" && marriedToUSCitizen !== null;

  function handleCalculate(event: FormEvent) {
    event.preventDefault();
    if (marriedToUSCitizen === null || !greenCardIssueDate) {
      return;
    }

    setResult(calculateCitizenshipEligibility(greenCardIssueDate, marriedToUSCitizen));
  }

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">{PAGE_TITLE}</h1>
              <FavoriteStar pageLabel={PAGE_TITLE} pageHref={PAGE_HREF} />
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Estimate when you may be eligible to apply for naturalization based on your green card
              issue date.
            </p>
          </div>
        </div>
        <DashboardCloseAction />
      </header>

      <div className="mt-3 space-y-5">
        {showProAutoPopulationHint ? <CalculatorProAutoPopulationHint /> : null}
        {prefilledFromProfile && autoPopulationEnabled ? <CalculatorProfilePrefillHint /> : null}

        <form onSubmit={handleCalculate} aria-label="Citizenship eligibility calculator">
          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <section
              className="border-b border-slate-200 p-4 sm:p-5 lg:border-b-0 lg:border-r"
              aria-labelledby="citizenship-input-heading"
            >
                <h2 id="citizenship-input-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Your information
                </h2>

                <div className="mt-3 space-y-4">
                  <div>
                    <label htmlFor="green-card-date" className="block text-sm font-medium text-slate-900">
                      Green card issue date
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
                        setPrefilledFromProfile(false);
                        setResult(null);
                      }}
                      className={inputClassName}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      The date printed on your permanent resident card.
                    </p>
                  </div>

                  <fieldset>
                    <legend className="block text-sm font-medium text-slate-900">
                      Married to a U.S. citizen?
                    </legend>
                    <div className="mt-2 grid grid-cols-2 gap-2">
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
                              setPrefilledFromProfile(false);
                              setResult(null);
                            }}
                            className={`min-h-[40px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                              isSelected
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                            }`}
                            aria-pressed={isSelected}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Married applicants may qualify after 3 years instead of 5.
                    </p>
                  </fieldset>
                </div>

                <button
                  type="submit"
                  className="btn-primary mt-4 w-full min-h-[40px] rounded-lg px-4 py-2 shadow-sm disabled:opacity-50"
                  disabled={!canCalculate}
                >
                  Calculate
                </button>
              </section>

              <section
                className="bg-slate-50/50 p-4 sm:p-5"
                aria-labelledby="citizenship-result-heading"
                aria-live="polite"
              >
                <h2 id="citizenship-result-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Your result
                </h2>

                {!result ? (
                  <div className="mt-3 flex min-h-[12rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                    <p className="text-sm font-medium text-slate-700">Results will appear here</p>
                    <p className="mt-1 max-w-[16rem] text-xs text-slate-500">
                      Enter your details and tap Calculate.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    <EligibilityStatusBanner result={result} />

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
                )}
              </section>
            </div>
          </form>

        <RelatedImmigrationResources
          resources={[
            {
              title: "Visa Bulletin Dashboard",
              description: "Track current employment-based visa bulletin dates.",
              href: "/immigration/visa-bulletin",
            },
            {
              title: "Green Card Calculator",
              description:
                "Check whether your priority date is current based on the latest visa bulletin.",
              href: "/calculators/green-card-wait-time",
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
            is for informational purposes only and does not constitute legal advice. Eligibility
            depends on continuous residence, physical presence, good moral character, and other
            USCIS requirements. Consult a qualified immigration attorney before applying.
          </p>
        </div>
      </div>
    </>
  );
}
