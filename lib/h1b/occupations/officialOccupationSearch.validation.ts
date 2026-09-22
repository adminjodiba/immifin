import { OFFICIAL_OCCUPATION_SEARCH_MAX_QUERY_CHARS } from "@/lib/h1b/occupations/officialOccupationSearch.types";

export class OfficialOccupationSearchApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OfficialOccupationSearchApiRequestError";
    this.status = status;
  }
}

/**
 * Request-contract validation only.
 * Accepts GET `q`. Trims and collapses whitespace. Empty after trim is a valid empty search.
 */
export function validateOfficialOccupationSearchQuery(raw: string): string {
  if (raw.length > OFFICIAL_OCCUPATION_SEARCH_MAX_QUERY_CHARS) {
    throw new OfficialOccupationSearchApiRequestError("Query is too long.", 400);
  }

  return raw.trim().replace(/\s+/g, " ");
}
