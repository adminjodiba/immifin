import { filterOfficialOccupations } from "@/lib/h1b/occupations/filterOfficialOccupations";
import {
  OCCUPATION_SEARCH_REASON,
  type OfficialOccupationSearchResponse,
  type OfficialOccupationSearchStore,
} from "@/lib/h1b/occupations/officialOccupationSearch.types";

/**
 * Official occupation search against the ACTIVE All Industries dataset.
 * Dataset UUID / wage year are never hardcoded.
 */
export async function searchOfficialOccupations(
  normalizedQuery: string,
  store: OfficialOccupationSearchStore,
): Promise<OfficialOccupationSearchResponse> {
  const datasets = await store.loadActiveAllIndustriesDatasets();
  if (datasets.length !== 1) {
    return {
      outcome: "UNAVAILABLE",
      reason_code: OCCUPATION_SEARCH_REASON.UNAVAILABLE_DATASET_INACTIVE,
      results: [],
    };
  }

  if (!normalizedQuery) {
    return {
      outcome: "AUTO",
      reason_code: OCCUPATION_SEARCH_REASON.AUTO_OFFICIAL_OCCUPATIONS,
      results: [],
    };
  }

  const occupations = await store.loadOccupations(datasets[0].id);
  const matched = filterOfficialOccupations(occupations, normalizedQuery);

  return {
    outcome: "AUTO",
    reason_code: OCCUPATION_SEARCH_REASON.AUTO_OFFICIAL_OCCUPATIONS,
    results: matched.map((row) => ({
      soc_code: row.socCode,
      title: row.title,
    })),
  };
}
