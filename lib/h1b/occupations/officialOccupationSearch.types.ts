export const OFFICIAL_OCCUPATION_SEARCH_LIMIT = 25;

export const OFFICIAL_OCCUPATION_SEARCH_MAX_QUERY_CHARS = 128;

/** Official 2018 SOC prefix: `15`, `15-`, `15-12`, or exact `15-1252`. */
export const OFFICIAL_SOC_SEARCH_PREFIX_RE = /^\d{2}(?:-\d{0,4})?$/;

export const OCCUPATION_SEARCH_REASON = {
  AUTO_OFFICIAL_OCCUPATIONS: "AUTO_OFFICIAL_OCCUPATIONS",
  UNAVAILABLE_DATASET_INACTIVE: "UNAVAILABLE_DATASET_INACTIVE",
} as const;

export type OccupationSearchReasonCode =
  (typeof OCCUPATION_SEARCH_REASON)[keyof typeof OCCUPATION_SEARCH_REASON];

export type OfficialOccupationSearchResult = {
  soc_code: string;
  title: string;
};

export type OfficialOccupationSearchDisplayResult = OfficialOccupationSearchResult & {
  group: string | null;
  common_job_titles: string[];
  typical_h1b: boolean;
  match_confidence: "High" | "Medium" | "Low" | null;
};

export type OfficialOccupationSearchResponse = {
  outcome: "AUTO" | "UNAVAILABLE";
  reason_code: OccupationSearchReasonCode;
  results: OfficialOccupationSearchResult[];
};

export type OfficialOccupationSearchDisplayResponse = {
  outcome: "AUTO" | "UNAVAILABLE";
  reason_code: OccupationSearchReasonCode;
  results: OfficialOccupationSearchDisplayResult[];
};

export type OfficialOccupationSearchApiErrorBody = {
  error: string;
};

export type OfficialOccupationRow = {
  socCode: string;
  title: string;
};

export type ActiveAllIndustriesDatasetRef = {
  id: string;
};

export type OfficialOccupationSearchStore = {
  loadActiveAllIndustriesDatasets(): Promise<ActiveAllIndustriesDatasetRef[]>;
  loadOccupations(datasetId: string): Promise<OfficialOccupationRow[]>;
};
