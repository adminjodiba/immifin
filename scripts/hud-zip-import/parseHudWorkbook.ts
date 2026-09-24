import { loadDelimited } from "../oflc-wage-import/csv";
import { foldLocalityName, loadGazetteerCounties } from "../oflc-wage-import/geography";
import { headerMatchesOfficial, type HudSheetRow } from "./xlsx";
import {
  EXPECTED_HUD_ZIP_COUNTY_Q2_2026,
  HUD_USPS_ZIP_COUNTY_SOURCE,
  type HudFixtureRow,
  type HudImportResult,
  type HudJoinValidation,
  type ImportIssue,
  type ZipCountyCrosswalkRecord,
  type ZipCrosswalkVersionRecord,
} from "./types";

const ZIP_RE = /^[0-9]{5}$/;
const FIPS_RE = /^[0-9]{5}$/;
const SHA256_RE = /^[0-9a-f]{64}$/;
const FIXTURE_ZIPS = ["77433", "77031", "76945", "00501", "00601", "07030"] as const;

export function versionIdFromSha(sha256: string): string {
  const h = sha256.toLowerCase().replace(/[^0-9a-f]/g, "").padEnd(32, "0");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function issue(severity: ImportIssue["severity"], code: string, message: string): ImportIssue {
  return { severity, code, message };
}

function normalizeCountyFips(raw: string): { fips: string | null; paddedFrom: string | null } {
  const trimmed = raw.trim();
  if (/^[0-9]{5}$/.test(trimmed)) return { fips: trimmed, paddedFrom: null };
  if (/^[0-9]{1,4}$/.test(trimmed)) return { fips: trimmed.padStart(5, "0"), paddedFrom: trimmed };
  return { fips: null, paddedFrom: null };
}

function officialRatio(raw: string, context: string, issues: ImportIssue[]): {
  value: number | null;
  raw: string | null;
} {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: null, raw: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    issues.push(issue("error", "invalid_ratio", `${context}: not a number (${trimmed})`));
    return { value: null, raw: trimmed };
  }
  if (value < 0 || value > 1) {
    issues.push(issue("error", "ratio_out_of_bounds", `${context}: ${trimmed} is outside 0–1`));
  }
  return { value, raw: trimmed };
}

export type ParseHudInput = {
  filename: string;
  packageSha256: string;
  header: string[];
  rows: HudSheetRow[];
  gazetteerText?: string | null;
  geographyCsv?: string | null;
  gazetteerVintage?: string | null;
  validateOfficialIdentity?: boolean;
  validateFixtures?: boolean;
};

