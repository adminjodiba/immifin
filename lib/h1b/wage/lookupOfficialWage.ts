import type { WorksiteGeographyResolver } from "@/lib/h1b/geo/api/handleWorksiteGeographyRequest";
import type { GeographyResolution } from "@/lib/h1b/geo/geographyResolution.types";
import {
  WAGE_LOOKUP_REASON,
  type OfficialWageLookupApiResponse,
  type OfficialWageLookupRequest,
  type OfficialWageLookupStore,
} from "@/lib/h1b/wage/officialWageLookup.types";
import { toOfficialWageResponse } from "@/lib/h1b/wage/toOfficialWageResponse";

export type OfficialWageLookupDeps = {
  resolveWorksiteGeography: WorksiteGeographyResolver;
  store: OfficialWageLookupStore;
};

/**
 * Official wage lookup. Geography authority is delegated to the existing resolver.
 * Dataset UUID / wage year are never hardcoded; ACTIVE All Industries is selected at runtime.
 */
export async function lookupOfficialWage(
  input: OfficialWageLookupRequest,
  deps: OfficialWageLookupDeps,
): Promise<OfficialWageLookupApiResponse> {
  const geography: GeographyResolution = await deps.resolveWorksiteGeography({
    zip: input.zip,
    countyFips: input.countyFips,
  });

  if (geography.outcome !== "AUTO" || !geography.resolvedArea) {
    return toOfficialWageResponse({
      geography,
      wage: null,
      source: null,
      reasonCode: geography.reasonCode,
    });
  }

  const datasets = await deps.store.loadActiveAllIndustriesDatasets();
  if (datasets.length !== 1) {
    return toOfficialWageResponse({
      geography,
      wage: null,
      source: null,
      reasonCode: WAGE_LOOKUP_REASON.UNAVAILABLE_DATASET_INACTIVE,
    });
  }

  const dataset = datasets[0];
  const occupation = await deps.store.loadOccupation(dataset.id, input.socCode);
  if (!occupation) {
    return toOfficialWageResponse({
      geography,
      wage: null,
      source: null,
      reasonCode: WAGE_LOOKUP_REASON.UNAVAILABLE_UNKNOWN_SOC,
    });
  }

  const area = await deps.store.loadArea(dataset.id, geography.resolvedArea.areaCode);
  if (!area) {
    return toOfficialWageResponse({
      geography,
      wage: null,
      source: null,
      reasonCode: WAGE_LOOKUP_REASON.UNAVAILABLE_UNKNOWN_AREA,
    });
  }

  const wage = await deps.store.loadWageRecord(dataset.id, area.areaCode, occupation.socCode);
  if (!wage) {
    return toOfficialWageResponse({
      geography,
      wage: null,
      source: null,
      reasonCode: WAGE_LOOKUP_REASON.UNAVAILABLE_NO_WAGE_RECORD,
    });
  }

  return toOfficialWageResponse({
    geography,
    wage: {
      soc_code: occupation.socCode,
      occupation_title: occupation.title,
      geo_level: wage.geoLevel,
      label: wage.label,
      level1: wage.level1,
      level2: wage.level2,
      level3: wage.level3,
      level4: wage.level4,
      average: wage.average,
    },
    source: {
      wage_year: dataset.wageYear,
      data_source: dataset.dataSource,
      bls_survey: dataset.blsSurvey,
      soc_version: dataset.socVersion,
      effective_start: dataset.effectiveStart,
      effective_end: dataset.effectiveEnd,
    },
    reasonCode: WAGE_LOOKUP_REASON.AUTO_OFFICIAL_WAGE,
  });
}
