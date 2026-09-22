/**
 * Browser client for GET /api/h1b/official-occupations.
 * Sends only q. Does not search the curated 722-title seed.
 */

export type OfficialOccupationClientRow = {
  soc_code: string;
  title: string;
};

export type OfficialOccupationClientResponse = {
  outcome: "AUTO" | "UNAVAILABLE";
  reason_code: string;
  results: OfficialOccupationClientRow[];
};

export type OfficialOccupationClientResult =
  | { ok: true; data: OfficialOccupationClientResponse }
  | { ok: false; kind: "validation" | "unavailable" | "network"; status?: number };

export const OFFICIAL_OCCUPATION_SEARCH_NETWORK_COPY =
  "Unable to search official occupations. Please try again.";
export const OFFICIAL_OCCUPATION_SEARCH_UNAVAILABLE_COPY =
  "Official occupations are not available right now.";

export function buildOfficialOccupationSearchPath(query: string): string {
  const params = new URLSearchParams({ q: query });
  return `/api/h1b/official-occupations?${params.toString()}`;
}

function isOccupationRow(value: unknown): value is OfficialOccupationClientRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.soc_code === "string" && typeof row.title === "string";
}

function parseResponse(value: unknown): OfficialOccupationClientResponse | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (row.outcome !== "AUTO" && row.outcome !== "UNAVAILABLE") return null;
  if (typeof row.reason_code !== "string" || !Array.isArray(row.results)) return null;
  return {
    outcome: row.outcome,
    reason_code: row.reason_code,
    results: row.results.filter(isOccupationRow),
  };
}

export async function fetchOfficialOccupations(query: string): Promise<OfficialOccupationClientResult> {
  let response: Response;
  try {
    response = await fetch(buildOfficialOccupationSearchPath(query), { method: "GET" });
  } catch {
    return { ok: false, kind: "network" };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, kind: response.ok ? "unavailable" : "validation", status: response.status };
  }

  if (!response.ok) {
    return { ok: false, kind: "validation", status: response.status };
  }

  const data = parseResponse(payload);
  if (!data) {
    return { ok: false, kind: "unavailable", status: response.status };
  }
  return { ok: true, data };
}