export function parseHudZipCountyWorkbook(input: ParseHudInput): HudImportResult {
  const issues: ImportIssue[] = [];
  const sha = input.packageSha256.toLowerCase();
  if (!SHA256_RE.test(sha)) {
    issues.push(issue("error", "package_sha256", "Package SHA-256 is not a 64-character hex digest"));
  }
  if (input.validateOfficialIdentity !== false && input.filename !== EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename) {
    issues.push(
      issue(
        "error",
        "filename",
        `Expected ${EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename}, received ${input.filename}`
      )
    );
  }
  if (input.validateOfficialIdentity !== false && sha !== EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256) {
    issues.push(
      issue(
        "error",
        "sha256_mismatch",
        "Official HUD workbook SHA-256 does not match the 004A validated digest"
      )
    );
  }
  if (!headerMatchesOfficial(input.header)) {
    issues.push(
      issue(
        "error",
        "columns",
        `Expected columns ${EXPECTED_HUD_ZIP_COUNTY_Q2_2026.columns.join(", ")}; received ${input.header.join(", ")}`
      )
    );
  }

  const versionId = versionIdFromSha(sha);
  const records: ZipCountyCrosswalkRecord[] = [];
  const rawByZip = new Map<string, HudFixtureRow[]>();
  const keys = new Set<string>();
  const zips = new Set<string>();
  const fipsSet = new Set<string>();
  const countiesByZip = new Map<string, ZipCountyCrosswalkRecord[]>();
  const placeholderGeoids = new Set<string>();
  let zeroBus = 0;
  let duplicateSourceKeys = 0;
  let malformedZips = 0;
  let placeholderGeoidRows = 0;

  for (const [index, row] of input.rows.entries()) {
    const context = `row ${index + 2}`;
    const zip = row.zip;
    const fipsNorm = normalizeCountyFips(row.geoid);
    const county_fips = fipsNorm.fips ?? row.geoid;
    if (!ZIP_RE.test(zip)) {
      malformedZips += 1;
      issues.push(issue("error", "malformed_zip", `${context}: ZIP is not 5-digit TEXT (${zip})`));
    }
    if (!fipsNorm.fips || !FIPS_RE.test(fipsNorm.fips)) {
      issues.push(
        issue("error", "malformed_fips", `${context}: county FIPS is not 5-digit TEXT (${row.geoid})`)
      );
    } else if (fipsNorm.paddedFrom) {
      placeholderGeoidRows += 1;
      placeholderGeoids.add(fipsNorm.fips);
      issues.push(
        issue(
          "warning",
          "fips_padded",
          `${context}: official geoid ${fipsNorm.paddedFrom} stored as 5-character FIPS ${fipsNorm.fips}`
        )
      );
    }
    const key = `${zip}|${county_fips}`;
    if (keys.has(key)) {
      duplicateSourceKeys += 1;
      issues.push(issue("error", "duplicate_key", `Duplicate (${zip}, ${county_fips})`));
      continue;
    }
    keys.add(key);

    const res = officialRatio(row.res_ratio, `${context} res_ratio`, issues);
    const bus = officialRatio(row.bus_ratio, `${context} bus_ratio`, issues);
    const oth = officialRatio(row.oth_ratio, `${context} oth_ratio`, issues);
    const tot = officialRatio(row.tot_ratio, `${context} tot_ratio`, issues);
    if (bus.value === 0) zeroBus += 1;

    const record: ZipCountyCrosswalkRecord = {
      crosswalk_version: versionId,
      zip,
      county_fips,
      res_ratio: res.value,
      bus_ratio: bus.value,
      oth_ratio: oth.value,
      tot_ratio: tot.value,
      pref_city: row.city ? row.city : null,
      pref_state: row.state ? row.state : null,
      source: HUD_USPS_ZIP_COUNTY_SOURCE,
      hud_year: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.hudYear,
      hud_quarter: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.hudQuarter,
    };
    records.push(record);
    zips.add(zip);
    fipsSet.add(county_fips);
    if (!countiesByZip.has(zip)) countiesByZip.set(zip, []);
    countiesByZip.get(zip)!.push(record);

    const fixture: HudFixtureRow = {
      zip,
      county_fips,
      city: record.pref_city,
      state: record.pref_state,
      res_ratio: res.raw,
      bus_ratio: bus.raw,
      oth_ratio: oth.raw,
      tot_ratio: tot.raw,
    };
    if (!rawByZip.has(zip)) rawByZip.set(zip, []);
    rawByZip.get(zip)!.push(fixture);
  }

  let multiCountyZips = 0;
  let maxCountiesPerZip = 0;
  let busResPrimaryDiffer = 0;
  for (const [zip, group] of countiesByZip) {
    if (group.length > 1) multiCountyZips += 1;
    if (group.length > maxCountiesPerZip) maxCountiesPerZip = group.length;
    if (group.length < 2) continue;
    const busPrimary = group.reduce((a, b) => ((a.bus_ratio ?? -1) >= (b.bus_ratio ?? -1) ? a : b));
    const resPrimary = group.reduce((a, b) => ((a.res_ratio ?? -1) >= (b.res_ratio ?? -1) ? a : b));
    if (busPrimary.county_fips !== resPrimary.county_fips) busResPrimaryDiffer += 1;
    void zip;
  }

  const fixtures: Record<string, HudFixtureRow[]> = {};
  for (const zip of FIXTURE_ZIPS) {
    fixtures[zip] = rawByZip.get(zip) ?? [];
    if (input.validateFixtures !== false && fixtures[zip].length === 0) {
      issues.push(issue("error", "fixture_missing", `Official HUD file has no rows for ZIP ${zip}`));
    }
  }

  const leadingZeroFixtures: Record<string, { zip: string; preserved: boolean }> = {};
  for (const zip of ["00501", "00601", "07030"] as const) {
    const rows = fixtures[zip] ?? [];
    leadingZeroFixtures[zip] = {
      zip,
      preserved: rows.length > 0 && rows.every((r) => r.zip === zip && r.zip.startsWith("0")),
    };
    if (input.validateFixtures !== false && !leadingZeroFixtures[zip].preserved) {
      issues.push(issue("error", "leading_zero", `Leading zero was not preserved for ZIP ${zip}`));
    }
  }

  const join = buildJoinValidation(fipsSet, input.gazetteerText ?? null, input.geographyCsv ?? null, issues);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const version: ZipCrosswalkVersionRecord = {
    id: versionId,
    hud_year: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.hudYear,
    hud_quarter: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.hudQuarter,
    census_gazetteer_vintage: input.gazetteerVintage ?? null,
    package_sha256: sha,
    status: errorCount > 0 ? "failed" : "imported",
    imported_at: null,
    unmatched_locality_count: join ? join.notJoined : null,
    validation_report: {
      dry_run: true,
      database_write: false,
      resolution_policy: "none",
      error_count: errorCount,
      warning_count: issues.filter((i) => i.severity === "warning").length,
      rows: records.length,
      unique_zips: zips.size,
      unique_county_fips: fipsSet.size,
      multi_county_zips: multiCountyZips,
      max_counties_per_zip: maxCountiesPerZip,
      zero_bus_ratio_rows: zeroBus,
      bus_res_primary_differ: busResPrimaryDiffer,
      duplicate_source_keys: duplicateSourceKeys,
      malformed_zips: malformedZips,
      placeholder_geoid_rows: placeholderGeoidRows,
    },
  };

  return {
    ok: errorCount === 0,
    version,
    rows: records,
    issues,
    counts: {
      rows: records.length,
      uniqueZips: zips.size,
      uniqueCountyFips: fipsSet.size,
      multiCountyZips,
      maxCountiesPerZip,
      zeroBusRatioRows: zeroBus,
      busResPrimaryDiffer,
      duplicateSourceKeys,
      malformedZips,
      placeholderGeoidRows,
      placeholderGeoids: [...placeholderGeoids].sort(),
    },
    fixtures,
    leadingZeroFixtures,
    join,
  };
}

