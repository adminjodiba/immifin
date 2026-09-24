/**
 * Logical 003A schema shapes for offline HUD USPS ZIP–County import.
 * This module never connects to a database and never applies ZIP resolution policy.
 */

export const HUD_USPS_ZIP_COUNTY_SOURCE = "HUD USPS ZIP-County";

export const EXPECTED_HUD_ZIP_COUNTY_Q2_2026 = {
  filename: "ZIP-COUNTY_062026.xlsx",
  sha256: "1175d0496ea66ec6a571ce47adb63502ef8485b20e8f1ded635ea0ff351f5627",
  hudYear: 2026,
  hudQuarter: 2,
  columns: [
    "zip",
    "geoid",
    "city",
    "state",
    "res_ratio",
    "bus_ratio",
    "oth_ratio",
    "tot_ratio",
  ] as const,
  source: HUD_USPS_ZIP_COUNTY_SOURCE,
} as const;

export type DatasetLifecycleStatus =
  | "imported"
  | "active"
  | "archived"
  | "failed";

export type ZipCrosswalkVersionRecord = {
  id: string;
  hud_year: number;
  hud_quarter: number;
  census_gazetteer_vintage: string | null;
  package_sha256: string;
  status: DatasetLifecycleStatus;
  imported_at: string | null;
  unmatched_locality_count: number | null;
  validation_report: Record<string, unknown>;
};

export type ZipCountyCrosswalkRecord = {
  crosswalk_version: string;
  zip: string;
  county_fips: string;
  res_ratio: number | null;
  bus_ratio: number | null;
  oth_ratio: number | null;
  tot_ratio: number | null;
  pref_city: string | null;
  pref_state: string | null;
  source: string;
  hud_year: number;
  hud_quarter: number;
};

export type ImportIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export type HudFixtureRow = {
  zip: string;
  county_fips: string;
  city: string | null;
  state: string | null;
  res_ratio: string | null;
  bus_ratio: string | null;
  oth_ratio: string | null;
  tot_ratio: string | null;
};

export type HudJoinValidation = {
  uniqueHudFips: number;
  joined: number;
  territoryGuVi: number;
  notJoined: number;
  notJoinedFips: string[];
  notJoinedByPrefix: Record<string, number>;
};

export type HudImportResult = {
  ok: boolean;
  version: ZipCrosswalkVersionRecord;
  rows: ZipCountyCrosswalkRecord[];
  issues: ImportIssue[];
  counts: {
    rows: number;
    uniqueZips: number;
    uniqueCountyFips: number;
    multiCountyZips: number;
    maxCountiesPerZip: number;
    zeroBusRatioRows: number;
    busResPrimaryDiffer: number;
    duplicateSourceKeys: number;
    malformedZips: number;
    placeholderGeoidRows: number;
    placeholderGeoids: string[];
  };
  fixtures: Record<string, HudFixtureRow[]>;
  leadingZeroFixtures: Record<string, { zip: string; preserved: boolean }>;
  join: HudJoinValidation | null;
};
