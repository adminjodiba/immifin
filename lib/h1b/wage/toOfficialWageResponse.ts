import type { GeographyResolution } from "@/lib/h1b/geo/geographyResolution.types";
import type {
  OfficialWageLookupApiResponse,
  OfficialWagePublicApiResponse,
  OfficialWageRecordView,
  OfficialWageSourceMetadata,
  WageLookupReasonCode,
} from "@/lib/h1b/wage/officialWageLookup.types";

function mapChoiceOption(option: GeographyResolution["choiceOptions"][number]) {
  return {
    county_fips: option.countyFips,
    county_display_name: option.countyDisplayName,
    state_display_name: option.stateDisplayName,
    area_code: option.areaCode,
    area_name: option.areaName,
  };
}

export function toOfficialWageResponse(input: {
  geography: GeographyResolution;
  wage: OfficialWageRecordView | null;
  source: OfficialWageSourceMetadata | null;
  reasonCode: WageLookupReasonCode;
}): OfficialWageLookupApiResponse {
  const outcome = input.wage
    ? "AUTO"
    : input.geography.outcome === "CHOICE_REQUIRED"
      ? "CHOICE_REQUIRED"
      : "UNAVAILABLE";

  return {
    outcome,
    reason_code: input.reasonCode,
    geography: {
      normalized_zip: input.geography.zipNormalized,
      selected_county_fips: input.geography.selectedCountyFips,
      resolved_area: input.geography.resolvedArea
        ? {
            area_code: input.geography.resolvedArea.areaCode,
            area_name: input.geography.resolvedArea.areaName,
          }
        : null,
    },
    choice_options: input.geography.choiceOptions.map(mapChoiceOption),
    wage: input.wage,
    source: input.source,
  };
}

export function toOfficialWagePublicResponse(
  result: OfficialWageLookupApiResponse,
): OfficialWagePublicApiResponse {
  return {
    outcome: result.outcome,
    reason_code: result.reason_code,
    geography: {
      normalized_zip: result.geography.normalized_zip,
      selected_county_fips: result.geography.selected_county_fips,
      resolved_area: result.geography.resolved_area
        ? { area_name: result.geography.resolved_area.area_name }
        : null,
    },
    choice_options: result.choice_options.map((option) => ({
      county_fips: option.county_fips,
      county_display_name: option.county_display_name,
      state_display_name: option.state_display_name,
      area_name: option.area_name,
    })),
    wage: result.wage
      ? {
          soc_code: result.wage.soc_code,
          occupation_title: result.wage.occupation_title,
          label: result.wage.label,
          level1: result.wage.level1,
          level2: result.wage.level2,
          level3: result.wage.level3,
          level4: result.wage.level4,
          average: result.wage.average,
        }
      : null,
    source: result.source,
  };
}
