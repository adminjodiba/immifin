"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import { WorksiteGeographyLookup, type WorksiteGeographyAuthority } from "@/components/h1b/WorksiteGeographyLookup";
import {
  fetchOfficialOccupations,
  nextOccupationSearchThrottleUntilMs,
  occupationSearchShouldPause,
  OFFICIAL_OCCUPATION_SEARCH_NETWORK_COPY,
  OFFICIAL_OCCUPATION_SEARCH_THROTTLED_COPY,
  OFFICIAL_OCCUPATION_SEARCH_UNAVAILABLE_COPY,
  type OfficialOccupationClientRow,
} from "@/lib/h1b/occupations/client/officialOccupationSearchClient";
import type { OfficialOccupationDisplayMatchConfidence } from "@/lib/h1b/occupations/officialOccupationDisplay.types";
import {
  ANNUAL_EQUIVALENT_DISCLAIMER,
  NO_LEVELED_WAGE_COPY,
  formatCurrency,
  formatOfficialWageAmount,
  officialWageDisplayRows,
  officialWageDisplayUnit,
  shouldShowNoLeveledCopy,
} from "@/lib/h1b/wage/client/formatOfficialWageDisplay";
import {
  fetchOfficialEstimate,
  officialEstimateFailureCopy,
  OFFICIAL_ESTIMATE_CHOICE_COPY,
  OFFICIAL_ESTIMATE_UNAVAILABLE_COPY,
  type OfficialEstimateClientResultView,
  type OfficialEstimateClientWage,
} from "@/lib/h1b/wage/client/officialEstimateClient";
import type { EducationLevel, ExperienceRange, SalaryPosition } from "@/lib/h1b/wage/estimatorDisplay.types";

const PAGE_HREF = "/immigration/h1b-wage-level-estimator";
const PAGE_TITLE = "H-1B Wage Level Estimator";
const LOTTERY_CALCULATOR_HREF = "/immigration/h1b-lottery-odds-calculator";
const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15";
const labelClassName = "block text-sm font-medium text-slate-900";

type SelectedOfficialOccupation = {
  socCode: string;
  title: string;
  group: string | null;
  commonJobTitles: string[];
  typicalH1b: boolean;
  matchConfidence: OfficialOccupationDisplayMatchConfidence | null;
};

function salaryPositionLabel(position: SalaryPosition): string {
  return position === "Near" ? "In range" : position;
}

function salaryPositionClassName(position: SalaryPosition): string {
  switch (position) {
    case "Above":
      return "font-semibold text-emerald-700";
    case "Below":
      return "font-semibold text-red-700";
    case "Near":
      return "font-semibold text-orange-600";
  }
}

