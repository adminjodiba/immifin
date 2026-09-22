"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import {
  WorksiteGeographyLookup,
  type WorksiteGeographyAuthority,
} from "@/components/h1b/WorksiteGeographyLookup";
import {
  fetchOfficialOccupations,
  OFFICIAL_OCCUPATION_SEARCH_NETWORK_COPY,
  OFFICIAL_OCCUPATION_SEARCH_UNAVAILABLE_COPY,
  type OfficialOccupationClientRow,
} from "@/lib/h1b/occupations/client/officialOccupationSearchClient";
import {
  ANNUAL_EQUIVALENT_DISCLAIMER,
  officialWageDisplayRows,
  officialWageDisplayUnit,
  officialWageInputsChanged,
  shouldShowAnnualEquivalent,
  shouldShowNoLeveledCopy,
  NO_LEVELED_WAGE_COPY,
} from "@/lib/h1b/wage/client/formatOfficialWageDisplay";
import {
  fetchOfficialWage,
  OFFICIAL_WAGE_CHOICE_COPY,
  OFFICIAL_WAGE_NETWORK_COPY,
  OFFICIAL_WAGE_UNAVAILABLE_COPY,
  type OfficialWageClientResponse,
  type OfficialWageClientWage,
} from "@/lib/h1b/wage/client/officialWageLookupClient";

const PAGE_HREF = "/immigration/h1b-wage-level-estimator";
const PAGE_TITLE = "H-1B Wage Level Estimator";
const OCCUPATION_SEARCH_DEBOUNCE_MS = 250;
const cardClassName =
  "rounded-[1.75rem] bg-white p-6 shadow-[0_10px_28px_-20px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/70 sm:p-8";
const inputClassName =
  "block h-12 w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-11 pr-11 text-[15px] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12";

