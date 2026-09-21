import type { WorksiteGeographyApiResponse } from "@/lib/h1b/geo/api/worksiteGeographyApi.types";
import type { GeographyResolution } from "@/lib/h1b/geo/geographyResolution.types";

function mapCountyOption(option: GeographyResolution["mappedCounties"][number]) {
  return {
    county_fips: option.countyFips,
    county_display_name: option.countyDisplayName,
    state_display_name: option.stateDisplayName,
    area_code: option.areaCode,
    area_name: option.areaName,
  };
}

/**
 * Product-facing adapter mapping. Does not classify geography.
 * Omits internal provenance (dataset UUIDs, package SHAs, contract internals).
 */
export function toWorksiteGeographyResponse(
  resolution: GeographyResolution,
): WorksiteGeographyApiResponse {
  return {
    outcome: resolution.outcome,
    reason_code: resolution.reasonCode,
    normalized_zip: resolution.zipNormalized,
    selected_county_fips: resolution.selectedCountyFips,
    official_county_count: resolution.officialCountyCount,
    mapped_county_count: resolution.mappedCountyCount,
    unmapped_county_count: resolution.unmappedCountyCount,
    distinct_area_count: resolution.distinctAreaCount,
    resolved_area: resolution.resolvedArea
      ? {
          area_code: resolution.resolvedArea.areaCode,
          area_name: resolution.resolvedArea.areaName,
        }
      : null,
    choice_options: resolution.choiceOptions.map(mapCountyOption),
    mapped_counties: resolution.mappedCounties.map(mapCountyOption),
    unmapped_official_counties: resolution.unmappedOfficialCounties.map((county) => ({
      county_fips: county.countyFips,
      unmapped_class: county.unmappedClass,
    })),
  };
}
