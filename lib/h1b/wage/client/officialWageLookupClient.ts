/**
 * Browser client for POST /api/h1b/official-wage.
 * Builds only soc_code / zip / optional county_fips.
 * Never sends area_code, geo_level, dataset id, or wage year.
 */

export type OfficialWageClientWage = {
  soc_code: string;
  occupation_title: string;
  label: string | null;
  level1: number | null;
  level2: number | null;
  level3: number | null;
  level4: number | null;
  average: number | null;
};

export type OfficialWageClientSource = {
  wage_year: string;
  data_source: string;
  bls_survey: string | null;
  soc_version: string | null;
  effective_start: string;
  effective_end: string;
};

export type OfficialWageClientResponse = {
  outcome: "AUTO" | "CHOICE_REQUIRED" | "UNAVAILABLE";
  reason_code: string;
  geography: {
    normalized_zip: string;
    selected_county_fips: string | null;
    resolved_area: { area_name: string } | null;
  };
  wage: OfficialWageClientWage | null;
  source: OfficialWageClientSource | null;
};

export type OfficialWageClientResult =
  | { ok: true; data: OfficialWageClientResponse }
  | {
      ok: false;
      kind: "validation" | "unavailable" | "network" | "throttled";
      status?: number;
      retryAfterSeconds?: number;
    };

export const OFFICIAL_WAGE_NETWORK_COPY = "Unable to look up published wages. Please try again.";
export const OFFICIAL_WAGE_UNAVAILABLE_COPY =
  "Published wages are not available for this occupation and worksite.";
export const OFFICIAL_WAGE_CHOICE_COPY =
  "This worksite ZIP needs a county selection before published wages can be shown.";
export const OFFICIAL_WAGE_THROTTLED_COPY =
  "Too many requests. Please wait a moment and try again.";

export type OfficialWageRequestInput = {
  socCode: string;
  zip: string;
  countyFips?: string | null;
};

export function buildOfficialWageRequestBody(
  input: OfficialWageRequestInput,
): { soc_code: string; zip: string; county_fips?: string } {
  const body: { soc_code: string; zip: string; county_fips?: string } = {
    soc_code: input.socCode,
    zip: input.zip,
  };
  if (input.countyFips) {
    body.county_fips = input.countyFips;
  }
  return body;
}

function isFiniteNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function parseWage(value: unknown): OfficialWageClientWage | null {
  if (value === null) return null;
  if (typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.soc_code !== "string" ||
    typeof row.occupation_title !== "string" ||
    !(row.label === null || typeof row.label === "string") ||
    !isFiniteNumberOrNull(row.level1) ||
    !isFiniteNumberOrNull(row.level2) ||
    !isFiniteNumberOrNull(row.level3) ||
    !isFiniteNumberOrNull(row.level4) ||
    !isFiniteNumberOrNull(row.average)
  ) {
    return null;
  }
  return {
    soc_code: row.soc_code,
    occupation_title: row.occupation_title,
    label: row.label,
    level1: row.level1,
    level2: row.level2,
    level3: row.level3,
    level4: row.level4,
    average: row.average,
  };
}

function parseSource(value: unknown): OfficialWageClientSource | null {
  if (value === null) return null;
  if (typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.wage_year !== "string" ||
    typeof row.data_source !== "string" ||
    !(row.bls_survey === null || typeof row.bls_survey === "string") ||
    !(row.soc_version === null || typeof row.soc_version === "string") ||
    typeof row.effective_start !== "string" ||
    typeof row.effective_end !== "string"
  ) {
    return null;
  }
  return {
    wage_year: row.wage_year,
    data_source: row.data_source,
    bls_survey: row.bls_survey,
    soc_version: row.soc_version,
    effective_start: row.effective_start,
    effective_end: row.effective_end,
  };
}

function parseResponse(value: unknown): OfficialWageClientResponse | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (
    row.outcome !== "AUTO" &&
    row.outcome !== "CHOICE_REQUIRED" &&
    row.outcome !== "UNAVAILABLE"
  ) {
    return null;
  }
  if (typeof row.reason_code !== "string" || typeof row.geography !== "object" || row.geography === null) {
    return null;
  }
  const geo = row.geography as Record<string, unknown>;
  if (typeof geo.normalized_zip !== "string") return null;
  const resolved =
    geo.resolved_area && typeof geo.resolved_area === "object"
      ? (geo.resolved_area as { area_name?: unknown })
      : null;
  const wage = parseWage(row.wage);
  if (row.wage !== null && wage === null) return null;
  const source = parseSource(row.source);
  if (row.source !== null && source === null) return null;
  return {
    outcome: row.outcome,
    reason_code: row.reason_code,
    geography: {
      normalized_zip: geo.normalized_zip,
      selected_county_fips:
        typeof geo.selected_county_fips === "string" ? geo.selected_county_fips : null,
      resolved_area:
        resolved && typeof resolved.area_name === "string" ? { area_name: resolved.area_name } : null,
    },
    wage,
    source,
  };
}

export async function fetchOfficialWage(
  input: OfficialWageRequestInput,
): Promise<OfficialWageClientResult> {
  const body = buildOfficialWageRequestBody(input);

  let response: Response;
  try {
    response = await fetch("/api/h1b/official-wage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, kind: "network" };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, kind: response.ok ? "unavailable" : "validation", status: response.status };
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    return {
      ok: false,
      kind: "throttled",
      status: 429,
      retryAfterSeconds:
        Number.isInteger(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 120) : undefined,
    };
  }

  if (!response.ok) {
    return { ok: false, kind: response.status >= 500 ? "unavailable" : "validation", status: response.status };
  }

  const data = parseResponse(payload);
  if (!data) {
    return { ok: false, kind: "unavailable", status: response.status };
  }
  return { ok: true, data };
}
