/**
 * Browser client for POST /api/h1b/worksite-geography.
 * Builds only zip / county_fips. Does not map counties to OFLC areas.
 */

export type WorksiteGeographyClientOutcome = "AUTO" | "CHOICE_REQUIRED" | "UNAVAILABLE";

export type WorksiteGeographyClientChoice = {
  county_fips: string;
  county_display_name: string;
  state_display_name: string;
  area_name: string;
};

export type WorksiteGeographyClientResponse = {
  outcome: WorksiteGeographyClientOutcome;
  reason_code: string;
  normalized_zip: string;
  selected_county_fips: string | null;
  resolved_area: { area_code: string; area_name: string } | null;
  choice_options: WorksiteGeographyClientChoice[];
};

export type WorksiteGeographyClientResult =
  | { ok: true; data: WorksiteGeographyClientResponse }
  | { ok: false; kind: "validation" | "unavailable_payload" | "network"; status?: number };

export const WORKSITE_GEOGRAPHY_UNAVAILABLE_COPY =
  "We couldn't determine the official wage area for this worksite ZIP.";
export const WORKSITE_GEOGRAPHY_INVALID_ZIP_COPY = "Enter a valid 5-digit worksite ZIP.";
export const WORKSITE_GEOGRAPHY_NETWORK_COPY =
  "Unable to look up worksite geography. Please try again.";

export function formatCountyChoicePrimaryLabel(option: {
  county_display_name: string;
  state_display_name: string;
}): string {
  return `${option.county_display_name}, ${option.state_display_name}`;
}

export function formatWageAreaContext(areaName: string): string {
  return `Wage area: ${areaName}`;
}

export function userFacingGeographyMessage(reasonCode: string): string {
  return reasonCode === "INVALID_ZIP"
    ? WORKSITE_GEOGRAPHY_INVALID_ZIP_COPY
    : WORKSITE_GEOGRAPHY_UNAVAILABLE_COPY;
}

export function buildWorksiteGeographyRequestBody(input: {
  zip: string;
  countyFips?: string;
}): { zip: string; county_fips?: string } {
  const body: { zip: string; county_fips?: string } = { zip: input.zip };
  if (input.countyFips !== undefined) {
    body.county_fips = input.countyFips;
  }
  return body;
}

function isChoiceOption(value: unknown): value is WorksiteGeographyClientChoice {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.county_fips === "string" &&
    typeof row.county_display_name === "string" &&
    typeof row.state_display_name === "string" &&
    typeof row.area_name === "string"
  );
}

function parseResponse(value: unknown): WorksiteGeographyClientResponse | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (
    row.outcome !== "AUTO" &&
    row.outcome !== "CHOICE_REQUIRED" &&
    row.outcome !== "UNAVAILABLE"
  ) {
    return null;
  }
  if (typeof row.reason_code !== "string" || typeof row.normalized_zip !== "string") {
    return null;
  }
  const resolved =
    row.resolved_area && typeof row.resolved_area === "object"
      ? (row.resolved_area as { area_code?: unknown; area_name?: unknown })
      : null;
  const choice_options = Array.isArray(row.choice_options)
    ? row.choice_options.filter(isChoiceOption)
    : [];
  return {
    outcome: row.outcome,
    reason_code: row.reason_code,
    normalized_zip: row.normalized_zip,
    selected_county_fips:
      typeof row.selected_county_fips === "string" ? row.selected_county_fips : null,
    resolved_area:
      resolved && typeof resolved.area_code === "string" && typeof resolved.area_name === "string"
        ? { area_code: resolved.area_code, area_name: resolved.area_name }
        : null,
    choice_options,
  };
}

export async function fetchWorksiteGeography(input: {
  zip: string;
  countyFips?: string;
}): Promise<WorksiteGeographyClientResult> {
  const body = buildWorksiteGeographyRequestBody(input);

  let response: Response;
  try {
    response = await fetch("/api/h1b/worksite-geography", {
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
    return { ok: false, kind: response.ok ? "unavailable_payload" : "validation", status: response.status };
  }

  if (!response.ok) {
    return { ok: false, kind: "validation", status: response.status };
  }

  const data = parseResponse(payload);
  if (!data) {
    return { ok: false, kind: "unavailable_payload", status: response.status };
  }
  return { ok: true, data };
}
