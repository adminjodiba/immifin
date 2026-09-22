import type { GeographyResolution } from "@/lib/h1b/geo/geographyResolution.types";
import type {
  OfficialWageLookupApiResponse,
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
