"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import {
  estimateH1bWageLevel,
  formatCurrency,
  STATE_OPTIONS,
  type EducationLevel,
  type EstimatorResult,
  type ExperienceRange,
} from "@/lib/h1b/wageLevelEstimator";
import {
  formatOccupationTitle,
  getOccupationByCode,
  getOccupationKeywords,
  isTypicalH1BOccupation,
  matchOccupationFromQuery,
  searchOccupations,
  type MatchConfidence,
  type OccupationSearchResult,
  type SocOccupationEntry,
} from "@/lib/services/occupationService";

const PAGE_HREF = "/immigration/h1b-wage-level-estimator";
const PAGE_TITLE = "H-1B Wage Level Estimator";
const LOTTERY_CALCULATOR_HREF = "/immigration/h1b-lottery-odds-calculator";

const calculatorCloseLinkClassName =
  "flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30";

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15";

const labelClassName = "block text-sm font-medium text-slate-900";

function confidenceBadgeClassName(confidence: MatchConfidence): string {
  switch (confidence) {
    case "High":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "Medium":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function ConfidenceBadge({ confidence }: { confidence: MatchConfidence }) {
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

function SelectedOccupationCard({
  occupation,
  matchResult,
}: {
  occupation: SocOccupationEntry;
  matchResult: OccupationSearchResult | null;
}) {
  const keywords = getOccupationKeywords(occupation.code).slice(0, 6);
  const isTypical = isTypicalH1BOccupation(occupation.code);

  return (
    <div className="mt-2 rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
        Selected Occupation
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{occupation.title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{occupation.group}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {matchResult ? <ConfidenceBadge confidence={matchResult.matchConfidence} /> : null}
        {isTypical ? <TypicalH1bBadge /> : null}
      </div>
      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-700">
        <span aria-hidden="true">✓</span>
        Official occupation selected
      </p>
      {keywords.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Common job titles
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {keywords.map((keyword) => (
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
          Official SOC Code: <span className="font-mono font-medium text-slate-800">{occupation.code}</span>
        </p>
      </details>
    </div>
  );
}

function OccupationSearchOption({
  result,
  onSelect,
}: {
  result: OccupationSearchResult;
  onSelect: (result: OccupationSearchResult) => void;
}) {
  const isTypical = isTypicalH1BOccupation(result.occupation.code);

  return (
    <li role="option">
      <button
        type="button"
        className="w-full px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
        onClick={() => onSelect(result)}
      >
        <span className="block text-sm font-semibold text-slate-900">{result.occupation.title}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{result.occupation.group}</span>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ConfidenceBadge confidence={result.matchConfidence} />
          {isTypical ? <TypicalH1bBadge /> : null}
        </div>
      </button>
    </li>
  );
}

export function H1bWageLevelEstimator() {
  const [occupationQuery, setOccupationQuery] = useState("");
  const [selectedOccupation, setSelectedOccupation] = useState<SocOccupationEntry | null>(null);
  const [selectedMatchResult, setSelectedMatchResult] = useState<OccupationSearchResult | null>(null);
  const [showOccupationList, setShowOccupationList] = useState(false);
  const [workCity, setWorkCity] = useState("");
  const [state, setState] = useState("TX");
  const [annualSalary, setAnnualSalary] = useState("");
  const [experience, setExperience] = useState<ExperienceRange>("4-6");
  const [education, setEducation] = useState<EducationLevel>("Master");
  const [result, setResult] = useState<EstimatorResult | null>(null);
  const occupationPickerRef = useRef<HTMLDivElement>(null);

  const occupationMatches = searchOccupations(occupationQuery);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        occupationPickerRef.current &&
        !occupationPickerRef.current.contains(event.target as Node)
      ) {
        setShowOccupationList(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectOccupation(result: OccupationSearchResult) {
    setSelectedOccupation(result.occupation);
    setSelectedMatchResult(result);
    setOccupationQuery(formatOccupationTitle(result.occupation));
    setShowOccupationList(false);
    setResult(null);
  }

  function handleEstimate(event: FormEvent) {
    event.preventDefault();

    const salary = Number(annualSalary);
    const occupation =
      selectedOccupation ?? matchOccupationFromQuery(occupationQuery)?.occupation ?? null;

    if (!occupation) {
      setResult({
        ok: false,
        code: "occupation_not_found",
        message:
          "Occupation not found. Search and select an occupation, or try a common title like Software Engineer.",
      });
      return;
    }

    if (!workCity.trim() || !state || !Number.isFinite(salary) || salary <= 0) {
      return;
    }

    setResult(
      estimateH1bWageLevel({
        socCode: occupation.code,
        workCity,
        state,
        annualSalary: salary,
        experience,
        education,
      }),
    );
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
              Estimate your likely H-1B wage level using occupation, location, salary, experience, and education.
            </p>
          </div>
        </div>
        <Link
          href="/calculators"
          className={calculatorCloseLinkClassName}
          aria-label="Close and return to calculators"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      </header>

      <div className="mt-3 space-y-4">
        <form onSubmit={handleEstimate} aria-label="H-1B wage level estimator">
          <div className="rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <section
              className="border-b border-slate-200 p-4 sm:p-5 lg:border-b-0 lg:border-r"
              aria-labelledby="h1b-input-heading"
            >
              <h2 id="h1b-input-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Your information
              </h2>
              <p className="mt-1 text-xs text-slate-500">Demo data only — not official DOL prevailing wages.</p>

              <div className="mt-3 space-y-4">
                <div ref={occupationPickerRef} className="relative">
                  <label htmlFor="occupation-search" className={labelClassName}>
                    Search occupation / job title
                  </label>
                  <input
                    id="occupation-search"
                    name="occupationSearch"
                    type="text"
                    required
                    autoComplete="off"
                    value={occupationQuery}
                    onChange={(event) => {
                      setOccupationQuery(event.target.value);
                      setSelectedOccupation(null);
                      setSelectedMatchResult(null);
                      setShowOccupationList(true);
                      setResult(null);
                    }}
                    onFocus={() => setShowOccupationList(true)}
                    placeholder="Software Engineer"
                    className={inputClassName}
                    role="combobox"
                    aria-expanded={showOccupationList}
                    aria-controls="occupation-search-list"
                    aria-autocomplete="list"
                  />
                  {showOccupationList && occupationMatches.length > 0 ? (
                    <ul
                      id="occupation-search-list"
                      role="listbox"
                      className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-md"
                    >
                      {occupationMatches.map((match) => (
                        <OccupationSearchOption
                          key={match.occupation.code}
                          result={match}
                          onSelect={selectOccupation}
                        />
                      ))}
                    </ul>
                  ) : null}
                  {selectedOccupation && !showOccupationList ? (
                    <SelectedOccupationCard
                      occupation={selectedOccupation}
                      matchResult={selectedMatchResult}
                    />
                  ) : null}
                  {showOccupationList && occupationQuery && occupationMatches.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-700">No matching occupations. Try a different keyword.</p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="work-city" className={labelClassName}>
                      Work city
                    </label>
                    <input
                      id="work-city"
                      name="workCity"
                      type="text"
                      required
                      value={workCity}
                      onChange={(event) => {
                        setWorkCity(event.target.value);
                        setResult(null);
                      }}
                      placeholder="Houston"
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="work-state" className={labelClassName}>
                      State
                    </label>
                    <select
                      id="work-state"
                      name="state"
                      required
                      value={state}
                      onChange={(event) => {
                        setState(event.target.value);
                        setResult(null);
                      }}
                      className={inputClassName}
                    >
                      {STATE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="annual-salary" className={labelClassName}>
                    Annual salary
                  </label>
                  <input
                    id="annual-salary"
                    name="annualSalary"
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={annualSalary}
                    onChange={(event) => {
                      setAnnualSalary(event.target.value);
                      setResult(null);
                    }}
                    placeholder="135000"
                    className={inputClassName}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="experience" className={labelClassName}>
                      Years of experience
                    </label>
                    <select
                      id="experience"
                      name="experience"
                      required
                      value={experience}
                      onChange={(event) => {
                        setExperience(event.target.value as ExperienceRange);
                        setResult(null);
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
                    <label htmlFor="education" className={labelClassName}>
                      Highest education
                    </label>
                    <select
                      id="education"
                      name="education"
                      required
                      value={education}
                      onChange={(event) => {
                        setEducation(event.target.value as EducationLevel);
                        setResult(null);
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
                className="mt-4 flex min-h-[40px] w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Estimate Wage Level
              </button>
            </section>

            <section
              className="bg-slate-50/50 p-4 sm:p-5"
              aria-labelledby="h1b-result-heading"
              aria-live="polite"
            >
              <h2 id="h1b-result-heading" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Your estimate
              </h2>

              {!result ? (
                <div className="mt-3 flex min-h-[12rem] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-700">Results will appear here</p>
                  <p className="mt-1 max-w-[16rem] text-xs text-slate-500">
                    Enter your job details and tap Estimate Wage Level.
                  </p>
                </div>
              ) : !result.ok ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4" role="alert">
                  <p className="text-sm font-semibold text-amber-950">{result.message}</p>
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-brand-200 bg-gradient-to-br from-brand-50/80 to-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                      Estimated wage level
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      Likely Level {result.estimatedLevel}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Confidence:{" "}
                      <span className="font-semibold text-slate-900">{result.confidence}</span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
                    {(() => {
                      const occupationEntry = getOccupationByCode(result.occupation.code);
                      return (
                        <>
                          <p>
                            <span className="font-medium text-slate-900">Selected occupation:</span>{" "}
                            {result.occupation.title}
                          </p>
                          {occupationEntry ? (
                            <p className="mt-0.5 text-xs text-slate-500">{occupationEntry.group}</p>
                          ) : null}
                        </>
                      );
                    })()}
                    <p className="mt-1.5">
                      <span className="font-medium text-slate-900">Location:</span>{" "}
                      {result.locationLabel}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50/80">
                        <tr>
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Wage level
                          </th>
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Annual wage
                          </th>
                          <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Your salary position
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.salaryComparison.map((row) => (
                          <tr key={row.level} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 font-medium text-slate-900">Level {row.level}</td>
                            <td className="px-3 py-2 text-slate-700">{formatCurrency(row.annualWage)}</td>
                            <td className="px-3 py-2 text-slate-700">{row.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

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
            <strong className="font-semibold text-amber-950">Disclaimer:</strong> This tool provides an
            educational estimate only. H-1B wage level classification depends on the official LCA, SOC code,
            worksite location, job duties, education, experience, supervision, and employer wage
            documentation. The official wage level is determined by the employer/attorney on the certified LCA
            and DOL prevailing wage rules. IMMIFIN does not provide legal advice.
          </p>
        </div>
      </div>
    </>
  );
}
