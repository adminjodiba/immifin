import type { WorksiteGeographyApiResponse } from "@/lib/h1b/geo/api/worksiteGeographyApi.types";
import type { GeographyResolution } from "@/lib/h1b/geo/geographyResolution.types";

function mapCountyOption(option: GeographyResolution["choiceOptions"][number]) {
  return {
    county_fips: option.countyFips,
    county_display_name: option.countyDisplayName,
    state_display_name: option.stateDisplayName,
    area_name: option.areaName,
  };
}

/**
 * Product-facing adapter mapping. Does not classify geography.
 * Omits mapping internals, area_code, counts, and unmapped diagnostics.
 */
export function toWorksiteGeographyResponse(
  resolution: GeographyResolution,
): WorksiteGeographyApiResponse {
  return {
    outcome: resolution.outcome,
    reason_code: resolution.reasonCode,
    normalized_zip: resolution.zipNormalized,
    selected_county_fips: resolution.selectedCountyFips,
    resolved_area: resolution.resolvedArea
      ? {
          area_name: resolution.resolvedArea.areaName,
        }
      : null,
    choice_options: resolution.choiceOptions.map(mapCountyOption),
  };
}
