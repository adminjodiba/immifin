/**
 * Controlled HUD loader.
 *
 *   npx tsx scripts/hud-zip-import/loadHudDev.ts --target dev
 *   npx tsx scripts/hud-zip-import/loadHudDev.ts --target production
 *   npx tsx scripts/hud-zip-import/loadHudDev.ts --target dev --write
 *   npx tsx scripts/hud-zip-import/loadHudDev.ts --target production --write --confirm-production
 *   npx tsx scripts/hud-zip-import/loadHudDev.ts --target dev --write --resume --offset 35000
 *
 * Default is no-write. Production writes require all gates.
 * Production SQL uses db query --linked --project-ref. Never runs supabase link.
 * Never activates. Never writes OFLC or county_fips_names.
 * Migration 021 has no resolution_policy column; this loader does not invent one.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { H1B_ALL_TABLES } from "../oflc-wage-import/constants";
import {
  buildSupabaseQueryArgs,
  describeResolvedTarget,
  resolveDbTarget,
  type ResolvedDbTarget,
} from "../oflc-wage-import/dbExecution";
import { assertReadOnlySql } from "../oflc-wage-import/readOnlySql";
import { assertLoaderTarget, classifyProjectRef, maskProjectRef } from "../oflc-wage-import/targetGuard";
import { reconcileOrderedWageKeys } from "../oflc-wage-import/wageReconcile";
import { sanitizeCliWriteFailure, sqlLiteral } from "../oflc-wage-import/writeOflcDev";
import {
  EXPECTED_HUD_COUNTS,
  EXPECTED_OFLC_DEV_COUNTS,
  EXPECTED_PLACEHOLDER_GEOIDS,
  HUD_CROSSWALK_BATCH_SIZE,
} from "./constants";
import { buildHudLoadPlan, evaluateHudActiveVersionSafety } from "./loadPlan";
import {
  evaluateHudProductionWriteAuthorization,
  evaluateProductionHudPreflight,
  HUD_SCHEMA_TABLES,
  hudImporterHasActivationPath,
} from "./productionPreflight";
import {
  applyApprovedHudLoad,
  applyApprovedHudResume,
  executeProjectRefHudWrite,
  HUD_VERSION_INSERT_COLUMNS,
  HUD_WRITE_ENABLED_IN_BUILD,
  hudMutationPathsInvoked,
  proveHudCrosswalkInsertPayload,
  resetHudAuthorizedWriteFn,
  setHudAuthorizedWriteFn,
} from "./sqlPlan";
import {
  AUTHORIZED_HUD_RESUME_BATCHES,
  AUTHORIZED_HUD_RESUME_OFFSET,
  AUTHORIZED_HUD_RESUME_REMAINING,
  classifyHudBatchPresence,
  evaluateHudResume,
  remainingHudResumeBatches,
} from "./resumeHudDev";
import { assertHudSchemaShape, parseHudZipCountyWorkbook } from "./parseHudWorkbook";
import { EXPECTED_HUD_ZIP_COUNTY_Q2_2026 } from "./types";
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

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

type LinkedProject = {
  name: string;
  id: string;
  linked: boolean;
};

function parseProjectsJson(raw: string): LinkedProject[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end < 0) return [];
  const parsed = JSON.parse(raw.slice(start, end + 1)) as Array<{
    name?: string;
    id?: string;
    ref?: string;
    linked?: boolean;
  }>;
  return parsed.map((row) => ({
    name: row.name ?? "",
    id: row.id ?? row.ref ?? "",
    linked: row.linked === true,
  }));
}

function listProjects(): LinkedProject[] {
  const result = spawnSync("npx", ["--yes", "supabase", "projects", "list", "-o", "json"], {
    encoding: "utf8",
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error("Unable to list Supabase projects via CLI.");
  }
  return parseProjectsJson(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
}

let resolvedTarget: ResolvedDbTarget | null = null;

function queryLinkedJson(sql: string): unknown {
  const target = resolvedTarget;
  if (!target) {
    throw new Error("Database target is not resolved.");
  }
  const safeSql = assertReadOnlySql(sql);
  const file = join(tmpdir(), `immifin-hud-load-readonly-${Date.now()}.sql`);
  writeFileSync(file, safeSql, "utf8");
  try {
    const built = buildSupabaseQueryArgs({
      kind: target.kind,
      projectRef: target.projectRef,
      filePath: file,
      mode: "read",
    });
    if (!built.ok) {
      throw new Error("Read-only query args were rejected.");
    }
    const result = spawnSync("npx", ["--yes", "supabase", ...built.args], {
      encoding: "utf8",
      shell: true,
    });
    if (result.status !== 0) {
      const sanitized = sanitizeCliWriteFailure(result.status, result.stdout ?? "", result.stderr ?? "");
      throw new Error(
        `Read-only query failed. category=${sanitized.category} postgresCode=${sanitized.postgresCode ?? "none"} httpStatus=${sanitized.httpStatus ?? "none"} exitStatus=${sanitized.exitStatus ?? "none"}`
      );
    }
    const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    const start = combined.indexOf("{");
    const end = combined.lastIndexOf("}");
    if (start < 0 || end < 0) {
      throw new Error("Read-only query did not return JSON.");
    }
    return JSON.parse(combined.slice(start, end + 1));
  } finally {
    try {
      unlinkSync(file);
    } catch {
      // ignore temp cleanup
    }
  }
}

function readCountMap(payload: unknown): Record<string, number> {
  const rows =
    payload && typeof payload === "object" && "rows" in payload
      ? (payload as { rows: Array<{ table_name?: string; n?: number | string }> }).rows
      : [];
  const out: Record<string, number> = {};
  for (const row of rows ?? []) {
    if (row.table_name) out[row.table_name] = Number(row.n);
  }
  return out;
}

function readFirstRow<T extends Record<string, unknown>>(payload: unknown): T | undefined {
  const rows =
    payload && typeof payload === "object" && "rows" in payload
      ? (payload as { rows: T[] }).rows
      : [];
  return rows?.[0];
}

function countExactCrosswalkKeys(
  versionId: string,
  rows: Array<{ zip: string; county_fips: string }>
): number {
  if (rows.length === 0) return 0;
  const tuples = rows.map((row) => `(${sqlLiteral(row.zip)}, ${sqlLiteral(row.county_fips)})`).join(",");
  const payload = queryLinkedJson(`
select count(*)::bigint as n
from public.zip_county_crosswalk
where crosswalk_version = ${sqlLiteral(versionId)}
  and (zip, county_fips) in (${tuples});
`);
  return Number(readFirstRow<{ n?: number }>(payload)?.n ?? -1);
}

function fetchPersistedCrosswalkKeys(versionId: string): string[] {
  const countPayload = queryLinkedJson(`
select count(*)::bigint as n
from public.zip_county_crosswalk
where crosswalk_version = ${sqlLiteral(versionId)};
`);
  const total = Number(readFirstRow<{ n?: number }>(countPayload)?.n ?? 0);
  const pageSize = 20000;
  const keys: string[] = [];
  const pages = Math.ceil(total / pageSize) || 0;
  for (let page = 0; page < pages; page += 1) {
    const offset = page * pageSize;
    const payload = queryLinkedJson(`
select zip || '|' || county_fips as crosswalk_key
from public.zip_county_crosswalk
where crosswalk_version = ${sqlLiteral(versionId)}
order by zip, county_fips
limit ${pageSize} offset ${offset};
`);
    const rows =
      payload && typeof payload === "object" && "rows" in payload
        ? (payload as { rows: Array<{ crosswalk_key?: string }> }).rows
        : [];
    for (const row of rows ?? []) {
      if (row.crosswalk_key) keys.push(row.crosswalk_key);
    }
  }
  return keys;
}

function numericClose(actual: unknown, expected: number | null): boolean {
  if (expected === null) return actual === null || actual === undefined;
  const value = Number(actual);
  if (!Number.isFinite(value)) return false;
  return Math.abs(value - expected) < 1e-9;
}

function comparePersistedCrosswalkValues(
  versionId: string,
  sourceRows: Array<{
    zip: string;
    county_fips: string;
    pref_city: string | null;
    pref_state: string | null;
    res_ratio: number | null;
    bus_ratio: number | null;
    oth_ratio: number | null;
    tot_ratio: number | null;
    source: string;
    hud_year: number;
    hud_quarter: number;
  }>
): { compared: number; mismatches: number } {
  const byKey = new Map(sourceRows.map((row) => [`${row.zip}|${row.county_fips}`, row]));
  let compared = 0;
  let mismatches = 0;
  const pageSize = 1000;
  for (let offset = 0; offset < sourceRows.length; offset += pageSize) {
    const payload = queryLinkedJson(`
select zip, county_fips, pref_city, pref_state, res_ratio, bus_ratio, oth_ratio, tot_ratio, source, hud_year, hud_quarter
from public.zip_county_crosswalk
where crosswalk_version = ${sqlLiteral(versionId)}
order by zip, county_fips
limit ${pageSize} offset ${offset};
`);
    const rows =
      payload && typeof payload === "object" && "rows" in payload
        ? (
            payload as {
              rows: Array<{
                zip?: string;
                county_fips?: string;
                pref_city?: string | null;
                pref_state?: string | null;
                res_ratio?: unknown;
                bus_ratio?: unknown;
                oth_ratio?: unknown;
                tot_ratio?: unknown;
                source?: string;
                hud_year?: unknown;
                hud_quarter?: unknown;
              }>;
            }
          ).rows
        : [];
    for (const row of rows ?? []) {
      compared += 1;
      const expected = byKey.get(`${row.zip}|${row.county_fips}`);
      if (
        !expected ||
        row.zip !== expected.zip ||
        row.county_fips !== expected.county_fips ||
        (row.pref_city ?? null) !== expected.pref_city ||
        (row.pref_state ?? null) !== expected.pref_state ||
        !numericClose(row.res_ratio, expected.res_ratio) ||
        !numericClose(row.bus_ratio, expected.bus_ratio) ||
        !numericClose(row.oth_ratio, expected.oth_ratio) ||
        !numericClose(row.tot_ratio, expected.tot_ratio) ||
        row.source !== expected.source ||
        Number(row.hud_year) !== expected.hud_year ||
        Number(row.hud_quarter) !== expected.hud_quarter
      ) {
        mismatches += 1;
      }
    }
  }
  return { compared, mismatches };
}

function main(): void {
  const explicitTarget = argValue("--target");
  const writeRequested = hasFlag("--write");
  const confirmProduction = hasFlag("--confirm-production");
  const resumeRequested = hasFlag("--resume");
  const verifyOnly = hasFlag("--verify-only");
  const resumeOffsetArg = argValue("--offset");
  const workbookPath = argValue("--workbook") ?? process.env.HUD_ZIP_COUNTY_XLSX ?? DEFAULT_HUD_WORKBOOK;
  const gazetteerPath = argValue("--gazetteer") ?? process.env.OFLC_CENSUS_GAZETTEER ?? DEFAULT_GAZETTEER;
  const geographyPath = argValue("--geography") ?? process.env.OFLC_GEOGRAPHY_CSV ?? DEFAULT_GEOGRAPHY;

  const projects = listProjects();
  const linked = projects.find((p) => p.linked);
  const resolved = resolveDbTarget({ explicitTarget, projects });
  if (!resolved.ok) {
    console.error("TARGET: UNRESOLVED");
    console.error("MODE: DRY RUN / NO WRITE");
    for (const item of resolved.issues) {
      console.error(`ERROR ${item}`);
    }
    process.exit(2);
  }
  resolvedTarget = resolved.target;
  const described = describeResolvedTarget(resolved.target);
  console.log(`TARGET: ${described.target}`);
  console.log(`Project: ${described.name} ${described.maskedRef}`);
  console.log(`MODE: ${writeRequested ? "WRITE REQUESTED (still gated)" : "DRY RUN / NO WRITE"}`);
  console.log(`Activation path: ${hudImporterHasActivationPath() ? "YES" : "NO"}`);
  console.log(`HUD write enabled in build: ${HUD_WRITE_ENABLED_IN_BUILD}`);
  if (linked) {
    console.log(`Repository CLI link (must remain Dev): ${linked.name} ${maskProjectRef(linked.id)}`);
  }
  if (resolved.target.kind === "production") {
    console.log("Production execution uses --linked --project-ref. Repository is not relinked.");
  }

  const guard = assertLoaderTarget({
    explicitTarget,
    projectRef: resolved.target.projectRef,
    write: writeRequested,
    writeEnabledInBuild: HUD_WRITE_ENABLED_IN_BUILD,
    confirmProduction,
  });
  for (const item of guard.issues) {
    console.error(`ERROR ${item.code}: ${item.message}`);
  }
  if (!guard.ok) {
    console.error("LOADER NO-WRITE FAIL — target guard");
    process.exit(2);
  }
  if (guard.mode === "write" && resolved.target.kind === "production") {
    setHudAuthorizedWriteFn((sql) => executeProjectRefHudWrite(sql, resolved.target.projectRef));
  } else {
    resetHudAuthorizedWriteFn();
  }

  if (!existsSync(workbookPath)) {
    console.error("STOP: official HUD workbook is not available locally.");
    console.error(`Needed file: ${EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename}`);
    process.exit(2);
  }

  const filename = basename(workbookPath);
  const packageSha256 = sha256File(workbookPath).toLowerCase();
  console.log(`package: ${filename}`);
  console.log(`sha256_match: ${packageSha256 === EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256}`);
  if (packageSha256 !== EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256) {
    console.error("STOP: official HUD workbook SHA-256 mismatch.");
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
  for (const msg of assertHudSchemaShape(result)) {
    result.issues.push({ severity: "error", code: "schema_shape", message: msg });
    result.ok = false;
  }

  const countSql = `
select 'wage_datasets' as table_name, count(*)::bigint as n from public.wage_datasets
union all select 'oflc_occupations', count(*)::bigint from public.oflc_occupations
union all select 'oflc_areas', count(*)::bigint from public.oflc_areas
union all select 'oflc_area_localities', count(*)::bigint from public.oflc_area_localities
union all select 'oflc_wage_records', count(*)::bigint from public.oflc_wage_records
union all select 'county_fips_names', count(*)::bigint from public.county_fips_names
union all select 'zip_crosswalk_versions', count(*)::bigint from public.zip_crosswalk_versions
union all select 'zip_county_crosswalk', count(*)::bigint from public.zip_county_crosswalk
order by 1;
`;
  const activeSql = `
select
  (select count(*) from public.wage_datasets where status = 'active')::bigint as active_wage_datasets,
  (select count(*) from public.zip_crosswalk_versions where status = 'active')::bigint as active_zip_crosswalks;
`;
  const existingSql = `
select id::text, package_sha256, status::text
from public.zip_crosswalk_versions
order by imported_at nulls last;
`;
  const oflcStatusSql = `
select status::text as status, count(*)::bigint as n
from public.wage_datasets
group by status
order by 1;
`;

  const tablesSql = `
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (${H1B_ALL_TABLES.map((table) => `'${table}'`).join(",")})
order by 1;
`;
  console.log(`Read-only ${described.target} schema/count probe (no writes).`);
  const beforeCounts = readCountMap(queryLinkedJson(countSql));
  const beforeActive = readFirstRow<{
    active_wage_datasets?: number;
    active_zip_crosswalks?: number;
  }>(queryLinkedJson(activeSql));
  const existingPayload = queryLinkedJson(existingSql) as {
    rows?: Array<{ id?: string; package_sha256?: string; status?: string }>;
  };
  const oflcStatus = queryLinkedJson(oflcStatusSql) as {
    rows?: Array<{ status?: string; n?: number }>;
  };
  const tablesPayload = queryLinkedJson(tablesSql) as { rows?: Array<{ table_name?: string }> };
  const publicTables = (tablesPayload.rows ?? []).map((row) => row.table_name ?? "").filter(Boolean);
  const existing = (existingPayload.rows ?? []).map((row) => ({
    id: row.id ?? "",
    package_sha256: row.package_sha256 ?? null,
    status: row.status ?? "",
  }));
  const plan = buildHudLoadPlan(result, existing);

  console.log("Parsed official HUD dataset");
  console.log(`  rows: ${result.counts.rows}`);
  console.log(`  unique ZIPs: ${result.counts.uniqueZips}`);
  console.log(`  unique county FIPS: ${result.counts.uniqueCountyFips}`);
  console.log(`  duplicate source keys: ${result.counts.duplicateSourceKeys}`);
  console.log(`  malformed ZIPs: ${result.counts.malformedZips}`);
  console.log(`  zero BUS_RATIO: ${result.counts.zeroBusRatioRows}`);
  console.log(`  multi-county ZIPs: ${result.counts.multiCountyZips}`);
  console.log(`  max counties/ZIP: ${result.counts.maxCountiesPerZip}`);
  console.log(`  BUS vs RES primary differ: ${result.counts.busResPrimaryDiffer}`);
  console.log(`  placeholder GEOID rows: ${result.counts.placeholderGeoidRows}`);
  console.log(`  placeholder GEOIDs: ${result.counts.placeholderGeoids.join(", ") || "(none)"}`);
  console.log("Planned version");
  console.log(`  hud_year/quarter: ${plan.version.hud_year} Q${plan.version.hud_quarter}`);
  console.log(`  status: ${plan.datasetStatus}`);
  console.log(`  activate: ${plan.activate}`);
  console.log(`  census_gazetteer_vintage: ${plan.version.census_gazetteer_vintage}`);
  console.log(`  populate_county_fips_names: ${plan.populateCountyFipsNames}`);
  console.log("  migration 021 resolution_policy column: absent (not written)");
  console.log("Future load order");
  console.log(`  ${plan.futureLoadOrder.join(" -> ")}`);
  console.log("Batches");
  console.log(`  zip_crosswalk_versions: ${plan.totals.zip_crosswalk_versions}`);
  console.log(`  county_fips_names: ${plan.totals.county_fips_names}`);
  console.log(
    `  zip_county_crosswalk: ${plan.totals.zip_county_crosswalk} in ${plan.totals.crosswalk_batches} batches of up to ${plan.totals.crosswalk_batch_size}`
  );
  console.log(`Rerun: ${plan.rerun.action} — ${plan.rerun.reason}`);
  const sample = result.rows.slice(0, Math.min(plan.totals.crosswalk_batch_size, result.rows.length));
  const proof = proveHudCrosswalkInsertPayload(sample);
  console.log("Crosswalk INSERT size proof (not executed)");
  console.log(`  sample_rows: ${proof.rowCount}`);
  console.log(`  byte_length: ${proof.byteLength}`);
  console.log(`  kind: ${proof.kind}`);
  console.log(`  multiple_statements: ${proof.multipleStatements}`);
  console.log(`  guard_accepted: ${proof.ok}`);
  const hudActiveSafety = evaluateHudActiveVersionSafety(existing);
  const productionPreflight = evaluateProductionHudPreflight({
    hudTablesPresent: publicTables.filter((table) =>
      (HUD_SCHEMA_TABLES as readonly string[]).includes(table)
    ),
    migration021Present:
      publicTables.includes("zip_crosswalk_versions") &&
      publicTables.includes("zip_county_crosswalk") &&
      publicTables.includes("county_fips_names"),
    activeHudCount: Number(beforeActive?.active_zip_crosswalks ?? 0),
    existingVersionCount: existing.length,
    sourceValidated: result.ok,
    shaOk: packageSha256 === EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256,
    countsOk:
      result.counts.rows === EXPECTED_HUD_COUNTS.rows &&
      result.counts.uniqueZips === EXPECTED_HUD_COUNTS.uniqueZips &&
      result.counts.uniqueCountyFips === EXPECTED_HUD_COUNTS.uniqueCountyFips &&
      result.counts.multiCountyZips === EXPECTED_HUD_COUNTS.multiCountyZips,
    parsedOk: result.ok && proof.ok,
  });
  if (resolved.target.kind === "production") {
    console.log("Production HUD preflight");
    console.log(`  ok: ${productionPreflight.ok}`);
    console.log(`  active_hud_conflict: ${hudActiveSafety.allowedNewImported ? "none" : hudActiveSafety.reason}`);
    for (const issue of productionPreflight.issues) {
      console.error(`ERROR production_preflight: ${issue}`);
    }
  }
  console.log(`${described.target} H1B counts BEFORE`);
  for (const table of H1B_ALL_TABLES) {
    console.log(`  ${table}: ${beforeCounts[table] ?? "missing"}`);
  }
  console.log(`  active_wage_datasets: ${beforeActive?.active_wage_datasets ?? 0}`);
  console.log(`  active_zip_crosswalks: ${beforeActive?.active_zip_crosswalks ?? 0}`);
  console.log("OFLC dataset status counts");
  for (const row of oflcStatus.rows ?? []) {
    console.log(`  ${row.status}: ${row.n}`);
  }
  console.log(`HUD mutation paths invoked: ${JSON.stringify(hudMutationPathsInvoked())}`);

  const oflcUntouched =
    (beforeCounts.wage_datasets ?? -1) === EXPECTED_OFLC_DEV_COUNTS.wage_datasets &&
    (beforeCounts.oflc_occupations ?? -1) === EXPECTED_OFLC_DEV_COUNTS.oflc_occupations &&
    (beforeCounts.oflc_areas ?? -1) === EXPECTED_OFLC_DEV_COUNTS.oflc_areas &&
    (beforeCounts.oflc_area_localities ?? -1) === EXPECTED_OFLC_DEV_COUNTS.oflc_area_localities &&
    (beforeCounts.oflc_wage_records ?? -1) === EXPECTED_OFLC_DEV_COUNTS.oflc_wage_records;
  const hudEmpty =
    (beforeCounts.zip_crosswalk_versions ?? -1) === 0 &&
    (beforeCounts.zip_county_crosswalk ?? -1) === 0 &&
    (beforeCounts.county_fips_names ?? -1) === 0 &&
    Number(beforeActive?.active_zip_crosswalks ?? -1) === 0;
  const oflcImportedInactive =
    Number(beforeActive?.active_wage_datasets ?? -1) === 0 &&
    (oflcStatus.rows ?? []).some((row) => row.status === "imported" && Number(row.n) === 1);
  const matchingSha = existing.filter(
    (row) => (row.package_sha256 ?? "").toLowerCase() === EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256
  ).length;
  console.log(`Existing HUD versions: ${existing.length}`);
  console.log(`Matching HUD SHA versions: ${matchingSha}`);
  console.log(`Version INSERT columns: ${HUD_VERSION_INSERT_COLUMNS.join(", ")}`);
  let hudCompletedCrosswalk = 0;
  const hudResumeCompleted: Array<{
    sourceOffset: number;
    zeroBasedResumeIndex: number;
    oneBasedResumeNumber: number;
    expected: number;
    preExisting: number;
    postVerified: number;
  }> = [];

  if (verifyOnly) {
    if (writeRequested || resumeRequested) {
      console.error("STOP: --verify-only is read-only and cannot be combined with --write or --resume.");
      process.exit(2);
    }
    if ((explicitTarget ?? "").trim().toLowerCase() !== "dev" || resolved.target.kind !== "dev") {
      console.error("STOP: --verify-only requires Dev.");
      process.exit(2);
    }
    const existingId = existing[0]?.id ?? null;
    if (!existingId || existing.length !== 1) {
      console.error("RESUME STATE CHANGED — REVIEW REQUIRED");
      process.exit(2);
    }
    plan.version.id = existingId;
    hudCompletedCrosswalk = AUTHORIZED_HUD_RESUME_BATCHES;
    console.log("READ-ONLY post-resume verification only. No writes.");
  }

  if (writeRequested && resumeRequested) {
    const requiredOffset = Number(resumeOffsetArg);
    if (!Number.isInteger(requiredOffset)) {
      console.error("STOP: --resume requires --offset <integer>.");
      process.exit(2);
    }
    const existingId = existing[0]?.id ?? null;
    const existingStatus = existing[0]?.status ?? null;
    const preflightOk =
      (beforeCounts.zip_crosswalk_versions ?? -1) === 1 &&
      matchingSha === 1 &&
      (beforeCounts.zip_county_crosswalk ?? -1) === AUTHORIZED_HUD_RESUME_OFFSET &&
      (beforeCounts.county_fips_names ?? -1) === 0 &&
      Number(beforeActive?.active_zip_crosswalks ?? -1) === 0 &&
      existingStatus === "imported";
    if (!preflightOk) {
      console.error("RESUME STATE CHANGED — REVIEW REQUIRED");
      console.error("Pre-resume HUD counts/status do not match the authorized 35000-row imported prefix.");
      process.exit(2);
    }
    if (!existingId) {
      console.error("RESUME STATE CHANGED — REVIEW REQUIRED");
      process.exit(2);
    }
    console.log("Resume preflight: fetching persisted HUD keys (read-only).");
    const persistedKeys = fetchPersistedCrosswalkKeys(existingId);
    const sourceKeys = result.rows.map((row) => `${row.zip}|${row.county_fips}`);
    const reconciled = reconcileOrderedWageKeys(sourceKeys, persistedKeys);
    console.log("Pre-resume source/Dev reconciliation");
    console.log(`  expected: ${reconciled.expected}`);
    console.log(`  persisted: ${reconciled.persisted}`);
    console.log(`  matching: ${reconciled.matching}`);
    console.log(`  missing: ${reconciled.missing}`);
    console.log(`  unexpected: ${reconciled.unexpected}`);
    console.log(`  duplicates: ${reconciled.duplicates}`);
    console.log(`  first_missing_index: ${reconciled.firstMissingIndex}`);
    console.log(`  holes_before_first_missing: ${reconciled.holesBeforeFirstMissing}`);
    console.log(`  missing_is_contiguous_suffix: ${reconciled.missingIsContiguousSuffix}`);
    const resumeGate = evaluateHudResume({
      resumeRequested: true,
      writeRequested,
      explicitTarget,
      targetKind: resolved.target.kind,
      confirmProduction,
      packageSha256,
      expectedSha256: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256,
      existingVersionId: existingId,
      requiredVersionId: existingId,
      existingStatus,
      existingActive: Number(beforeActive?.active_zip_crosswalks ?? -1) !== 0,
      matchingShaCount: matchingSha,
      versionCount: beforeCounts.zip_crosswalk_versions ?? -1,
      countyFipsNames: beforeCounts.county_fips_names ?? -1,
      reconciled,
      requiredOffset,
      authorizedOffset: AUTHORIZED_HUD_RESUME_OFFSET,
    });
    for (const issue of resumeGate.issues) {
      console.error(`ERROR ${issue}`);
    }
    if (!resumeGate.ok || !guard.ok || !oflcUntouched || !oflcImportedInactive) {
      console.error("RESUME STATE CHANGED — REVIEW REQUIRED");
      process.exit(2);
    }
    const boundRows = result.rows.map((row) => ({ ...row, crosswalk_version: existingId }));
    const batches = remainingHudResumeBatches(boundRows.length, requiredOffset, HUD_CROSSWALK_BATCH_SIZE);
    if (batches.length !== AUTHORIZED_HUD_RESUME_BATCHES) {
      console.error("STOP: resume batch count is not 20.");
      process.exit(2);
    }
    const remainingRows = batches.reduce((sum, batch) => sum + batch.count, 0);
    if (remainingRows !== AUTHORIZED_HUD_RESUME_REMAINING) {
      console.error("STOP: remaining resume rows are not 19570.");
      process.exit(2);
    }
    console.log(`Resume offset: ${requiredOffset}`);
    console.log(`Resume remaining rows: ${remainingRows}`);
    console.log(`Resume batches planned: ${batches.length}`);
    for (const batch of batches) {
      console.log(
        `  planned offset=${batch.sourceOffset} resume_index=${batch.zeroBasedResumeIndex} resume_number=${batch.oneBasedResumeNumber} expected=${batch.count}`
      );
    }
    console.log("Beginning authorized Dev HUD resume. Same imported version. Crosswalk suffix only. Not activating.");
    const written = applyApprovedHudResume(boundRows, batches, {
      assertAbsent: (batchRows) => {
        const existingCount = countExactCrosswalkKeys(existingId, batchRows);
        if (classifyHudBatchPresence(existingCount) === "state-changed") {
          throw new Error("RESUME STATE CHANGED — REVIEW REQUIRED");
        }
        return existingCount;
      },
      assertPresent: (batchRows) => countExactCrosswalkKeys(existingId, batchRows),
      onBatch: (progress) => {
        hudResumeCompleted.push({
          sourceOffset: progress.sourceOffset,
          zeroBasedResumeIndex: progress.zeroBasedResumeIndex,
          oneBasedResumeNumber: progress.oneBasedResumeNumber,
          expected: progress.expected,
          preExisting: progress.preExisting,
          postVerified: progress.postVerified,
        });
        console.log(
          `  resume offset=${progress.sourceOffset} resume_index=${progress.zeroBasedResumeIndex} resume_number=${progress.oneBasedResumeNumber} expected=${progress.expected} pre=${progress.preExisting} post=${progress.postVerified} result=PASS`
        );
      },
    });
    if (!written.ok) {
      const afterFailCounts = readCountMap(queryLinkedJson(countSql));
      const failKeys = fetchPersistedCrosswalkKeys(existingId);
      const failReconciled = reconcileOrderedWageKeys(sourceKeys, failKeys);
      if (written.stateChanged) {
        console.error("RESUME STATE CHANGED — REVIEW REQUIRED");
      } else {
        console.error("HUD RESUME PARTIAL/FAILED — REVIEW REQUIRED");
      }
      console.error(
        `table=${written.failed.table} offset=${written.failed.sourceOffset} resume_index=${written.failed.zeroBasedResumeIndex} resume_number=${written.failed.oneBasedResumeNumber} expected=${written.failed.expected}`
      );
      console.error(`sanitized_cause: ${written.reason}`);
      console.error(`completed_resume_batches=${written.completed.length}`);
      console.error(`current_crosswalk_rows=${afterFailCounts.zip_county_crosswalk ?? "missing"}`);
      console.error(`first_missing_index=${failReconciled.firstMissingIndex}`);
      process.exit(1);
    }
    plan.version.id = existingId;
    hudCompletedCrosswalk = written.completed.length;
    console.log("HUD resume batches completed. READ-ONLY full verification.");
  }

  if (!writeRequested && !verifyOnly) {
    const afterCounts = readCountMap(queryLinkedJson(countSql));
    const afterActive = readFirstRow<{
      active_wage_datasets?: number;
      active_zip_crosswalks?: number;
    }>(queryLinkedJson(activeSql));
    console.log(`${described.target} H1B counts AFTER (must match BEFORE)`);
    let countsUnchanged = true;
    for (const table of H1B_ALL_TABLES) {
      const before = beforeCounts[table] ?? -1;
      const after = afterCounts[table] ?? -1;
      if (before !== after) countsUnchanged = false;
      console.log(`  ${table}: ${after}`);
    }
    console.log(`  active_wage_datasets: ${afterActive?.active_wage_datasets ?? 0}`);
    console.log(`  active_zip_crosswalks: ${afterActive?.active_zip_crosswalks ?? 0}`);
    if (!countsUnchanged) {
      console.error("ERROR database_write: H1B counts changed during no-write validation.");
    }
    const errors = [...plan.issues, ...guard.issues].filter((i) => i.severity === "error");
    for (const item of errors.slice(0, 25)) {
      console.error(`ERROR ${item.code}: ${item.message}`);
    }
    const productionDryRunOk =
      resolved.target.kind !== "production" ||
      (productionPreflight.ok && hudActiveSafety.allowedNewImported && hudImporterHasActivationPath() === false);
    const pass =
      plan.ok &&
      guard.ok &&
      countsUnchanged &&
      oflcUntouched &&
      hudEmpty &&
      oflcImportedInactive &&
      matchingSha === 0 &&
      proof.ok &&
      result.counts.rows === EXPECTED_HUD_COUNTS.rows &&
      hudMutationPathsInvoked().length === 0 &&
      productionDryRunOk;
    console.log("");
    if (resolved.target.kind === "production") {
      console.log(pass ? "HUD PRODUCTION DRY RUN COMPLETE — NO WRITE" : "HUD PRODUCTION DRY RUN FAILED — NO WRITE");
    } else {
      console.log(pass ? "HUD DEV LOAD READY — WAITING FOR WRITE AUTHORIZATION" : "HUD LOAD DESIGN CHANGE REQUIRED");
    }
    process.exit(pass ? 0 : 1);
  }

  if (!verifyOnly && !resumeRequested && (guard.mode !== "write" || !plan.ok)) {
    console.error("LOADER WRITE FAIL — gates did not authorize HUD write.");
    process.exit(2);
  }
  if (!verifyOnly && !resumeRequested) {
  const writeTargetOk =
    resolved.target.kind === "dev"
      ? guard.acceptDev && classifyProjectRef(resolved.target.projectRef) === "dev"
      : guard.acceptProduction &&
        confirmProduction &&
        classifyProjectRef(resolved.target.projectRef) === "production";
  if (!writeTargetOk) {
    console.error("LOADER WRITE FAIL — target identity is not authorized.");
    process.exit(2);
  }
  if (resolved.target.kind === "production") {
    const auth = evaluateHudProductionWriteAuthorization({
      explicitTarget,
      projectRef: resolved.target.projectRef,
      write: writeRequested,
      confirmProduction,
      writeEnabledInBuild: HUD_WRITE_ENABLED_IN_BUILD,
      sourceValidated: result.ok,
      shaOk: packageSha256 === EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256,
      countsOk:
        result.counts.rows === EXPECTED_HUD_COUNTS.rows &&
        result.counts.uniqueZips === EXPECTED_HUD_COUNTS.uniqueZips &&
        result.counts.uniqueCountyFips === EXPECTED_HUD_COUNTS.uniqueCountyFips &&
        result.counts.multiCountyZips === EXPECTED_HUD_COUNTS.multiCountyZips,
      parsedOk: result.ok && proof.ok,
      preflightOk: productionPreflight.ok,
      planOk: plan.ok,
      activate: plan.activate,
      versionStatus: plan.version.status,
      populateCountyFipsNames: plan.populateCountyFipsNames,
    });
    if (!productionPreflight.ok || !auth.authorized || plan.activate || hudImporterHasActivationPath()) {
      console.error("LOADER WRITE FAIL — Production HUD write gates.");
      for (const issue of auth.issues) {
        console.error(`ERROR ${issue}`);
      }
      process.exit(2);
    }
  }
  if (!hudEmpty || matchingSha !== 0 || existing.length !== 0) {
    console.error("BLOCKED: HUD versions already exist or SHA is already present. No write.");
    process.exit(2);
  }
  if (!oflcUntouched || !oflcImportedInactive) {
    console.error("STOP: OFLC baseline is not the expected imported/non-active dataset. No HUD write.");
    process.exit(2);
  }
  if (plan.version.status !== "imported" || plan.activate) {
    console.error("STOP: planned HUD version is not imported/non-active.");
    process.exit(2);
  }

  console.log(
    `Beginning authorized ${described.target} HUD load. One imported version. Crosswalk rows only. Not activating.`
  );
  const written = applyApprovedHudLoad(plan.version, result.rows, plan.batches, {
    assertAbsent: (batchRows) => countExactCrosswalkKeys(plan.version.id, batchRows),
    assertPresent: (batchRows) => countExactCrosswalkKeys(plan.version.id, batchRows),
    onBatch: (progress) => {
      console.log(
        `  wrote ${progress.table} batch=${progress.batchIndex} start=${progress.start} expected=${progress.expected} pre=${progress.preExisting} post=${progress.postVerified} result=PASS`
      );
    },
  });
  if (!written.ok) {
    const afterFailCounts = readCountMap(queryLinkedJson(countSql));
    console.error("HUD LOAD PARTIAL/FAILED — REVIEW REQUIRED");
    console.error(
      `table=${written.failed.table} batch=${written.failed.batchIndex} start=${written.failed.start} expected=${written.failed.expected}`
    );
    console.error(`sanitized_cause: ${written.reason}`);
    console.error(`completed_batches=${written.completed.length}`);
    console.error(`current_versions=${afterFailCounts.zip_crosswalk_versions ?? "missing"}`);
    console.error(`current_crosswalk_rows=${afterFailCounts.zip_county_crosswalk ?? "missing"}`);
    process.exit(1);
  }
  hudCompletedCrosswalk = written.completed.filter((item) => item.table === "zip_county_crosswalk").length;
  }

  if (!verifyOnly && resumeRequested && hudCompletedCrosswalk !== AUTHORIZED_HUD_RESUME_BATCHES) {
    console.error("HUD RESUME PARTIAL/FAILED — REVIEW REQUIRED");
    process.exit(1);
  }

  console.log("HUD batches completed. READ-ONLY full verification.");
  const afterCounts = readCountMap(queryLinkedJson(countSql));
  const afterActive = readFirstRow<{
    active_wage_datasets?: number;
    active_zip_crosswalks?: number;
  }>(queryLinkedJson(activeSql));
  const afterIdentity = readFirstRow<{ id?: string; status?: string; unmatched_locality_count?: number }>(
    queryLinkedJson(`
select id::text as id, status::text as status, unmatched_locality_count
from public.zip_crosswalk_versions
where lower(package_sha256) = '${EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256}';
`)
  );
  const quotedVersion = sqlLiteral(plan.version.id);
  const quality = readFirstRow<{
    unique_zips?: number;
    unique_county_fips?: number;
    duplicate_keys?: number;
    malformed_zips?: number;
    zero_bus?: number;
    multi_county_zips?: number;
    max_counties?: number;
    bus_res_differ?: number;
  }>(
    queryLinkedJson(`
with grouped as (
  select
    zip,
    count(*)::int as n,
    (array_agg(county_fips order by bus_ratio desc nulls last, county_fips))[1] as bus_primary,
    (array_agg(county_fips order by res_ratio desc nulls last, county_fips))[1] as res_primary
  from public.zip_county_crosswalk
  where crosswalk_version = ${quotedVersion}
  group by zip
)
select
  (select count(distinct zip) from public.zip_county_crosswalk where crosswalk_version = ${quotedVersion})::bigint as unique_zips,
  (select count(distinct county_fips) from public.zip_county_crosswalk where crosswalk_version = ${quotedVersion})::bigint as unique_county_fips,
  (select count(*) from (
     select 1 from public.zip_county_crosswalk
     where crosswalk_version = ${quotedVersion}
     group by crosswalk_version, zip, county_fips
     having count(*) > 1
  ) d)::bigint as duplicate_keys,
  (select count(*) from public.zip_county_crosswalk
     where crosswalk_version = ${quotedVersion} and zip !~ '^[0-9]{5}$')::bigint as malformed_zips,
  (select count(*) from public.zip_county_crosswalk
     where crosswalk_version = ${quotedVersion} and bus_ratio = 0)::bigint as zero_bus,
  (select count(*) from grouped where n > 1)::bigint as multi_county_zips,
  (select coalesce(max(n), 0) from grouped)::bigint as max_counties,
  (select count(*) from grouped where n > 1 and bus_primary is distinct from res_primary)::bigint as bus_res_differ;
`)
  );
  const persistedKeys = fetchPersistedCrosswalkKeys(plan.version.id);
  const sourceKeys = result.rows.map((row) => `${row.zip}|${row.county_fips}`);
  const persistedSet = new Set(persistedKeys);
  let matching = 0;
  let missing = 0;
  const seen = new Set<string>();
  let duplicates = 0;
  for (const key of persistedKeys) {
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  }
  for (const key of sourceKeys) {
    if (persistedSet.has(key)) matching += 1;
    else missing += 1;
  }
  let unexpected = 0;
  const sourceSet = new Set(sourceKeys);
  for (const key of persistedSet) {
    if (!sourceSet.has(key)) unexpected += 1;
  }
  const fixturePayload = queryLinkedJson(`
select zip, county_fips, pref_city, pref_state, res_ratio, bus_ratio, oth_ratio, tot_ratio
from public.zip_county_crosswalk
where crosswalk_version = ${quotedVersion}
  and zip in ('77433', '77031', '76945', '00501')
order by zip, county_fips;
`) as {
    rows?: Array<{
      zip?: string;
      county_fips?: string;
      pref_city?: string;
      pref_state?: string;
      res_ratio?: unknown;
      bus_ratio?: unknown;
      oth_ratio?: unknown;
      tot_ratio?: unknown;
    }>;
  };
  const fixtures = fixturePayload.rows ?? [];
  const hasFixture = (
    zip: string,
    county: string,
    city: string,
    state: string,
    res: number,
    bus: number
  ) => {
    const row = fixtures.find((item) => item.zip === zip && item.county_fips === county);
    if (!row) return false;
    return (
      row.pref_city === city &&
      row.pref_state === state &&
      numericClose(row.res_ratio, res) &&
      numericClose(row.bus_ratio, bus)
    );
  };
  const fixture77433 = hasFixture("77433", "48201", "CYPRESS", "TX", 1, 1) && fixtures.filter((r) => r.zip === "77433").length === 1;
  const fixture77031 =
    hasFixture("77031", "48157", "HOUSTON", "TX", 0.001219512195122, 0.044247787610619) &&
    hasFixture("77031", "48201", "HOUSTON", "TX", 0.99878048780488, 0.95575221238938) &&
    fixtures.filter((r) => r.zip === "77031").length === 2;
  const fixture76945 =
    hasFixture("76945", "48081", "ROBERT LEE", "TX", 0.99526066350711, 1) &&
    hasFixture("76945", "48451", "ROBERT LEE", "TX", 0.004739336492891, 0) &&
    fixtures.filter((r) => r.zip === "76945").length === 2;
  const fixture00501 =
    hasFixture("00501", "36103", "HOLTSVILLE", "NY", 0, 1) &&
    fixtures.filter((r) => r.zip === "00501").length === 1 &&
    fixtures.some((r) => r.zip === "00501" && r.zip?.startsWith("0"));
  const placeholderPayload = queryLinkedJson(`
select county_fips, count(*)::bigint as n
from public.zip_county_crosswalk
where crosswalk_version = ${quotedVersion}
  and county_fips in (${[...EXPECTED_PLACEHOLDER_GEOIDS, "69100", "69110", "69120"].map((code) => sqlLiteral(code)).join(",")})
group by county_fips
order by 1;
`) as { rows?: Array<{ county_fips?: string; n?: number }> };
  const placeholderPresent = EXPECTED_PLACEHOLDER_GEOIDS.every((code) =>
    (placeholderPayload.rows ?? []).some((row) => row.county_fips === code && Number(row.n) > 0)
  );
  const opsCounts = readCountMap(
    queryLinkedJson(`
select 'profiles' as table_name, count(*)::bigint as n from public.profiles
union all select 'immigration_profiles', count(*)::bigint from public.immigration_profiles
union all select 'subscriptions', count(*)::bigint from public.subscriptions
union all select 'stripe_webhook_events', count(*)::bigint from public.stripe_webhook_events
union all select 'user_feedback', count(*)::bigint from public.user_feedback
union all select 'notification_campaigns', count(*)::bigint from public.notification_campaigns
union all select 'admin_audit_log', count(*)::bigint from public.admin_audit_log
union all select 'admin_role_changes', count(*)::bigint from public.admin_role_changes
order by 1;
`)
  );
  console.log("Post-load counts");
  for (const table of H1B_ALL_TABLES) {
    console.log(`  ${table}: ${afterCounts[table] ?? "missing"}`);
  }
  console.log(`  version_status: ${afterIdentity?.status ?? "missing"}`);
  console.log(`  unmatched_locality_count: ${afterIdentity?.unmatched_locality_count ?? "missing"}`);
  console.log(`  active_wage_datasets: ${afterActive?.active_wage_datasets ?? 0}`);
  console.log(`  active_zip_crosswalks: ${afterActive?.active_zip_crosswalks ?? 0}`);
  console.log("Loaded quality");
  console.log(`  unique ZIPs: ${quality?.unique_zips ?? "missing"}`);
  console.log(`  unique county FIPS: ${quality?.unique_county_fips ?? "missing"}`);
  console.log(`  duplicate keys: ${quality?.duplicate_keys ?? "missing"}`);
  console.log(`  malformed ZIPs: ${quality?.malformed_zips ?? "missing"}`);
  console.log(`  zero BUS_RATIO: ${quality?.zero_bus ?? "missing"}`);
  console.log(`  multi-county ZIPs: ${quality?.multi_county_zips ?? "missing"}`);
  console.log(`  max counties/ZIP: ${quality?.max_counties ?? "missing"}`);
  console.log(`  BUS vs RES differ (source-order): ${result.counts.busResPrimaryDiffer}`);
  console.log(`  BUS vs RES differ (SQL min-FIPS tie-break): ${quality?.bus_res_differ ?? "missing"}`);
  const valueRecon = comparePersistedCrosswalkValues(plan.version.id, result.rows);
  console.log("Source/Dev reconciliation");
  console.log(`  expected: ${sourceKeys.length}`);
  console.log(`  persisted: ${persistedKeys.length}`);
  console.log(`  matching: ${matching}`);
  console.log(`  missing: ${missing}`);
  console.log(`  unexpected: ${unexpected}`);
  console.log(`  duplicates: ${duplicates}`);
  console.log("Full value reconciliation");
  console.log(`  compared: ${valueRecon.compared}`);
  console.log(`  mismatches: ${valueRecon.mismatches}`);
  console.log(`fixture 77433: ${fixture77433 ? "PASS" : "FAIL"}`);
  console.log(`fixture 77031: ${fixture77031 ? "PASS" : "FAIL"}`);
  console.log(`fixture 76945: ${fixture76945 ? "PASS" : "FAIL"}`);
  console.log(`fixture 00501: ${fixture00501 ? "PASS" : "FAIL"}`);
  console.log(`placeholder GEOIDs: ${placeholderPresent ? "PASS" : "FAIL"}`);
  if (resumeRequested) {
    console.log("Completed resume batches");
    for (const batch of hudResumeCompleted) {
      console.log(
        `  offset=${batch.sourceOffset} resume_index=${batch.zeroBasedResumeIndex} resume_number=${batch.oneBasedResumeNumber} expected=${batch.expected} pre=${batch.preExisting} post=${batch.postVerified} result=PASS`
      );
    }
    console.log(`Total new rows loaded: ${hudResumeCompleted.reduce((sum, batch) => sum + batch.expected, 0)}`);
  }
  console.log("Operational table counts");
  for (const [table, expected] of Object.entries({
    profiles: 5,
    immigration_profiles: 5,
    subscriptions: 5,
    stripe_webhook_events: 16,
    user_feedback: 2,
    notification_campaigns: 2,
    admin_audit_log: 21,
    admin_role_changes: 1,
  })) {
    console.log(`  ${table}: ${opsCounts[table] ?? "missing"} (expected ${expected})`);
  }
  const expectedCrosswalkBatches =
    resumeRequested || verifyOnly ? AUTHORIZED_HUD_RESUME_BATCHES : 55;
  const validated =
    (afterCounts.zip_crosswalk_versions ?? -1) === 1 &&
    (afterCounts.zip_county_crosswalk ?? -1) === 54570 &&
    (afterCounts.county_fips_names ?? -1) === 0 &&
    afterIdentity?.status === "imported" &&
    Number(afterActive?.active_zip_crosswalks ?? -1) === 0 &&
    Number(afterActive?.active_wage_datasets ?? -1) === 0 &&
    Number(afterIdentity?.unmatched_locality_count) === 8 &&
    Number(quality?.unique_zips) === 39484 &&
    Number(quality?.unique_county_fips) === 3234 &&
    Number(quality?.duplicate_keys) === 0 &&
    Number(quality?.malformed_zips) === 0 &&
    Number(quality?.zero_bus) === 10236 &&
    Number(quality?.multi_county_zips) === 11379 &&
    Number(quality?.max_counties) === 7 &&
    result.counts.busResPrimaryDiffer === 539 &&
    valueRecon.mismatches === 0 &&
    sourceKeys.length === 54570 &&
    persistedKeys.length === 54570 &&
    matching === 54570 &&
    missing === 0 &&
    unexpected === 0 &&
    duplicates === 0 &&
    valueRecon.compared === 54570 &&
    valueRecon.mismatches === 0 &&
    fixture77433 &&
    fixture77031 &&
    fixture76945 &&
    fixture00501 &&
    placeholderPresent &&
    (afterCounts.wage_datasets ?? -1) === 1 &&
    (afterCounts.oflc_occupations ?? -1) === 848 &&
    (afterCounts.oflc_areas ?? -1) === 530 &&
    (afterCounts.oflc_area_localities ?? -1) === 3275 &&
    (afterCounts.oflc_wage_records ?? -1) === 449440 &&
    (resolved.target.kind !== "dev" ||
      (opsCounts.profiles === 5 &&
        opsCounts.immigration_profiles === 5 &&
        opsCounts.subscriptions === 5 &&
        opsCounts.stripe_webhook_events === 16 &&
        opsCounts.user_feedback === 2 &&
        opsCounts.notification_campaigns === 2 &&
        opsCounts.admin_audit_log === 21 &&
        opsCounts.admin_role_changes === 1)) &&
    hudCompletedCrosswalk === expectedCrosswalkBatches &&
    !hudMutationPathsInvoked().includes("county_fips_names") &&
    !hudMutationPathsInvoked().some((path) => path.startsWith("oflc_") || path === "wage_datasets");
  if (!validated) {
    console.error(
      resumeRequested
        ? "HUD RESUME PARTIAL/FAILED — post-load validation did not pass. Version remains non-active."
        : "HUD LOAD PARTIAL/FAILED — post-load validation did not pass. Version remains non-active."
    );
    process.exit(1);
  }
  console.log(
    resumeRequested || verifyOnly
      ? "HUD DEV RESUME COMPLETE — SAME CROSSWALK IMPORTED / NOT ACTIVE"
      : `HUD ${described.target} LOAD COMPLETE — CROSSWALK IMPORTED / NOT ACTIVE`
  );
  process.exit(0);
}

main();
