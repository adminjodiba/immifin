"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import {
  calculateH1bLotteryOdds,
  parseWageLevelParam,
  type LotteryOddsResult,
  type LotteryWageLevelSelection,
  type UsMastersEligibility,
} from "@/lib/h1b/h1bLotteryOdds";

const PAGE_HREF = "/immigration/h1b-lottery-odds-calculator";
const PAGE_TITLE = "H-1B Lottery Odds Calculator";
const WAGE_ESTIMATOR_HREF = "/immigration/h1b-wage-level-estimator";

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15";

const labelClassName = "block text-sm font-medium text-slate-900";

export function H1bLotteryOddsCalculator() {
  const searchParams = useSearchParams();
  const [wageLevel, setWageLevel] = useState<LotteryWageLevelSelection>("unknown");
  const [usMastersEligible, setUsMastersEligible] = useState<UsMastersEligibility>("no");
  const [result, setResult] = useState<LotteryOddsResult | null>(null);

  useEffect(() => {
    const fromUrl = parseWageLevelParam(searchParams.get("wageLevel"));
    if (fromUrl !== "unknown") {
      setWageLevel(fromUrl);
    }
  }, [searchParams]);

  function handleCalculate(event: FormEvent) {
    event.preventDefault();
    setResult(
      calculateH1bLotteryOdds({
        wageLevel,
        usMastersEligible,
      }),
    );
  }

  const showUnknownCard = wageLevel === "unknown";

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-7.5 10.5 7.5M4.5 19.5h15a1.5 1.5 0 001.5-1.5v-9a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 9v9a1.5 1.5 0 001.5 1.5z" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">{PAGE_TITLE}</h1>
              <FavoriteStar pageLabel={PAGE_TITLE} pageHref={PAGE_HREF} />
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Estimate your H-1B lottery odds using wage level and U.S. master&apos;s cap eligibility.
            </p>
          </div>
        </div>
        <DashboardCloseAction />
      </header>

      <div className="mt-3 space-y-4">
        <form onSubmit={handleCalculate} aria-label="H-1B lottery odds calculator">
          <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <section
              className="border-b border-slate-200 p-4 sm:p-5 lg:border-b-0 lg:border-r"
              aria-labelledby="lottery-input-heading"
            >
              <h2 id="lottery-input-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Your information
              </h2>
              <p className="mt-1 text-xs text-slate-500">Demo assumptions only — not official USCIS selection data.</p>

              <div className="mt-3 space-y-4">
                <div>
                  <label htmlFor="wage-level" className={labelClassName}>
                    Wage level
                  </label>
                  <select
                    id="wage-level"
                    name="wageLevel"
                    required
                    value={wageLevel}
                    onChange={(event) => {
                      setWageLevel(event.target.value as LotteryWageLevelSelection);
                      setResult(null);
                    }}
                    className={inputClassName}
                  >
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="unknown">I don&apos;t know</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="us-masters" className={labelClassName}>
                    Do you have a U.S. master&apos;s degree or higher?
                  </label>
                  <select
                    id="us-masters"
                    name="usMastersEligible"
                    required
                    value={usMastersEligible}
                    onChange={(event) => {
                      setUsMastersEligible(event.target.value as UsMastersEligibility);
                      setResult(null);
                    }}
                    className={inputClassName}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes, from a U.S. accredited institution</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary mt-4 w-full min-h-[40px] rounded-lg px-4 py-2 shadow-sm"
              >
                Calculate Lottery Odds
              </button>
            </section>

            <section
              className="bg-slate-50/50 p-4 sm:p-5"
              aria-labelledby="lottery-result-heading"
              aria-live="polite"
            >
              <h2 id="lottery-result-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Your estimate
              </h2>

              {showUnknownCard ? (
                <div className="mt-3 rounded-lg border border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-4">
                  <p className="text-sm font-semibold text-brand-900">Not sure about your wage level?</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Use IMMIFIN&apos;s H-1B Wage Level Estimator first.
                  </p>
                  <Link
                    href={WAGE_ESTIMATOR_HREF}
                    className="btn-primary mt-4 min-h-[40px] rounded-lg px-4 py-2 shadow-sm"
                  >
                    Estimate my wage level
                  </Link>
                </div>
              ) : !result ? (
                <div className="mt-3 flex min-h-[12rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-700">Results will appear here</p>
                  <p className="mt-1 max-w-[16rem] text-xs text-slate-500">
                    Select your wage level and tap Calculate Lottery Odds.
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-4 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                      Final estimated odds
                    </p>
                    <p className="mt-1 text-4xl font-bold text-emerald-950">{result.finalEstimatedOdds}%</p>
                    <p className="mt-2 text-sm text-emerald-900">
                      Wage Level {result.wageLevel}
                      {result.usMastersEligible ? " · U.S. master&apos;s eligible" : ""}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-sm">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="px-3 py-2.5 text-slate-600">Wage-weighted regular estimate</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                            {result.wageWeightedRegularEstimate}%
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-3 py-2.5 text-slate-600">U.S. master&apos;s cap eligible</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                            {result.usMastersEligible ? "Yes" : "No"}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-3 py-2.5 text-slate-600">Estimated master&apos;s cap boost</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                            {result.mastersCapBoost > 0
                              ? `+${result.mastersCapBoost.toFixed(1)} percentage points`
                              : "—"}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-3 py-2.5 text-slate-600">Final estimated odds</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-emerald-800">
                            {result.finalEstimatedOdds}%
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-3 py-2.5 text-slate-600">Traditional random lottery estimate</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                            {result.traditionalRandomEstimate}%
                          </td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2.5 text-slate-600">Estimated advantage over traditional</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-emerald-800">
                            +{result.advantageOverTraditional} percentage points
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Explanation</p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {result.reasoning.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </div>
        </form>

        <div className="flex gap-2.5 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/80 p-4">
          <span className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </span>
          <p className="text-sm text-amber-950/80">
            <strong className="font-semibold text-amber-950">Disclaimer:</strong> This calculator is
            educational only. Actual H-1B lottery odds depend on USCIS registration volume, cap selection
            rules, advanced-degree exemption rules, employer filings, duplicate beneficiary rules, and final
            selection data. IMMIFIN does not provide legal advice.
          </p>
        </div>
      </div>
    </>
  );
}
