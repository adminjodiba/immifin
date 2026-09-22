import type { GeographyOutcome, GeographyReasonCode } from "@/lib/h1b/geo/geographyResolution.types";
import type { WorksiteGeographyApiCountyOption } from "@/lib/h1b/geo/api/worksiteGeographyApi.types";

export const OFLC_ALL_INDUSTRIES_DATA_SOURCE = "All Industries";

export const OFFICIAL_SOC_CODE_RE = /^\d{2}-\d{4}$/;

export const OFFICIAL_WAGE_LOOKUP_ALLOWED_BODY_KEYS = ["soc_code", "zip", "county_fips"] as const;

export const OFFICIAL_WAGE_LOOKUP_API_MAX_BODY_BYTES = 8_192;

export const WAGE_LOOKUP_REASON = {
  AUTO_OFFICIAL_WAGE: "AUTO_OFFICIAL_WAGE",
  UNAVAILABLE_UNKNOWN_SOC: "UNAVAILABLE_UNKNOWN_SOC",
  UNAVAILABLE_UNKNOWN_AREA: "UNAVAILABLE_UNKNOWN_AREA",
  UNAVAILABLE_NO_WAGE_RECORD: "UNAVAILABLE_NO_WAGE_RECORD",
  UNAVAILABLE_DATASET_INACTIVE: "UNAVAILABLE_DATASET_INACTIVE",
} as const;

export type WageLookupReasonCode =
  | (typeof WAGE_LOOKUP_REASON)[keyof typeof WAGE_LOOKUP_REASON]
  | GeographyReasonCode;

export type OfficialWageLookupRequest = {
  socCode: string;
  zip: string;
  countyFips?: string;
};

export type OfficialWageSourceMetadata = {
  wage_year: string;
  data_source: string;
  bls_survey: string | null;
  soc_version: string | null;
  effective_start: string;
  effective_end: string;
};

export type OfficialWageRecordView = {
  soc_code: string;
  occupation_title: string;
  geo_level: number;
  label: string | null;
  level1: number | null;
  level2: number | null;
  level3: number | null;
  level4: number | null;
  average: number | null;
};

export type OfficialWageLookupApiResponse = {
  outcome: GeographyOutcome;
  reason_code: WageLookupReasonCode;
  geography: {
    normalized_zip: string;
    selected_county_fips: string | null;
    resolved_area: { area_code: string; area_name: string } | null;
  };
  choice_options: WorksiteGeographyApiCountyOption[];
  wage: OfficialWageRecordView | null;
  source: OfficialWageSourceMetadata | null;
};

export type OfficialWageLookupApiErrorBody = {
  error: string;
};

export type ActiveAllIndustriesDataset = {
  id: string;
  wageYear: string;
  dataSource: string;
  blsSurvey: string | null;
  socVersion: string | null;
  effectiveStart: string;
  effectiveEnd: string;
};

export type OfficialOccupationRow = {
  socCode: string;
  title: string;
};

export type OfficialAreaRow = {
  areaCode: string;
  areaName: string;
};

export type OfficialWageRow = {
  socCode: string;
  geoLevel: number;
  label: string | null;
  level1: number | null;
  level2: number | null;
  level3: number | null;
  level4: number | null;
  average: number | null;
};

export type OfficialWageLookupStore = {
  loadActiveAllIndustriesDatasets(): Promise<ActiveAllIndustriesDataset[]>;
  loadOccupation(datasetId: string, socCode: string): Promise<OfficialOccupationRow | null>;
  loadArea(datasetId: string, areaCode: string): Promise<OfficialAreaRow | null>;
  loadWageRecord(
    datasetId: string,
    areaCode: string,
    socCode: string,
  ): Promise<OfficialWageRow | null>;
};
