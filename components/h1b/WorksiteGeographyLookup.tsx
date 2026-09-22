"use client";

import { useRef, useState } from "react";
import {
  fetchWorksiteGeography,
  formatCountyChoicePrimaryLabel,
  formatWageAreaContext,
  userFacingGeographyMessage,
  WORKSITE_GEOGRAPHY_NETWORK_COPY,
  WORKSITE_GEOGRAPHY_UNAVAILABLE_COPY,
  type WorksiteGeographyClientChoice,
  type WorksiteGeographyClientOutcome,
} from "@/lib/h1b/geo/client/worksiteGeographyClient";

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15";
const labelClassName = "block text-sm font-medium text-slate-900";

export function WorksiteGeographyLookup({
  onResolvedChange,
}: {
  onResolvedChange?: (ready: boolean) => void;
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

  function clearStaleGeography() {
    setOutcome(null);
    setChoiceOptions([]);
    setSelectedCountyFips(null);
    setResolvedAreaName(null);
    setMessage(null);
    onResolvedChange?.(false);
  }

  function handleZipChange(nextZip: string) {
    requestSeqRef.current += 1;
    pendingRef.current = false;
    setLoading(false);
    setZip(nextZip);
    clearStaleGeography();
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
          result.kind === "network" ? WORKSITE_GEOGRAPHY_NETWORK_COPY : WORKSITE_GEOGRAPHY_UNAVAILABLE_COPY,
        );
        onResolvedChange?.(false);
        return;
      }

      if (result.data.outcome === "AUTO") {
        setOutcome("AUTO");
        setChoiceOptions([]);
        setSelectedCountyFips(result.data.selected_county_fips);
        setResolvedAreaName(result.data.resolved_area?.area_name ?? null);
        setMessage(null);
        onResolvedChange?.(true);
        return;
      }

      if (result.data.outcome === "CHOICE_REQUIRED") {
        setOutcome("CHOICE_REQUIRED");
        setChoiceOptions(result.data.choice_options);
        setSelectedCountyFips(null);
        setResolvedAreaName(null);
        setMessage(null);
        onResolvedChange?.(false);
        return;
      }

      setOutcome("UNAVAILABLE");
      setChoiceOptions([]);
      setSelectedCountyFips(null);
      setResolvedAreaName(null);
      setMessage(userFacingGeographyMessage(result.data.reason_code));
      onResolvedChange?.(false);
    } finally {
      if (requestSeq === requestSeqRef.current) {
        pendingRef.current = false;
        setLoading(false);
      }
    }
  }

  return (
    <div>
      <label htmlFor="worksite-zip" className={labelClassName}>
        Worksite ZIP
      </label>
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
      <p id="worksite-zip-help" className="mt-1 text-xs text-slate-500">
        Official wage geography uses the worksite ZIP. County is asked only when required.
      </p>

      {loading ? (
        <p className="mt-2 text-xs text-slate-500" aria-live="polite">
          Looking up official wage geography…
        </p>
      ) : null}

      {outcome === "AUTO" && resolvedAreaName ? (
        <p className="mt-2 text-xs font-medium text-emerald-700" aria-live="polite">
          Official wage area: {resolvedAreaName}
        </p>
      ) : null}

      {outcome === "CHOICE_REQUIRED" ? (
        <fieldset className="mt-3" disabled={loading}>
          <legend className="text-sm font-medium text-slate-900">Which county is the work location?</legend>
          <div className="mt-2 space-y-2" role="radiogroup" aria-label="Work-location county">
            {choiceOptions.map((option) => {
              const selected = selectedCountyFips === option.county_fips;
              return (
                <button
                  key={option.county_fips}
                  type="button"
                  aria-pressed={selected}
                  disabled={loading}
                  onClick={() => {
                    void resolveGeography(zip, option.county_fips);
                  }}
                  className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? "border-brand-600 bg-brand-50"
                      : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50"
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
        <p className="mt-2 text-xs text-amber-700" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
