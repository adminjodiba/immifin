/**
 * Official OFLC 2026–27 All Industries load constants.
 * Dev-only future writes. This module never opens a database connection.
 */

export const IMMIFIN_DEV_PROJECT_REF = {
  prefix: "vnhn",
  suffix: "toxs",
  mask: "vnhn...toxs",
} as const;

export const IMMIFIN_PROD_PROJECT_REF = {
  prefix: "pmkx",
  suffix: "ysdv",
  mask: "pmkx...ysdv",
} as const;

export const IMMIFIN_DEV_PROJECT_NAME = "immifin Dev";
export const IMMIFIN_PROD_PROJECT_NAME = "immifin production";

export const EXPECTED_OFFICIAL_PACKAGE_SHA256 =
  "edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f";

export const EXPECTED_OFFICIAL_COUNTS = {
  occupations: 848,
  areas: 530,
  localities: 3275,
  wage_records: 449440,
} as const;

export const EXPECTED_OFFICIAL_LABELS = {
  blank: 410620,
  annual_wage: 32299,
  high_wage: 5866,
  no_leveled_wage: 655,
  other: 0,
} as const;

export const EXPECTED_OFFICIAL_GEOGRAPHY = {
  resolved: 3222,
  nullGuVi: 53,
  unmatched: 0,
} as const;

/** Wage-record insert batch size for the future Dev write. */
export const WAGE_RECORD_BATCH_SIZE = 2000;

export const H1B_OFLC_TABLES = [
  "wage_datasets",
  "oflc_occupations",
  "oflc_areas",
  "oflc_area_localities",
  "oflc_wage_records",
] as const;

export const H1B_HUD_TABLES = [
  "zip_crosswalk_versions",
  "zip_county_crosswalk",
] as const;

export const H1B_ALL_TABLES = [
  ...H1B_OFLC_TABLES,
  "county_fips_names",
  ...H1B_HUD_TABLES,
] as const;

export const FUTURE_LOAD_ORDER = [
  "wage_datasets",
  "oflc_occupations",
  "oflc_areas",
  "oflc_area_localities",
  "oflc_wage_records",
] as const;
