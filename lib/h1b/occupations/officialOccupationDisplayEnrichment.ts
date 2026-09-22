/**
 * SERVER-ONLY — selected-occupation display enrichment.
 * Returns only the fields the approved UI needs for a single official SOC.
 * Does not replace official 848-title search.
 */

import type { OfficialOccupationDisplayEnrichment } from "@/lib/h1b/occupations/officialOccupationDisplay.types";
import {
  getOccupationByCode,
  getOccupationKeywords,
  getOccupationMatchConfidence,
  isTypicalH1BOccupation,
} from "@/lib/services/occupationService";

export type { OfficialOccupationDisplayEnrichment, OfficialOccupationDisplayMatchConfidence } from "@/lib/h1b/occupations/officialOccupationDisplay.types";

export const OFFICIAL_OCCUPATION_COMMON_TITLE_LIMIT = 6;

export type OfficialOccupationDisplayEnricher = {
  enrich(input: { socCode: string; query: string }): OfficialOccupationDisplayEnrichment;
};

export const EMPTY_OFFICIAL_OCCUPATION_DISPLAY_ENRICHMENT: OfficialOccupationDisplayEnrichment = {
  group: null,
  common_job_titles: [],
  typical_h1b: false,
  match_confidence: null,
};

export function enrichOfficialOccupationDisplay(input: {
  socCode: string;
  query: string;
}): OfficialOccupationDisplayEnrichment {
  const metadata = getOccupationByCode(input.socCode);
  if (!metadata) {
    return EMPTY_OFFICIAL_OCCUPATION_DISPLAY_ENRICHMENT;
  }

  const match = getOccupationMatchConfidence(input.query, metadata);

  return {
    group: metadata.group,
    common_job_titles: getOccupationKeywords(input.socCode).slice(0, OFFICIAL_OCCUPATION_COMMON_TITLE_LIMIT),
    typical_h1b: isTypicalH1BOccupation(input.socCode),
    match_confidence: match?.matchConfidence ?? null,
  };
}

export function createSeedOfficialOccupationDisplayEnricher(): OfficialOccupationDisplayEnricher {
  return {
    enrich: enrichOfficialOccupationDisplay,
  };
}

export function createEmptyOfficialOccupationDisplayEnricher(): OfficialOccupationDisplayEnricher {
  return {
    enrich() {
      return EMPTY_OFFICIAL_OCCUPATION_DISPLAY_ENRICHMENT;
    },
  };
}
