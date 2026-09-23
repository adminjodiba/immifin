"use client";

import { useRef, useState } from "react";
import {
  fetchWorksiteGeography,
  formatCountyChoicePrimaryLabel,
  formatWageAreaContext,
  userFacingGeographyMessage,
  WORKSITE_GEOGRAPHY_NETWORK_COPY,
  WORKSITE_GEOGRAPHY_THROTTLED_COPY,
  WORKSITE_GEOGRAPHY_UNAVAILABLE_COPY,
  type WorksiteGeographyClientChoice,
  type WorksiteGeographyClientOutcome,
} from "@/lib/h1b/geo/client/worksiteGeographyClient";

const inputClassName =
  "block h-12 w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-11 pr-3 text-[15px] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/12";

export type WorksiteGeographyAuthority = {
  ready: boolean;
  zip: string;
  countyFips: string | null;
};

export function WorksiteGeographyLookup({
  onAuthorityChange,
}: {
  onAuthorityChange?: (authority: WorksiteGeographyAuthority) => void;
}) {
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<WorksiteGeographyClientOutcome | null>(null);
  const [choiceOptions, setChoiceOptions] = useState<WorksiteGeographyClientChoice[]>([]);
  const [selectedCountyFips, setSelectedCountyFips] = useState<string | null>(null);
  const [resolvedAreaName, setResolvedAreaName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const requestSeqRef = useRef(0);

  function emitAuthority(ready: boolean, nextZip: string, countyFips: string | null) {
    onAuthorityChange?.({ ready, zip: nextZip, countyFips });
  }

  function clearStaleGeography(nextZip: string) {
    setOutcome(null);
    setChoiceOptions([]);
    setSelectedCountyFips(null);
    setResolvedAreaName(null);
    setMessage(null);
    emitAuthority(false, nextZip, null);
  }

  function handleZipChange(nextZip: string) {
    requestSeqRef.current += 1;
    pendingRef.current = false;
    setLoading(false);
    setZip(nextZip);
    clearStaleGeography(nextZip);
    if (nextZip.length === 5) {
      void resolveGeography(nextZip);
    }
  }

  async function resolveGeography(nextZip: string, countyFips?: string) {
    if (pendingRef.current || nextZip.length === 0) {
      return;
    }

    pendingRef.current = true;
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    setLoading(true);
    setMessage(null);

    try {
      const result = await fetchWorksiteGeography({
        zip: nextZip,
        countyFips,
      });
      if (requestSeq !== requestSeqRef.current) {
        return;
      }
      if (!result.ok) {
        setOutcome(null);
        setChoiceOptions([]);
        setSelectedCountyFips(null);
        setResolvedAreaName(null);
        setMessage(
          result.kind === "network"
            ? WORKSITE_GEOGRAPHY_NETWORK_COPY
            : result.kind === "throttled"
              ? WORKSITE_GEOGRAPHY_THROTTLED_COPY
              : WORKSITE_GEOGRAPHY_UNAVAILABLE_COPY,
        );
        emitAuthority(false, nextZip, countyFips ?? null);
        return;
      }

      if (result.data.outcome === "AUTO") {
        const resolvedZip = result.data.normalized_zip || nextZip;
        const resolvedCounty = result.data.selected_county_fips;
        setOutcome("AUTO");
        setChoiceOptions([]);
        setSelectedCountyFips(resolvedCounty);
        setResolvedAreaName(result.data.resolved_area?.area_name ?? null);
        setMessage(null);
        emitAuthority(true, resolvedZip, resolvedCounty);
        return;
      }

      if (result.data.outcome === "CHOICE_REQUIRED") {
        setOutcome("CHOICE_REQUIRED");
        setChoiceOptions(result.data.choice_options);
        setSelectedCountyFips(null);
        setResolvedAreaName(null);
        setMessage(null);
        emitAuthority(false, result.data.normalized_zip || nextZip, null);
        return;
      }

      setOutcome("UNAVAILABLE");
      setChoiceOptions([]);
      setSelectedCountyFips(null);
      setResolvedAreaName(null);
      setMessage(userFacingGeographyMessage(result.data.reason_code));
      emitAuthority(false, result.data.normalized_zip || nextZip, null);
    } finally {
      if (requestSeq === requestSeqRef.current) {
        pendingRef.current = false;
        setLoading(false);
      }
    }
  }

  return (
    <div>
      <label htmlFor="worksite-zip" className="sr-only">
        Worksite ZIP
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400" aria-hidden="true">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </span>
        <input
          id="worksite-zip"
          name="worksiteZip"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          value={zip}
          disabled={loading}
          onChange={(event) => handleZipChange(event.target.value)}
          onBlur={(event) => {
            const nextZip = event.currentTarget.value;
            if (nextZip !== zip) {
              handleZipChange(nextZip);
              return;
            }
            if (outcome === "AUTO" || outcome === "CHOICE_REQUIRED") {
              return;
            }
            void resolveGeography(nextZip);
          }}
          placeholder="77433"
          className={inputClassName}
          aria-describedby="worksite-zip-help"
        />
      </div>
      <p id="worksite-zip-help" className="sr-only">
        Official wage geography uses the worksite ZIP. County is asked only when required.
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-slate-500" aria-live="polite">
          Looking up official wage geography…
        </p>
      ) : null}

      {outcome === "AUTO" && resolvedAreaName ? (
        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-emerald-50/90 px-4 py-3.5 ring-1 ring-emerald-200/70"
          aria-live="polite"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-950">Worksite resolved automatically</p>
              <p className="mt-0.5 text-sm text-emerald-800/90">{resolvedAreaName}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            AUTO
          </span>
        </div>
      ) : null}

      {outcome === "CHOICE_REQUIRED" ? (
        <fieldset className="mt-4" disabled={loading}>
          <legend className="text-sm font-semibold text-slate-900">Which county is the work location?</legend>
          <div className="mt-2.5 space-y-2.5" role="radiogroup" aria-label="Work-location county">
            {choiceOptions.map((option) => {
              const selected = selectedCountyFips === option.county_fips;
              return (
                <button
                  key={option.county_fips}
                  type="button"
                  aria-pressed={selected}
                  disabled={loading}
                  onClick={() => {
                    emitAuthority(false, zip, option.county_fips);
                    void resolveGeography(zip, option.county_fips);
                  }}
                  className={`w-full rounded-2xl px-4 py-3.5 text-left transition-colors ${
                    selected
                      ? "bg-brand-50 ring-1 ring-brand-500"
                      : "bg-white ring-1 ring-slate-200/80 hover:bg-brand-50/60 hover:ring-brand-300"
                  }`}
                >
                  <span className="block text-sm font-semibold text-slate-900">
                    {formatCountyChoicePrimaryLabel(option)}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {formatWageAreaContext(option.area_name)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {message ? (
        <p className="mt-3 text-sm text-amber-700" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