function confidenceBadgeClassName(confidence: OfficialOccupationDisplayMatchConfidence): string {
  switch (confidence) {
    case "High":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "Medium":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function ConfidenceBadge({ confidence }: { confidence: OfficialOccupationDisplayMatchConfidence }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${confidenceBadgeClassName(confidence)}`}
    >
      {confidence}
    </span>
  );
}

function TypicalH1bBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800 ring-1 ring-brand-200">
      Typical H-1B
    </span>
  );
}

function formatKeywordLabel(keyword: string): string {
  return keyword
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toSelectedOccupation(row: OfficialOccupationClientRow): SelectedOfficialOccupation {
  return {
    socCode: row.soc_code,
    title: row.title,
    group: row.group,
    commonJobTitles: row.common_job_titles,
    typicalH1b: row.typical_h1b,
    matchConfidence: row.match_confidence,
  };
}

function SelectedOccupationCard({ occupation }: { occupation: SelectedOfficialOccupation }) {
  return (
    <div className="mt-2 rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
        Selected Occupation
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{occupation.title}</p>
      {occupation.group ? <p className="mt-0.5 text-xs text-slate-500">{occupation.group}</p> : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {occupation.matchConfidence ? <ConfidenceBadge confidence={occupation.matchConfidence} /> : null}
        {occupation.typicalH1b ? <TypicalH1bBadge /> : null}
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-700">
        <span aria-hidden="true">✓</span>
        Official occupation selected
      </p>
      {occupation.commonJobTitles.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Common job titles
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {occupation.commonJobTitles.map((keyword) => (
              <span
                key={keyword}
                className="rounded-md bg-white px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200"
              >
                {formatKeywordLabel(keyword)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
          Show technical details
        </summary>
        <p className="mt-1.5 text-xs text-slate-600">
          Official SOC Code: <span className="font-mono font-medium text-slate-800">{occupation.socCode}</span>
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Official title: <span className="font-medium text-slate-800">{occupation.title}</span>
        </p>
      </details>
    </div>
  );
}

function OccupationSearchOption({
  row,
  onSelect,
}: {
  row: OfficialOccupationClientRow;
  onSelect: (row: OfficialOccupationClientRow) => void;
}) {
  return (
    <li role="option" aria-selected="false">
      <button
        type="button"
        className="w-full px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
        onClick={() => onSelect(row)}
      >
        <span className="block text-sm font-semibold text-slate-900">{row.title}</span>
        {row.group ? <span className="mt-0.5 block text-xs text-slate-500">{row.group}</span> : null}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {row.match_confidence ? <ConfidenceBadge confidence={row.match_confidence} /> : null}
          {row.typical_h1b ? <TypicalH1bBadge /> : null}
        </div>
      </button>
    </li>
  );
}

export function H1bWageLevelEstimator() {
  const [occupationQuery, setOccupationQuery] = useState("");
  const [occupationMatches, setOccupationMatches] = useState<OfficialOccupationClientRow[]>([]);
  const [occupationSearchError, setOccupationSearchError] = useState<string | null>(null);
  const [occupationSearching, setOccupationSearching] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState<SelectedOfficialOccupation | null>(null);
  const [showOccupationList, setShowOccupationList] = useState(false);
  const [geography, setGeography] = useState<WorksiteGeographyAuthority>({
    ready: false,
    zip: "",
    countyFips: null,
  });
  const [annualSalary, setAnnualSalary] = useState("");
  const [experience, setExperience] = useState<ExperienceRange>("4-6");
  const [education, setEducation] = useState<EducationLevel>("Master");
  const [result, setResult] = useState<OfficialEstimateClientResultView | null>(null);
  const [officialWage, setOfficialWage] = useState<OfficialEstimateClientWage | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateThrottledUntilMs, setEstimateThrottledUntilMs] = useState(0);
  const occupationPickerRef = useRef<HTMLDivElement>(null);
  const searchSeqRef = useRef(0);
  const occupationThrottleUntilRef = useRef(0);

  useEffect(() => {
    if (estimateThrottledUntilMs <= Date.now()) {
      return;
    }
    const timer = window.setTimeout(() => setEstimateThrottledUntilMs(0), estimateThrottledUntilMs - Date.now());
    return () => window.clearTimeout(timer);
  }, [estimateThrottledUntilMs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (occupationPickerRef.current && !occupationPickerRef.current.contains(event.target as Node)) {
        setShowOccupationList(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const query = occupationQuery.trim();
    if (!query || selectedOccupation?.title === occupationQuery) {
      setOccupationMatches([]);
      setOccupationSearchError(null);
      setOccupationSearching(false);
      return;
    }

    const seq = ++searchSeqRef.current;
    if (occupationSearchShouldPause(occupationThrottleUntilRef.current, Date.now())) {
      setOccupationSearching(false);
      setOccupationSearchError(OFFICIAL_OCCUPATION_SEARCH_THROTTLED_COPY);
      return;
    }
    setOccupationSearching(true);
    const timeout = window.setTimeout(() => {
      void (async () => {
        const response = await fetchOfficialOccupations(query);
        if (seq !== searchSeqRef.current) return;
        setOccupationSearching(false);
        if (!response.ok) {
          setOccupationMatches([]);
          if (response.kind === "throttled") {
            occupationThrottleUntilRef.current = nextOccupationSearchThrottleUntilMs(
              response.retryAfterSeconds,
              Date.now(),
            );
            setOccupationSearchError(OFFICIAL_OCCUPATION_SEARCH_THROTTLED_COPY);
            return;
          }
          setOccupationSearchError(
            response.kind === "network"
              ? OFFICIAL_OCCUPATION_SEARCH_NETWORK_COPY
              : OFFICIAL_OCCUPATION_SEARCH_UNAVAILABLE_COPY,
          );
          return;
        }
        if (response.data.outcome !== "AUTO") {
          setOccupationMatches([]);
          setOccupationSearchError(OFFICIAL_OCCUPATION_SEARCH_UNAVAILABLE_COPY);
          return;
        }
        setOccupationSearchError(null);
        setOccupationMatches(response.data.results);
      })();
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [occupationQuery, selectedOccupation]);

  function selectOccupation(row: OfficialOccupationClientRow) {
    setSelectedOccupation(toSelectedOccupation(row));
    setOccupationQuery(row.title);
    setShowOccupationList(false);
    setResult(null);
    setOfficialWage(null);
    setResultError(null);
  }

  function handleGeographyChange(next: WorksiteGeographyAuthority) {
    setGeography(next);
    setResult(null);
    setOfficialWage(null);
    setResultError(null);
  }

  async function handleEstimate(event: FormEvent) {
    event.preventDefault();

    const salary = Number(annualSalary);
    if (!selectedOccupation) {
      setResult(null);
      setOfficialWage(null);
      setResultError(
        "Occupation not found. Search and select an official occupation, or try a common title like Software Engineer.",
      );
      return;
    }

    if (!geography.ready || !geography.zip || !Number.isFinite(salary) || salary <= 0) {
      return;
    }

    setEstimating(true);
    setResult(null);
    setOfficialWage(null);
    setResultError(null);

    const estimateResult = await fetchOfficialEstimate({
      socCode: selectedOccupation.socCode,
      zip: geography.zip,
      countyFips: geography.countyFips,
      annualSalary: salary,
      experience,
      education,
    });

    setEstimating(false);

    if (!estimateResult.ok) {
      if (estimateResult.kind === "throttled") {
        setEstimateThrottledUntilMs(
          Date.now() + (estimateResult.retryAfterSeconds ?? 30) * 1000,
        );
      }
      setResultError(officialEstimateFailureCopy(estimateResult.kind));
      return;
    }

    if (estimateResult.data.outcome === "CHOICE_REQUIRED") {
      setResultError(OFFICIAL_ESTIMATE_CHOICE_COPY);
      return;
    }

    if (estimateResult.data.outcome !== "AUTO" || !estimateResult.data.wage) {
      setResultError(OFFICIAL_ESTIMATE_UNAVAILABLE_COPY);
      return;
    }

    setOfficialWage(estimateResult.data.wage);
    setResult(estimateResult.data.result);
  }

  return (
    <>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">{PAGE_TITLE}</h1>
              <FavoriteStar pageLabel={PAGE_TITLE} pageHref={PAGE_HREF} />
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Estimate your likely H-1B wage level using an official occupation, worksite ZIP, salary, experience, and education.
            </p>
          </div>
        </div>
        <DashboardCloseAction />
      </header>

      <div className="mt-3 space-y-4">
        <form onSubmit={handleEstimate} aria-label="H-1B wage level estimator">
          <div className="rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <section
              className="border-b border-slate-200 p-4 sm:p-5 lg:border-b-0 lg:border-r"
              aria-labelledby="h1b-v2-input-heading"
            >
              <h2 id="h1b-v2-input-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Your information
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Official OFLC wages for the resolved worksite. The wage level is an IMMIFIN estimate, not a DOL determination.
              </p>

              <div className="mt-3 space-y-4">
                <div ref={occupationPickerRef} className="relative">
                  <label htmlFor="occupation-search-v2" className={labelClassName}>
                    Search occupation / job title
                  </label>
                  <input
                    id="occupation-search-v2"
                    name="occupationSearch"
                    type="text"
                    required
                    autoComplete="off"
                    value={occupationQuery}
                    onChange={(event) => {
                      setOccupationQuery(event.target.value);
                      setSelectedOccupation(null);
                      setShowOccupationList(true);
                      setOccupationSearching(Boolean(event.target.value.trim()));
                      setOccupationSearchError(null);
                      setResult(null);
                      setOfficialWage(null);
                      setResultError(null);
                    }}
                    onFocus={() => setShowOccupationList(true)}
                    placeholder="Software Engineer"
                    className={inputClassName}
                    role="combobox"
                    aria-expanded={showOccupationList}
                    aria-controls="occupation-search-list-v2"
                    aria-autocomplete="list"
                  />
                  {showOccupationList && occupationMatches.length > 0 ? (
                    <ul
                      id="occupation-search-list-v2"
                      role="listbox"
                      className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-md"
                    >
                      {occupationMatches.map((row) => (
                        <OccupationSearchOption
                          key={row.soc_code}
                          row={row}
                          onSelect={selectOccupation}
                        />
                      ))}
                    </ul>
                  ) : null}
                  {selectedOccupation && !showOccupationList ? (
                    <SelectedOccupationCard occupation={selectedOccupation} />
                  ) : null}
                  {occupationSearching ? (
                    <p className="mt-1 text-xs text-slate-500">Searching official occupations…</p>
                  ) : null}
                  {occupationSearchError ? <p className="mt-1 text-xs text-amber-700">{occupationSearchError}</p> : null}
                  {showOccupationList && occupationQuery && !occupationSearching && occupationMatches.length === 0 && !occupationSearchError ? (
                    <p className="mt-1 text-xs text-amber-700">No matching occupations. Try a different keyword.</p>
                  ) : null}
                </div>

                <div>
                  <p className={labelClassName}>Worksite ZIP Code</p>
                  <div className="mt-1.5">
                    <WorksiteGeographyLookup onAuthorityChange={handleGeographyChange} />
                  </div>
                </div>

                <div>
                  <label htmlFor="annual-salary-v2" className={labelClassName}>
                    Annual salary
                  </label>
                  <input
                    id="annual-salary-v2"
                    name="annualSalary"
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={annualSalary}
                    onChange={(event) => {
                      setAnnualSalary(event.target.value);
                      setResult(null);
                      setOfficialWage(null);
                      setResultError(null);
                    }}
                    placeholder="135000"
                    className={inputClassName}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="experience-v2" className={labelClassName}>
                      Years of experience
                    </label>
                    <select
                      id="experience-v2"
                      name="experience"
                      required
                      value={experience}
                      onChange={(event) => {
                        setExperience(event.target.value as ExperienceRange);
                        setResult(null);
                        setOfficialWage(null);
                        setResultError(null);
                      }}
                      className={inputClassName}
                    >
                      <option value="0-1">0-1</option>
                      <option value="2-3">2-3</option>
                      <option value="4-6">4-6</option>
                      <option value="7-10">7-10</option>
                      <option value="10+">10+</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="education-v2" className={labelClassName}>
                      Highest education
                    </label>
                    <select
                      id="education-v2"
                      name="education"
                      required
                      value={education}
                      onChange={(event) => {
                        setEducation(event.target.value as EducationLevel);
                        setResult(null);
                        setOfficialWage(null);
                        setResultError(null);
                      }}
                      className={inputClassName}
                    >
                      <option value="Bachelor">Bachelor</option>
                      <option value="Master">Master</option>
                      <option value="PhD">PhD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!geography.ready || estimating || estimateThrottledUntilMs > Date.now()}
                className="btn-primary mt-4 w-full min-h-[40px] rounded-lg px-4 py-2 shadow-sm disabled:opacity-50"
              >
                {estimating ? "Looking up official wages…" : "Estimate Wage Level"}
              </button>
            </section>

            <section
              className="bg-slate-50/50 p-4 sm:p-5"
              aria-labelledby="h1b-v2-result-heading"
              aria-live="polite"
            >
              <h2 id="h1b-v2-result-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Your estimate
              </h2>

              {!result && !resultError && !officialWage ? (
                <div className="mt-3 flex min-h-[12rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-700">Results will appear here</p>
                  <p className="mt-1 max-w-[16rem] text-xs text-slate-500">
                    Enter your job details and tap Estimate Wage Level.
                  </p>
                </div>
              ) : resultError && !officialWage ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4" role="alert">
                  <p className="text-sm font-semibold text-amber-950">{resultError}</p>
                </div>
              ) : result && result.ok ? (
                <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                      Estimated Wage Level
                    </p>
                    <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-2xl font-bold text-slate-900">Level {result.estimatedLevel}</p>
                      <p className="text-sm text-slate-600">
                        Confidence:{" "}
                        <span className="font-semibold text-slate-900">{result.confidence}</span>
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      IMMIFIN estimate based on the information you entered. Not an official DOL Prevailing Wage Determination.
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    <p>
                      <span className="font-medium text-slate-900">Selected occupation:</span> {result.occupation.title}
                    </p>
                    {result.occupation.group ? (
                      <p className="mt-0.5 text-xs text-slate-500">{result.occupation.group}</p>
                    ) : null}
                    <p className="mt-1.5">
                      <span className="font-medium text-slate-900">Official wage area:</span> {result.locationLabel}
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full min-w-[36rem] text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50/80">
                        <tr>
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Wage level
                          </th>
                          {result.usedAnnualEquivalent ? (
                            <>
                              <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Official wage
                                <span className="mt-0.5 block font-medium">(Hourly rate)</span>
                              </th>
                              <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Annual equivalent
                                <span className="mt-0.5 block font-medium">(2,080 hours)</span>
                              </th>
                            </>
                          ) : (
                            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Official wage
                            </th>
                          )}
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Your salary position
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.salaryComparison.map((row) => (
                          <tr key={row.level} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 font-medium text-slate-900">Level {row.level}</td>
                            {result.usedAnnualEquivalent ? (
                              <>
                                <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                                  {formatOfficialWageAmount(row.officialHourly, "hour")}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                                  {formatCurrency(row.annualWage)}
                                </td>
                              </>
                            ) : (
                              <td className="px-3 py-2 text-slate-700">{formatCurrency(row.annualWage)}</td>
                            )}
                            <td className={`px-3 py-2 ${salaryPositionClassName(row.position)}`}>
                              {salaryPositionLabel(row.position)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.usedAnnualEquivalent ? (
                    <p className="text-xs text-slate-500">{ANNUAL_EQUIVALENT_DISCLAIMER}</p>
                  ) : null}

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reasoning</p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
                      {result.reasoning.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href={`${LOTTERY_CALCULATOR_HREF}?wageLevel=${result.estimatedLevel}`}
                      className="flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
                    >
                      Use this wage level in H-1B Lottery Odds Calculator
                    </Link>
                    <Link
                      href={LOTTERY_CALCULATOR_HREF}
                      className="flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                    >
                      Calculate lottery odds manually
                    </Link>
                  </div>
                </div>
              ) : officialWage ? (
                <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4" role="status">
                    <p className="text-sm font-semibold text-amber-950">
                      {result && !result.ok ? result.message : OFFICIAL_ESTIMATE_UNAVAILABLE_COPY}
                    </p>
                    {shouldShowNoLeveledCopy(officialWage) ? (
                      <p className="mt-2 text-sm text-amber-900">{NO_LEVELED_WAGE_COPY}</p>
                    ) : null}
                    {officialWageDisplayUnit(officialWage.label) === "unspecified" ? (
                      <p className="mt-2 text-sm text-amber-900">
                        Official Level I–IV values are not available for this record. IMMIFIN does not invent missing wage levels.
                      </p>
                    ) : null}
                  </div>
                  {officialWageDisplayRows(officialWage).length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full min-w-[28rem] text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50/80">
                          <tr>
                            <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Wage level
                            </th>
                            {officialWageDisplayUnit(officialWage.label) === "hour" ? (
                              <>
                                <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Official wage
                                  <span className="mt-0.5 block font-medium">(Hourly rate)</span>
                                </th>
                                <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Annual equivalent
                                  <span className="mt-0.5 block font-medium">(2,080 hours)</span>
                                </th>
                              </>
                            ) : (
                              <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Official wage
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {officialWageDisplayRows(officialWage).map((row) => (
                            <tr key={row.key} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2 font-medium text-slate-900">{row.label}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.official}</td>
                              {row.annualEquivalent ? (
                                <td className="whitespace-nowrap px-3 py-2 text-slate-700">{row.annualEquivalent}</td>
                              ) : null}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  <Link
                    href={LOTTERY_CALCULATOR_HREF}
                    className="flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    Calculate lottery odds manually
                  </Link>
                </div>
              ) : null}
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
            <strong className="font-semibold text-amber-950">Disclaimer:</strong> This tool provides an
            educational IMMIFIN estimate only. It does not issue a Prevailing Wage Determination and does not
            determine which wage level legally applies to a position. H-1B wage level classification depends on
            the official LCA, SOC code, worksite location, job duties, education, experience, supervision, and
            employer wage documentation. {ANNUAL_EQUIVALENT_DISCLAIMER} IMMIFIN does not provide legal advice.
          </p>
        </div>
      </div>
    </>
  );
}
