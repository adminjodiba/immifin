/**
 * Selected-occupation display fields. Labels only — no match scores.
 * Safe for browser import.
 */

export type OfficialOccupationDisplayMatchConfidence = "High" | "Medium" | "Low";

export type OfficialOccupationDisplayEnrichment = {
  group: string | null;
  common_job_titles: string[];
  typical_h1b: boolean;
  match_confidence: OfficialOccupationDisplayMatchConfidence | null;
};