function StepHeading({
  step,
  title,
  description,
  connect,
}: {
  step: number;
  title: string;
  description: string;
  connect?: boolean;
}) {
  return (
    <div className="relative flex items-start gap-3.5">
      {connect ? (
        <span
          className="absolute left-4 top-8 hidden h-[calc(100%+2.75rem)] w-px bg-slate-200/90 sm:block"
          aria-hidden="true"
        />
      ) : null}
      <span className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
        {step}
      </span>
      <div className="min-w-0 pt-0.5">
        <h3 className="text-[15px] font-semibold tracking-tight text-[#0B1F3A]">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function SelectedOccupationCard({
  occupation,
  onClear,
}: {
  occupation: OfficialOccupationClientRow;
  onClear: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-brand-200/80 bg-brand-50/80 px-4 py-3.5">
      <div className="min-w-0 border-l-2 border-brand-500 pl-3">
        <p className="text-[15px] font-semibold text-[#0B1F3A]">{occupation.title}</p>
        <p className="mt-0.5 text-sm text-slate-500">SOC {occupation.soc_code}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.25} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Selected
        </span>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
          aria-label="Clear selected occupation"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function OccupationSearchOption({
  occupation,
  onSelect,
}: {
  occupation: OfficialOccupationClientRow;
  onSelect: (occupation: OfficialOccupationClientRow) => void;
}) {
  return (
    <li role="option" aria-selected="false">
      <button
        type="button"
        className="w-full px-4 py-3 text-left transition-colors hover:bg-brand-50"
        onClick={() => onSelect(occupation)}
      >
        <span className="block text-sm font-semibold text-slate-900">{occupation.title}</span>
        <span className="mt-0.5 block text-xs text-slate-500">SOC {occupation.soc_code}</span>
      </button>
    </li>
  );
}

function formatEffectiveRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

function officialColumnHeading(wage: OfficialWageClientWage): string {
  const unit = officialWageDisplayUnit(wage.label);
  if (unit === "hour") return "Official Hourly Rate";
  if (unit === "year") return "Official Annual Rate";
  return "Published value";
}

function ResultEmptyState() {
  return (
    <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-2xl bg-slate-50/90 px-6 py-8 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200/80">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </span>
      <p className="mt-3 text-sm font-semibold text-[#0B1F3A]">Published wages will appear here</p>
      <p className="mt-1 max-w-[18rem] text-sm leading-6 text-slate-500">
        Select an occupation, resolve the worksite ZIP, then look up published wages.
      </p>
    </div>
  );
}

function SourcePanel({ source }: { source: NonNullable<OfficialWageClientResponse["source"]> }) {
  const items: Array<{ label: string; value: ReactNode }> = [
    { label: "Source", value: "U.S. Department of Labor OFLC" },
    { label: "Wage year", value: source.wage_year },
  ];
  if (source.bls_survey) {
    items.push({ label: "Survey", value: source.bls_survey });
  }
  if (source.soc_version) {
    items.push({ label: "SOC", value: source.soc_version });
  }
  items.push({
    label: "Effective period",
    value: formatEffectiveRange(source.effective_start, source.effective_end),
  });

  return (
    <div className="rounded-xl bg-slate-50/90 px-4 py-3.5">
      <p className="text-sm font-semibold tracking-tight text-[#0B1F3A]">Source Information</p>
      <p className="mt-0.5 text-xs leading-5 text-slate-500">Details about the official data used for this result.</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">{item.label}</dt>
            <dd className="mt-1 text-[13px] font-medium text-slate-700">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function H1bWageLevelEstimator() {
  const [occupationQuery, setOccupationQuery] = useState("");
  const [selectedOccupation, setSelectedOccupation] = useState<OfficialOccupationClientRow | null>(null);
  const [occupationMatches, setOccupationMatches] = useState<OfficialOccupationClientRow[]>([]);
  const [occupationLoading, setOccupationLoading] = useState(false);
  const [occupationError, setOccupationError] = useState<string | null>(null);
  const [showOccupationList, setShowOccupationList] = useState(false);
  const [geography, setGeography] = useState<WorksiteGeographyAuthority>({
    ready: false,
    zip: "",
    countyFips: null,
  });
  const [wageLookup, setWageLookup] = useState<OfficialWageClientResponse | null>(null);
  const [wageMessage, setWageMessage] = useState<string | null>(null);
  const [wageLoading, setWageLoading] = useState(false);
  const occupationPickerRef = useRef<HTMLDivElement>(null);
  const wageInputsRef = useRef({ socCode: null as string | null, zip: "", countyFips: null as string | null });

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

  useEffect(() => {
    const query = occupationQuery.trim();
    if (!query || selectedOccupation) {
      setOccupationMatches([]);
      setOccupationLoading(false);
      setOccupationError(null);
      return;
    }

    const requestSeq = window.setTimeout(async () => {
      setOccupationLoading(true);
      setOccupationError(null);
      const result = await fetchOfficialOccupations(query);
      if (result.ok) {
        if (result.data.outcome === "UNAVAILABLE") {
          setOccupationMatches([]);
          setOccupationError(OFFICIAL_OCCUPATION_SEARCH_UNAVAILABLE_COPY);
        } else {
          setOccupationMatches(result.data.results);
          setOccupationError(null);
        }
      } else {
        setOccupationMatches([]);
        setOccupationError(
          result.kind === "network"
            ? OFFICIAL_OCCUPATION_SEARCH_NETWORK_COPY
            : OFFICIAL_OCCUPATION_SEARCH_UNAVAILABLE_COPY,
        );
      }
      setOccupationLoading(false);
    }, OCCUPATION_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(requestSeq);
  }, [occupationQuery, selectedOccupation]);

  function clearWageResult() {
    setWageLookup(null);
    setWageMessage(null);
  }

  function clearOccupation() {
    setSelectedOccupation(null);
    setOccupationQuery("");
    setShowOccupationList(false);
    setOccupationMatches([]);
    setOccupationError(null);
    clearWageResult();
    wageInputsRef.current = { ...wageInputsRef.current, socCode: null };
  }

  function selectOccupation(occupation: OfficialOccupationClientRow) {
    setSelectedOccupation(occupation);
    setOccupationQuery(occupation.title);
    setShowOccupationList(false);
    setOccupationMatches([]);
    setOccupationError(null);
    clearWageResult();
    wageInputsRef.current = {
      ...wageInputsRef.current,
      socCode: occupation.soc_code,
    };
  }

  function handleGeographyAuthority(next: WorksiteGeographyAuthority) {
    const previous = wageInputsRef.current;
    const changed = officialWageInputsChanged(previous, {
      socCode: selectedOccupation?.soc_code ?? null,
      zip: next.zip,
      countyFips: next.countyFips,
    });
    setGeography(next);
    wageInputsRef.current = {
      socCode: selectedOccupation?.soc_code ?? null,
      zip: next.zip,
      countyFips: next.countyFips,
    };
    if (changed) {
      clearWageResult();
    }
  }

  const lookupEnabled = Boolean(selectedOccupation && geography.ready && !wageLoading);

  async function handleLookup(event: FormEvent) {
    event.preventDefault();
    if (!selectedOccupation || !geography.ready || wageLoading) {
      return;
    }

    setWageLoading(true);
    clearWageResult();

    const result = await fetchOfficialWage({
      socCode: selectedOccupation.soc_code,
      zip: geography.zip,
      countyFips: geography.countyFips,
    });

    setWageLoading(false);

    if (!result.ok) {
      setWageMessage(
        result.kind === "network" ? OFFICIAL_WAGE_NETWORK_COPY : OFFICIAL_WAGE_UNAVAILABLE_COPY,
      );
      return;
    }

    if (result.data.outcome === "CHOICE_REQUIRED") {
      setWageMessage(OFFICIAL_WAGE_CHOICE_COPY);
      return;
    }

    if (result.data.outcome !== "AUTO" || !result.data.wage) {
      setWageMessage(OFFICIAL_WAGE_UNAVAILABLE_COPY);
      return;
    }

    setWageLookup(result.data);
  }

  const wage = wageLookup?.wage ?? null;
  const source = wageLookup?.source ?? null;
  const wageRows = wage ? officialWageDisplayRows(wage) : [];
  const showAnnualEquivalent = wage ? shouldShowAnnualEquivalent(wage) : false;

  return (
    <div className="-mx-4 bg-[#E8EEF6] px-4 py-6 sm:-mx-6 sm:px-6 sm:py-7 lg:-mx-8 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-[#0B1F3A] sm:text-[2rem] sm:leading-tight">
              {PAGE_TITLE}
            </h1>
            <FavoriteStar pageLabel={PAGE_TITLE} pageHref={PAGE_HREF} />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Look up published OFLC wages for an official occupation and worksite ZIP.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-slate-300/90 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-[#0B1F3A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          Close
        </Link>
      </header>

      <div className="mt-8 space-y-6">
        <form onSubmit={handleLookup} aria-label="H-1B published wage lookup">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(28rem,0.92fr)_minmax(0,1.18fr)]">
            <section
              className={`${cardClassName} lg:sticky lg:top-6`}
              aria-labelledby="h1b-input-heading"
            >
              <h2 id="h1b-input-heading" className="sr-only">
                Occupation and worksite
              </h2>

              <div className="space-y-10">
                <div ref={occupationPickerRef} className="relative">
                  <StepHeading
                    step={1}
                    title="Select Occupation"
                    description="Search for an official occupation using the current OFLC dataset."
                    connect
                  />
                  <div className="relative mt-4">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400" aria-hidden="true">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                      </svg>
                    </span>
                    <label htmlFor="occupation-search" className="sr-only">
                      Search occupation
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
                        setShowOccupationList(true);
                        clearWageResult();
                        wageInputsRef.current = { ...wageInputsRef.current, socCode: null };
                      }}
                      onFocus={() => {
                        if (!selectedOccupation) {
                          setShowOccupationList(true);
                        }
                      }}
                      placeholder="Software Developers"
                      className={inputClassName}
                      role="combobox"
                      aria-expanded={showOccupationList}
                      aria-controls="occupation-search-list"
                      aria-autocomplete="list"
                    />
                    {occupationQuery ? (
                      <button
                        type="button"
                        onClick={clearOccupation}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-700"
                        aria-label="Clear occupation search"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                  {showOccupationList && occupationMatches.length > 0 ? (
                    <ul
                      id="occupation-search-list"
                      role="listbox"
                      className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-2xl bg-white py-1 shadow-xl ring-1 ring-slate-200/80"
                    >
                      {occupationMatches.map((occupation) => (
                        <OccupationSearchOption
                          key={occupation.soc_code}
                          occupation={occupation}
                          onSelect={selectOccupation}
                        />
                      ))}
                    </ul>
                  ) : null}
                  {occupationLoading ? (
                    <p className="mt-3 text-sm text-slate-500" aria-live="polite">
                      Searching official occupations…
                    </p>
                  ) : null}
                  {selectedOccupation && !showOccupationList ? (
                    <SelectedOccupationCard occupation={selectedOccupation} onClear={clearOccupation} />
                  ) : null}
                  {showOccupationList && occupationQuery.trim() && !occupationLoading && occupationMatches.length === 0 && !occupationError ? (
                    <p className="mt-3 text-sm text-amber-700">No matching occupations. Try a different keyword.</p>
                  ) : null}
                  {occupationError ? (
                    <p className="mt-3 text-sm text-amber-700" role="status">
                      {occupationError}
                    </p>
                  ) : null}
                </div>

                <div>
                  <StepHeading
                    step={2}
                    title="Enter Worksite ZIP"
                    description="Use the worksite ZIP to determine the official wage area."
                  />
                  <div className="mt-4">
                    <WorksiteGeographyLookup onAuthorityChange={handleGeographyAuthority} />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={!lookupEnabled}
                    className="flex h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-600 px-5 text-[15px] font-semibold text-white shadow-[0_10px_20px_-12px_rgba(37,99,235,0.65)] transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:bg-brand-400 disabled:shadow-none"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                    </svg>
                    {wageLoading ? "Looking up published wages…" : "Look up published wages"}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs leading-5 text-slate-400">
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Uses official U.S. Department of Labor OFLC data
                  </p>
                </div>
              </div>
            </section>

            <section
              className={`min-w-0 ${cardClassName}`}
              aria-labelledby="h1b-result-heading"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1F3A]/[0.06] text-[#0B1F3A]" aria-hidden="true">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </span>
                <div>
                  <h2 id="h1b-result-heading" className="text-lg font-semibold tracking-tight text-[#0B1F3A]">
                    Published OFLC Wage Information
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Official wage data for the selected occupation and worksite.
                  </p>
                </div>
              </div>

              {!wage && !wageMessage && !wageLoading ? <div className="mt-6"><ResultEmptyState /></div> : null}

              {wageLoading ? (
                <p className="mt-6 text-sm text-slate-600">Looking up published OFLC wages…</p>
              ) : null}

              {wageMessage ? (
                <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3.5 ring-1 ring-amber-200/80" role="alert">
                  <p className="text-sm font-semibold text-amber-950">{wageMessage}</p>
                </div>
              ) : null}

              {wage ? (
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-3 rounded-xl bg-[#F4F7FB] px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xl font-semibold tracking-tight text-[#0B1F3A]">{wage.occupation_title}</p>
                      <p className="mt-1 text-sm text-slate-500">SOC {wage.soc_code}</p>
                    </div>
                    {wageLookup?.geography.resolved_area?.area_name ? (
                      <div className="max-w-sm sm:text-right">
                        <p className="flex items-start gap-1.5 text-sm font-medium text-slate-800 sm:justify-end">
                          <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          {wageLookup.geography.resolved_area.area_name}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-slate-500 sm:justify-end">
                          <span>Wage Area</span>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                            AUTO
                          </span>
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {wage.label ? (
                    <p className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      {wage.label}
                    </p>
                  ) : null}

                  {wageRows.length > 0 ? (
                    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-18px_rgba(11,31,58,0.45)] ring-1 ring-slate-200/70">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[32rem] text-left">
                          <thead className="bg-[#0B1F3A] text-white">
                            <tr>
                              <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em]">
                                Wage Level
                              </th>
                              <th className="border-l border-white/10 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em]">
                                {officialColumnHeading(wage)}
                                {officialWageDisplayUnit(wage.label) !== "unspecified" ? (
                                  <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-slate-300">
                                    (OFLC)
                                  </span>
                                ) : null}
                              </th>
                              {showAnnualEquivalent ? (
                                <th className="border-l border-white/10 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em]">
                                  Annual Equivalent
                                  <span className="mt-1 block text-[11px] font-medium normal-case tracking-normal text-slate-300">
                                    (IMMIFIN calculation)
                                  </span>
                                </th>
                              ) : null}
                            </tr>
                          </thead>
                          <tbody>
                            {wageRows.map((row, index) => {
                              const isAverage = row.key === "average";
                              return (
                                <tr
                                  key={row.key}
                                  className={`${isAverage ? "bg-[#F3F7FB]" : "bg-white"} ${index > 0 ? "border-t border-slate-100" : ""}`}
                                >
                                  <td className={`px-5 py-4 text-[#0B1F3A] ${isAverage ? "font-semibold" : "font-medium"}`}>
                                    {row.label}
                                  </td>
                                  <td className={`px-5 py-4 tabular-nums text-slate-700 ${isAverage ? "font-semibold text-[#0B1F3A]" : ""}`}>
                                    {row.official}
                                  </td>
                                  {showAnnualEquivalent ? (
                                    <td className={`px-5 py-4 tabular-nums ${isAverage ? "font-semibold text-[#0B1F3A]" : "font-semibold text-slate-900"}`}>
                                      {row.annualEquivalent}
                                    </td>
                                  ) : null}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {showAnnualEquivalent ? (
                    <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                      <p>{ANNUAL_EQUIVALENT_DISCLAIMER}</p>
                    </div>
                  ) : null}

                  {shouldShowNoLeveledCopy(wage) ? (
                    <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                      {NO_LEVELED_WAGE_COPY}
                    </p>
                  ) : null}

                  {source ? <SourcePanel source={source} /> : null}
                </div>
              ) : null}
            </section>
          </div>
        </form>

        <div className="flex items-start gap-3 px-1 py-1">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-slate-400" aria-hidden="true">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </span>
          <p className="text-sm leading-6 text-slate-500">
            This tool shows published OFLC wage data. IMMIFIN does not issue a Prevailing Wage
            Determination, choose the wage level that applies to a specific position, or determine an
            employer&apos;s legal wage obligation.
          </p>
        </div>
      </div>
    </div>
  );
}
