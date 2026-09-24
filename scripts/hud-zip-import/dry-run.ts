/**
 * Offline HUD USPS ZIP–County dry-run.
 * Parses the official workbook into 003A-shaped records.
 * Does not connect to Supabase, write rows, or apply ZIP resolution policy.
 *
 * Usage:
 *   npx tsx scripts/hud-zip-import/dry-run.ts
 *   npm run hud:import:dry-run
 */
import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { EXPECTED_HUD_ZIP_COUNTY_Q2_2026 } from "./types";
import { assertHudSchemaShape, parseHudZipCountyWorkbook } from "./parseHudWorkbook";
import {
  DEFAULT_GAZETTEER,
  DEFAULT_GEOGRAPHY,
  DEFAULT_HUD_WORKBOOK,
  loadOfficialHudSheet,
  sha256File,
} from "./workbook";

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

function formatFixture(rows: { county_fips: string; city: string | null; state: string | null; res_ratio: string | null; bus_ratio: string | null; oth_ratio: string | null; tot_ratio: string | null }[]): void {
  for (const row of rows) {
    console.log(
      `    ${row.county_fips} ${row.city ?? ""} ${row.state ?? ""} RES=${row.res_ratio} BUS=${row.bus_ratio} OTH=${row.oth_ratio} TOT=${row.tot_ratio}`
    );
  }
}

function main(): void {
  const workbookPath = argValue("--workbook") ?? process.env.HUD_ZIP_COUNTY_XLSX ?? DEFAULT_HUD_WORKBOOK;
  const gazetteerPath = argValue("--gazetteer") ?? process.env.OFLC_CENSUS_GAZETTEER ?? DEFAULT_GAZETTEER;
  const geographyPath = argValue("--geography") ?? process.env.OFLC_GEOGRAPHY_CSV ?? DEFAULT_GEOGRAPHY;

  if (!existsSync(workbookPath)) {
    console.error("STOP: official HUD workbook is not available.");
    console.error(`Needed file: ${EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename}`);
    console.error(`Looked at: ${workbookPath}`);
    process.exit(2);
  }

  const filename = basename(workbookPath);
  const packageSha256 = sha256File(workbookPath);
  console.log("HUD USPS ZIP–County dry-run — no database connection, no writes, no resolution policy.");
  console.log(`workbook: ${workbookPath}`);
  console.log(`sha256: ${packageSha256}`);

  if (packageSha256 !== EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256) {
    console.error("STOP: SHA-256 does not match the 004A validated digest.");
    console.error(`expected: ${EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256}`);
    console.error(`actual:   ${packageSha256}`);
    process.exit(2);
  }
  if (filename !== EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename) {
    console.error(`STOP: expected filename ${EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename}`);
    process.exit(2);
  }

  const sheet = loadOfficialHudSheet(workbookPath, packageSha256);
  const result = parseHudZipCountyWorkbook({
    filename,
    packageSha256,
    header: sheet.header,
    rows: sheet.rows,
    gazetteerText: existsSync(gazetteerPath) ? readFileSync(gazetteerPath, "utf8") : null,
    geographyCsv: existsSync(geographyPath) ? readFileSync(geographyPath, "utf8") : null,
    gazetteerVintage: existsSync(gazetteerPath) ? "2026" : null,
  });

  const shapeErrors = assertHudSchemaShape(result);
  for (const msg of shapeErrors) {
    result.issues.push({ severity: "error", code: "schema_shape", message: msg });
    result.ok = false;
  }

  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  console.log("");
  console.log("Workbook");
  console.log(`  filename: ${filename}`);
  console.log(`  dimension: ${sheet.dimension ?? "n/a"}`);
  console.log(`  columns: ${sheet.header.join(", ")}`);
  console.log("Version");
  console.log(`  id: ${result.version.id}`);
  console.log(`  hud_year/quarter: ${result.version.hud_year} Q${result.version.hud_quarter}`);
  console.log(`  status: ${result.version.status}`);
  console.log("Counts");
  console.log(`  rows: ${result.counts.rows}`);
  console.log(`  unique ZIPs: ${result.counts.uniqueZips}`);
  console.log(`  unique county FIPS: ${result.counts.uniqueCountyFips}`);
  console.log(`  duplicate source keys: ${result.counts.duplicateSourceKeys}`);
  console.log(`  malformed ZIPs: ${result.counts.malformedZips}`);
  console.log(`  multi-county ZIPs: ${result.counts.multiCountyZips}`);
  console.log(`  max counties/ZIP: ${result.counts.maxCountiesPerZip}`);
  console.log(`  zero BUS_RATIO rows: ${result.counts.zeroBusRatioRows}`);
  console.log(`  BUS vs RES primary county differs: ${result.counts.busResPrimaryDiffer}`);
  console.log(`  placeholder GEOID rows: ${result.counts.placeholderGeoidRows}`);
  console.log(`  placeholder GEOIDs: ${result.counts.placeholderGeoids.join(", ") || "(none)"}`);
  console.log("Fixtures (all official county rows)");
  for (const zip of ["77433", "77031", "76945", "00501"]) {
    console.log(`  ${zip} (${result.fixtures[zip].length} row(s))`);
    formatFixture(result.fixtures[zip]);
  }
  console.log("Leading zeros");
  for (const zip of ["00501", "00601", "07030"]) {
    console.log(`  ${zip}: ${result.leadingZeroFixtures[zip]?.preserved ? "PRESERVED" : "FAIL"}`);
  }
  if (result.join) {
    console.log("HUD FIPS → OFLC geography join (validation only)");
    console.log(`  unique HUD FIPS: ${result.join.uniqueHudFips}`);
    console.log(`  joined including GU/VI rule: ${result.join.joined}`);
    console.log(`  GU/VI FIPS: ${result.join.territoryGuVi}`);
    console.log(`  not joined: ${result.join.notJoined}`);
    console.log(`  not-joined prefixes: ${JSON.stringify(result.join.notJoinedByPrefix)}`);
    if (result.join.notJoinedFips.length) {
      console.log(`  not-joined FIPS: ${result.join.notJoinedFips.join(", ")}`);
    }
  }
  console.log("Validation");
  console.log(`  errors: ${errors.length}`);
  console.log(`  warnings: ${warnings.length}`);
  for (const item of errors.slice(0, 20)) {
    console.log(`  ERROR ${item.code}: ${item.message}`);
  }
  for (const item of warnings.slice(0, 10)) {
    console.log(`  WARN ${item.code}: ${item.message}`);
  }
  console.log("");
  console.log(result.ok ? "DRY-RUN PASS" : "DRY-RUN FAIL");
  process.exit(result.ok ? 0 : 1);
}

main();
