import type { ApprovedGeographyDatasetPair } from "@/lib/h1b/geo/approvedGeographyDatasetPair";
import type { GeographyDatasetReasonCode } from "@/lib/h1b/geo/approvedGeographyDatasetPair";

export const GEOGRAPHY_CONTRACT_ID = "GEO-RESOLUTION-DESIGN-002";
export const GEOGRAPHY_PRODUCT_DECISION_ID = "GEO-RESOLUTION-DECISION-001";
export const GEOGRAPHY_RESOLUTION_POLICY = "SCENARIO_A_ALL_OFFICIAL_HUD_ROWS";

export const GEOGRAPHY_REASON = {
  AUTO_SINGLE_AREA: "AUTO_SINGLE_AREA",
  CHOICE_MULTIPLE_AREAS: "CHOICE_MULTIPLE_AREAS",
  INVALID_ZIP: "INVALID_ZIP",
  INVALID_COUNTY_FIPS: "INVALID_COUNTY_FIPS",
  INVALID_COUNTY_FOR_ZIP: "INVALID_COUNTY_FOR_ZIP",
  UNAVAILABLE_NO_HUD_ZIP: "UNAVAILABLE_NO_HUD_ZIP",
  UNAVAILABLE_NO_MAPPED_COUNTY: "UNAVAILABLE_NO_MAPPED_COUNTY",
  UNAVAILABLE_PLACEHOLDER_GEOID: "UNAVAILABLE_PLACEHOLDER_GEOID",
  UNAVAILABLE_TERRITORY_UNJOINED: "UNAVAILABLE_TERRITORY_UNJOINED",
  COUNTY_UNMAPPED: "COUNTY_UNMAPPED",
  PARTIAL_OFFICIAL_COUNTY_UNMAPPED: "PARTIAL_OFFICIAL_COUNTY_UNMAPPED",
  UNAVAILABLE_DATASET_INACTIVE: "UNAVAILABLE_DATASET_INACTIVE",
  UNAVAILABLE_DATASET_INCOMPATIBLE: "UNAVAILABLE_DATASET_INCOMPATIBLE",
} as const;

export type GeographyReasonCode =
  | (typeof GEOGRAPHY_REASON)[keyof typeof GEOGRAPHY_REASON]
  | GeographyDatasetReasonCode;

export type GeographyOutcome = "AUTO" | "CHOICE_REQUIRED" | "UNAVAILABLE";

export type UnmappedCountyClass = "placeholder_geoid" | "territory_unjoined" | "missing_oflc_fips";

export type OfficialHudCountyRow = {
  countyFips: string;
  prefState: string | null;
};

export type OflcCountyMapping = {
  countyFips: string;
  countyTownName: string;
  stateAb: string;
  stateName: string;
  areaCode: string;
  areaName: string;
};

export type CountyOption = {
  countyFips: string;
  countyDisplayName: string;
  stateAb: string;
  stateDisplayName: string;
  areaCode: string;
  areaName: string;
};

export type UnmappedCounty = {
  countyFips: string;
  hudPrefState: string | null;
  unmappedClass: UnmappedCountyClass;
};

export type ResolvedArea = {
  areaCode: string;
  areaName: string;
};

export type ResolutionProvenance = {
  contractId: typeof GEOGRAPHY_CONTRACT_ID;
  productDecisionId: typeof GEOGRAPHY_PRODUCT_DECISION_ID;
  resolutionPolicy: typeof GEOGRAPHY_RESOLUTION_POLICY;
  hudCrosswalkVersionId: string | null;
  hudYear: number | null;
  hudQuarter: number | null;
  hudPackageSha256: string | null;
  oflcDatasetId: string | null;
  oflcWageYear: string | null;
  oflcPackageSha256: string | null;
  compatibilityPolicy: ApprovedGeographyDatasetPair | null;
  zipNormalized: string;
};

export type GeographyResolution = {
  outcome: GeographyOutcome;
  reasonCode: GeographyReasonCode;
  zipRaw: string;
  zipNormalized: string;
  selectedCountyFips: string | null;
  officialCountyCount: number;
  mappedCountyCount: number;
  unmappedCountyCount: number;
  distinctAreaCount: number;
  mappedCounties: CountyOption[];
  unmappedOfficialCounties: UnmappedCounty[];
  resolvedArea: ResolvedArea | null;
  choiceOptions: CountyOption[];
  provenance: ResolutionProvenance;
};

export type ResolveGeographyInput = {
  zip: unknown;
  countyFips?: unknown;
  /** Ignored. Client area_code is never geographic authority. */
  areaCode?: unknown;
};
