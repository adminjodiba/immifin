/**
 * Offline OFLC All Industries dry-run.
 * Parses official files and validates 003A-shaped records.
 * Does not connect to Supabase or write any database rows.
 *
 * Usage:
 *   npx tsx scripts/oflc-wage-import/dry-run.ts
 *   npx tsx scripts/oflc-wage-import/dry-run.ts --package <zip> --gazetteer <txt>
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { parseOflcAllIndustriesPackage, assertSchemaShape } from "./parseOflcPackage";
import { EXPECTED_OFLC_2026_27 } from "./types";

const DEFAULT_PACKAGE =
  "C:/Users/Admin/AppData/Local/Temp/immifin-oflc-research-2026/OFLC_Wages_2026-27.zip";
const DEFAULT_EXTRACTED =
  "C:/Users/Admin/AppData/Local/Temp/immifin-oflc-research-2026/extracted";
const DEFAULT_GAZETTEER =
  "C:/Users/Admin/AppData/Local/Temp/immifin-geo-proof-2026/census-gaz/2026_Gaz_counties_national.txt";
const DEFAULT_NOTES =
  "C:/Users/Admin/AppData/Local/Temp/immifin-oflc-research-2026/notes-2026.txt";

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function findExtractedFile(dir: string, name: string): string | null {
  const direct = join(dir, name);
  if (existsSync(direct)) return direct;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const nested = findExtractedFile(join(dir, entry.name), name);
    if (nested) return nested;
  }
  return null;
}

function extractZip(zipPath: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force`,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Failed to extract official OFLC zip");
  }
}

function loadNotes(notesPath: string | undefined, extractedDir: string): string | null {
  if (notesPath && existsSync(notesPath)) {
    return readFileSync(notesPath, "utf8");
  }
  const pdf = findExtractedFile(extractedDir, "FINAL-OEWS-Technical-Release-Notes-for-July-2026-Wage-Year.pdf");
  if (pdf) {
    return readFileSync(pdf, "latin1");
  }
  return null;
}

function main(): void {
  const packagePath = argValue("--package") ?? process.env.OFLC_WAGES_PACKAGE ?? DEFAULT_PACKAGE;
  const extractedArg = argValue("--extracted") ?? process.env.OFLC_WAGES_EXTRACTED;
  const gazetteerPath =
    argValue("--gazetteer") ?? process.env.OFLC_CENSUS_GAZETTEER ?? DEFAULT_GAZETTEER;
  const notesArg = argValue("--notes") ?? process.env.OFLC_WAGES_NOTES ?? DEFAULT_NOTES;

  if (!existsSync(packagePath)) {
    console.error("STOP: official OFLC package is not available locally.");
    console.error(`Needed file: ${EXPECTED_OFLC_2026_27.packageFilename}`);
    console.error(`Looked at: ${packagePath}`);
    console.error("Place the official FLAG package at that path or pass --package. Do not use an unofficial download.");
    process.exit(2);
  }
  if (!existsSync(gazetteerPath)) {
    console.error("STOP: official Census Gazetteer used by H1BWAGE-004 is not available locally.");
    console.error(`Looked at: ${gazetteerPath}`);
    process.exit(2);
  }

  const packageFilename = basename(packagePath);
  const packageSha256 = sha256File(packagePath);
  console.log("OFLC All Industries dry-run — no database connection, no writes.");
  console.log(`package: ${packagePath}`);
  console.log(`sha256: ${packageSha256}`);

  let extractedDir = extractedArg;
  if (!extractedDir) {
    const known = DEFAULT_EXTRACTED;
    const knownAlc = join(known, "ALC_Export.csv");
    extractedDir = existsSync(knownAlc)
      ? known
      : join(tmpdir(), `immifin-oflc-import-${packageSha256.slice(0, 16)}`);
  }
  if (!existsSync(join(extractedDir, "ALC_Export.csv"))) {
    if (!existsSync(extractedDir) || readdirSync(extractedDir).length === 0) {
      extractZip(packagePath, extractedDir);
    }
  }

  const occPath = findExtractedFile(extractedDir, "oes_soc_occs.csv");
  const geoPath = findExtractedFile(extractedDir, "Geography.csv");
  const alcPath = findExtractedFile(extractedDir, "ALC_Export.csv");
  if (!occPath || !geoPath || !alcPath) {
    console.error("STOP: official package is missing ALC_Export.csv, Geography.csv, or oes_soc_occs.csv.");
    process.exit(2);
  }

  const edcPath = findExtractedFile(extractedDir, "EDC_Export.csv");
  if (edcPath) {
    console.log(`EDC present (${statSync(edcPath).size} bytes) — ignored for V1 All Industries.`);
  }

  const result = parseOflcAllIndustriesPackage({
    packageFilename,
    packageSha256,
    occupationsCsv: readFileSync(occPath, "utf8"),
    geographyCsv: readFileSync(geoPath, "utf8"),
    alcCsv: readFileSync(alcPath, "utf8"),
    gazetteerText: readFileSync(gazetteerPath, "utf8"),
    notesText: loadNotes(existsSync(notesArg) ? notesArg : undefined, extractedDir),
  });

  const shapeErrors = assertSchemaShape(result);
  for (const msg of shapeErrors) {
    result.issues.push({ severity: "error", code: "schema_shape", message: msg });
    result.ok = false;
  }

  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  console.log("");
  console.log("Dataset");
  console.log(`  id: ${result.dataset.id}`);
  console.log(`  wage_year: ${result.dataset.wage_year}`);
  console.log(`  effective: ${result.dataset.effective_start} .. ${result.dataset.effective_end}`);
  console.log(`  data_source: ${result.dataset.data_source}`);
  console.log(`  bls_survey: ${result.dataset.bls_survey}`);
  console.log(`  soc_version: ${result.dataset.soc_version}`);
  console.log(`  status: ${result.dataset.status}`);
  console.log("Occupations");
  console.log(`  ${result.occupations.length}`);
  console.log("Areas");
  console.log(`  ${result.areas.length}`);
  console.log("Area localities");
  console.log(`  ${result.localities.length}`);
  console.log(
    `  county_fips resolved=${result.fipsResolution.resolved} gu_vi_null=${result.fipsResolution.nullGuVi} unmatched=${result.fipsResolution.unmatched}`
  );
  console.log("Wage records");
  console.log(`  ${result.wageRecords.length}`);
  console.log("Label distribution");
  for (const [label, count] of Object.entries(result.labelDistribution)) {
    console.log(`  ${label}: ${count}`);
  }
  if (result.otherLabels.length) {
    console.log(`  other values: ${result.otherLabels.join(" | ")}`);
  }
  console.log("Known fixtures");
  for (const fix of result.fixtures) {
    console.log(`  ${fix.ok ? "PASS" : "FAIL"} ${fix.name} ${fix.actual ? fix.actual.join("/") : "missing"}`);
  }
  console.log("Validation");
  console.log(`  errors: ${errors.length}`);
  console.log(`  warnings: ${warnings.length}`);
  for (const item of errors.slice(0, 25)) {
    console.log(`  ERROR ${item.code}: ${item.message}`);
  }
  if (errors.length > 25) console.log(`  ... ${errors.length - 25} more errors`);
  for (const item of warnings.slice(0, 10)) {
    console.log(`  WARN ${item.code}: ${item.message}`);
  }
  console.log("");
  console.log(result.ok ? "DRY-RUN PASS" : "DRY-RUN FAIL");
  process.exit(result.ok ? 0 : 1);
}

main();
