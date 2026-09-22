import type { GeographyOutcome, GeographyReasonCode } from "@/lib/h1b/geo/geographyResolution.types";

export const WORKSITE_GEOGRAPHY_API_MAX_BODY_BYTES = 8_192;

export const WORKSITE_GEOGRAPHY_ALLOWED_BODY_KEYS = ["zip", "county_fips"] as const;

export type WorksiteGeographyApiRequest = {
  zip: string;
  countyFips?: string;
};

export type WorksiteGeographyApiCountyOption = {
  county_fips: string;
  county_display_name: string;
  state_display_name: string;
  area_name: string;
};

export type WorksiteGeographyApiResolvedArea = {
  area_name: string;
};

export type WorksiteGeographyApiResponse = {
  outcome: GeographyOutcome;
  reason_code: GeographyReasonCode;
  normalized_zip: string;
  selected_county_fips: string | null;
  resolved_area: WorksiteGeographyApiResolvedArea | null;
  choice_options: WorksiteGeographyApiCountyOption[];
};

export type WorksiteGeographyApiErrorBody = {
  error: string;
};
