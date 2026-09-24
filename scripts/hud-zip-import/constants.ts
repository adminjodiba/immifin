/**
 * Official HUD USPS ZIP–County 2026 Q2 load constants.
 * Dev writes and gated Production writes. This module never opens a database connection.
 */

import { EXPECTED_HUD_ZIP_COUNTY_Q2_2026 } from "./types";

export const EXPECTED_HUD_PACKAGE_SHA256 = EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256;

export const EXPECTED_HUD_COUNTS = {
  rows: 54570,
  uniqueZips: 39484,
  uniqueCountyFips: 3234,
  duplicateSourceKeys: 0,
  malformedZips: 0,
  zeroBusRatioRows: 10236,
  multiCountyZips: 11379,
  maxCountiesPerZip: 7,
  busResPrimaryDiffer: 539,
  placeholderGeoidRows: 9,
} as const;

export const EXPECTED_PLACEHOLDER_GEOIDS = [
  "00048",
  "00060",
  "00064",
  "00068",
  "00070",
] as const;

/** Conservative crosswalk INSERT size. OFLC 2000-row wages were ~270KB; HUD rows are wider. */
export const HUD_CROSSWALK_BATCH_SIZE = 1000;

export const HUD_LOAD_TABLES = ["zip_crosswalk_versions", "zip_county_crosswalk"] as const;

export const HUD_FORBIDDEN_TABLES = [
  "county_fips_names",
  "wage_datasets",
  "oflc_occupations",
  "oflc_areas",
  "oflc_area_localities",
  "oflc_wage_records",
] as const;

export const EXPECTED_OFLC_DEV_COUNTS = {
  wage_datasets: 1,
  oflc_occupations: 848,
  oflc_areas: 530,
  oflc_area_localities: 3275,
  oflc_wage_records: 449440,
} as const;
