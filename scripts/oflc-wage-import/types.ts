/**
 * Logical 003A schema shapes for offline OFLC All Industries import.
 * This module never connects to a database.
 */

export const OFLC_ALL_INDUSTRIES_DATA_SOURCE = "All Industries";

export const EXPECTED_OFLC_2026_27 = {
  packageFilename: "OFLC_Wages_2026-27.zip",
  wageYear: "2026-27",
  effectiveStart: "2026-07-01",
  effectiveEnd: "2027-06-30",
  blsSurvey: "BLS May 2025 OEWS",
  socVersion: "2018 SOC",
  dataSource: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
} as const;

export type DatasetLifecycleStatus =
  | "imported"
  | "active"
  | "archived"
  | "failed";

export type WageDatasetRecord = {
  id: string;
  wage_year: string;
  effective_start: string;
  effective_end: string;
  data_source: string;
  package_filename: string;
  package_sha256: string;
  source_url: string | null;
  bls_survey: string;
  soc_version: string;
  status: DatasetLifecycleStatus;
  imported_at: string | null;
  activated_at: string | null;
  activated_by_clerk_user_id: string | null;
  row_counts: {
    occupations: number;
    areas: number;
    localities: number;
    wage_records: number;
  };
  validation_report: Record<string, unknown>;
  notes: string | null;
};

export type OflcOccupationRecord = {
  dataset_id: string;
  soc_code: string;
  title: string;
  description: string | null;
};

export type OflcAreaRecord = {
  dataset_id: string;
  area_code: string;
  area_name: string;
};

export type OflcAreaLocalityRecord = {
  dataset_id: string;
  area_code: string;
  state_ab: string;
  state_name: string;
  county_town_name: string;
  county_fips: string | null;
};

export type OflcWageRecord = {
  dataset_id: string;
  data_source: string;
  area_code: string;
  soc_code: string;
  geo_level: number;
  level1: number | null;
  level2: number | null;
  level3: number | null;
  level4: number | null;
  average: number | null;
  label: string | null;
};

export type OfficialLabelClass =
  | "blank"
  | "annual_wage"
  | "high_wage"
  | "no_leveled_wage"
  | "other";

export type WageFixtureCheck = {
  name: string;
  soc_code: string;
  area_code: string;
  expected: [string, string, string, string];
  actual: [string | null, string | null, string | null, string | null] | null;
  ok: boolean;
};

export type ImportIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export type OflcImportResult = {
  ok: boolean;
  dataset: WageDatasetRecord;
  occupations: OflcOccupationRecord[];
  areas: OflcAreaRecord[];
  localities: OflcAreaLocalityRecord[];
  wageRecords: OflcWageRecord[];
  labelDistribution: Record<string, number>;
  otherLabels: string[];
  fixtures: WageFixtureCheck[];
  issues: ImportIssue[];
  fipsResolution: {
    resolved: number;
    nullGuVi: number;
    unmatched: number;
    unmatchedSamples: string[];
  };
};