function buildJoinValidation(
  hudFips: Set<string>,
  gazetteerText: string | null,
  geographyCsv: string | null,
  issues: ImportIssue[]
): HudJoinValidation | null {
  if (!gazetteerText || !geographyCsv) return null;

  const gaz = loadGazetteerCounties(gazetteerText);
  const gazByFips = new Map(gaz.map((g) => [g.county_fips, g]));
  const oflcNames = new Set<string>();
  for (const row of loadDelimited(geographyCsv).rows) {
    oflcNames.add(`${row.StateAb}|${foldLocalityName(row.CountyTownName)}`);
  }

  let joined = 0;
  let territoryGuVi = 0;
  const notJoinedFips: string[] = [];
  const notJoinedByPrefix: Record<string, number> = {};

  for (const fips of hudFips) {
    const prefix = fips.slice(0, 2);
    if (prefix === "66" || prefix === "78") {
      territoryGuVi += 1;
      joined += 1;
      continue;
    }
    const gazRec = gazByFips.get(fips);
    if (gazRec && oflcNames.has(`${gazRec.state_ab}|${foldLocalityName(gazRec.name)}`)) {
      joined += 1;
      continue;
    }
    notJoinedFips.push(fips);
    notJoinedByPrefix[prefix] = (notJoinedByPrefix[prefix] || 0) + 1;
  }

  notJoinedFips.sort();
  if (notJoinedFips.length > 0) {
    issues.push(
      issue(
        "warning",
        "hud_fips_not_in_oflc",
        `${notJoinedFips.length} HUD county FIPS values do not join OFLC geography (territory/placeholder cases expected)`
      )
    );
  }

  return {
    uniqueHudFips: hudFips.size,
    joined,
    territoryGuVi,
    notJoined: notJoinedFips.length,
    notJoinedFips,
    notJoinedByPrefix,
  };
}

export function assertHudSchemaShape(result: HudImportResult): string[] {
  const errors: string[] = [];
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/.test(result.version.id)) {
    errors.push("zip_crosswalk_versions.id is not a UUID-shaped placeholder");
  }
  if (result.version.hud_year !== 2026 || result.version.hud_quarter !== 2) {
    errors.push("version hud_year/hud_quarter must be 2026 Q2");
  }
  if (result.version.status === "active") {
    errors.push("dry-run must not mark the crosswalk active");
  }
  for (const row of result.rows) {
    if (typeof row.zip !== "string" || typeof row.county_fips !== "string") {
      errors.push("zip and county_fips must remain TEXT");
      break;
    }
    if (row.source !== HUD_USPS_ZIP_COUNTY_SOURCE) {
      errors.push("source must be HUD USPS ZIP-County");
      break;
    }
    if ("oflc_area" in row || "resolution" in row || "user_wage_level" in row) {
      errors.push("runtime resolution fields are not allowed on import rows");
      break;
    }
  }
  return errors;
}
