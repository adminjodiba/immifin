/**
 * Read-only diagnostic for the partial Dev OFLC wage load.
 * Never inserts, updates, deletes, or activates.
 *
 *   npx tsx scripts/oflc-wage-import/diagnoseOflcDev.ts --target dev
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import {
  EXPECTED_OFFICIAL_PACKAGE_SHA256,
  H1B_ALL_TABLES,
  IMMIFIN_DEV_PROJECT_REF,
  IMMIFIN_PROD_PROJECT_REF,
  WAGE_RECORD_BATCH_SIZE,
} from "./constants";
import {
  DEFAULT_CENSUS_GAZETTEER,
  DEFAULT_OFLC_NOTES,
  DEFAULT_OFLC_PACKAGE,
  ensureExtractedPackage,
  loadNotes,
  sha256File,
} from "./packageFiles";
import { classifyOfficialLabel, parseOflcAllIndustriesPackage } from "./parseOflcPackage";
import { assertReadOnlySql } from "./readOnlySql";
import { assertDevOnlyTarget, classifyProjectRef, maskProjectRef } from "./targetGuard";
import {
  assertAuthorizedWriteSql,
  buildWageInsertSql,
  countInsertValueTuples,
  countSemicolonsByQuoteContext,
  hasMultipleStatements,
  statementHead,
  writeSqlKind,
} from "./writeOflcDev";
import {
  firstWageGlobalIndex,
  reconcileOrderedWageKeys,
  wageBatchFromGlobalIndex,
  wageRecordKey,
} from "./wageReconcile";
import { OFLC_ALL_INDUSTRIES_DATA_SOURCE } from "./types";

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

function queryLinkedJson(sql: string): unknown {
  const safeSql = assertReadOnlySql(sql);
  const file = join(tmpdir(), `immifin-oflc-diag-readonly-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  writeFileSync(file, safeSql, "utf8");
  try {
    const result = spawnSync(
      "npx",
      ["--yes", "supabase", "db", "query", "--linked", "--file", file],
      { encoding: "utf8", shell: true }
    );
    if (result.status !== 0) {
      throw new Error("Read-only query failed. Secrets are not printed.");
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
      // ignore
    }
  }
}

function rowsOf<T>(payload: unknown): T[] {
  if (payload && typeof payload === "object" && "rows" in payload) {
    return ((payload as { rows?: T[] }).rows ?? []) as T[];
  }
  return [];
}

function measureSql(sql: string): { chars: number; bytes: number; tuples: number } {
  return {
    chars: sql.length,
    bytes: Buffer.byteLength(sql, "utf8"),
    tuples: countInsertValueTuples(sql),
  };
}

function main(): void {
  const explicitTarget = argValue("--target");
  console.log("OFLC Dev diagnostic — READ-ONLY. Zero mutations.");
  console.log(`Eligible target: Dev ${IMMIFIN_DEV_PROJECT_REF.mask}`);
  console.log(`Hard-blocked: Production ${IMMIFIN_PROD_PROJECT_REF.mask}`);

  const list = spawnSync("npx", ["--yes", "supabase", "projects", "list", "-o", "json"], {
    encoding: "utf8",
    shell: true,
  });
  if (list.status !== 0) {
    throw new Error("Unable to list Supabase projects via CLI.");
  }
  const raw = `${list.stdout ?? ""}\n${list.stderr ?? ""}`;
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  const projects = JSON.parse(raw.slice(start, end + 1)) as Array<{ name?: string; id?: string; linked?: boolean }>;
  const linked = projects.find((p) => p.linked);
  const prod = projects.find((p) => classifyProjectRef(p.id ?? "") === "production");
  if (!linked) {
    console.error("STOP: repository is not CLI-linked.");
    process.exit(2);
  }
  console.log(`CLI linked: ${linked.name} ${maskProjectRef(linked.id ?? "")}`);
  if (prod) console.log(`Production present (not linked): ${prod.name} ${maskProjectRef(prod.id ?? "")}`);

  const guard = assertDevOnlyTarget({
    explicitTarget,
    projectRef: linked.id,
    write: false,
    writeEnabledInBuild: false,
  });
  if (!guard.ok || classifyProjectRef(linked.id ?? "") !== "dev") {
    console.error("STOP: diagnostic requires verified Dev.");
    process.exit(2);
  }

  const packagePath = argValue("--package") ?? process.env.OFLC_WAGES_PACKAGE ?? DEFAULT_OFLC_PACKAGE;
  const gazetteerPath = argValue("--gazetteer") ?? process.env.OFLC_CENSUS_GAZETTEER ?? DEFAULT_CENSUS_GAZETTEER;
  const notesArg = argValue("--notes") ?? process.env.OFLC_WAGES_NOTES ?? DEFAULT_OFLC_NOTES;
  const packageSha256 = sha256File(packagePath).toLowerCase();
  console.log(`package: ${basename(packagePath)}`);
  console.log(`sha256_match: ${packageSha256 === EXPECTED_OFFICIAL_PACKAGE_SHA256}`);
  if (packageSha256 !== EXPECTED_OFFICIAL_PACKAGE_SHA256) {
    console.error("STOP: official package SHA-256 mismatch.");
    process.exit(2);
  }
  const extracted = ensureExtractedPackage(packagePath, packageSha256);
  const result = parseOflcAllIndustriesPackage({
    packageFilename: basename(packagePath),
    packageSha256,
    occupationsCsv: readFileSync(extracted.occPath, "utf8"),
    geographyCsv: readFileSync(extracted.geoPath, "utf8"),
    alcCsv: readFileSync(extracted.alcPath, "utf8"),
    gazetteerText: readFileSync(gazetteerPath, "utf8"),
    notesText: loadNotes(existsSync(notesArg) ? notesArg : undefined, extracted.extractedDir),
  });
  console.log("Parsed official dataset");
  console.log(`  occupations: ${result.occupations.length}`);
  console.log(`  areas: ${result.areas.length}`);
  console.log(`  localities: ${result.localities.length}`);
  console.log(`  wage_records: ${result.wageRecords.length}`);
  console.log("Wage ordering: official ALC_Export.csv physical row order via loadDelimited. No sort.");

  const countSql = `
select 'wage_datasets' as table_name, count(*)::bigint as n from public.wage_datasets
union all select 'oflc_occupations', count(*)::bigint from public.oflc_occupations
union all select 'oflc_areas', count(*)::bigint from public.oflc_areas
union all select 'oflc_area_localities', count(*)::bigint from public.oflc_area_localities
union all select 'oflc_wage_records', count(*)::bigint from public.oflc_wage_records
union all select 'county_fips_names', count(*)::bigint from public.county_fips_names
union all select 'zip_crosswalk_versions', count(*)::bigint from public.zip_crosswalk_versions
union all select 'zip_county_crosswalk', count(*)::bigint from public.zip_county_crosswalk
union all select 'profiles', count(*)::bigint from public.profiles
union all select 'immigration_profiles', count(*)::bigint from public.immigration_profiles
union all select 'subscriptions', count(*)::bigint from public.subscriptions
union all select 'stripe_webhook_events', count(*)::bigint from public.stripe_webhook_events
union all select 'user_feedback', count(*)::bigint from public.user_feedback
union all select 'notification_campaigns', count(*)::bigint from public.notification_campaigns
union all select 'admin_audit_log', count(*)::bigint from public.admin_audit_log
union all select 'admin_role_changes', count(*)::bigint from public.admin_role_changes
order by 1;
`;
  const counts: Record<string, number> = {};
  for (const row of rowsOf<{ table_name?: string; n?: number }>(queryLinkedJson(countSql))) {
    if (row.table_name) counts[row.table_name] = Number(row.n);
  }
  const statusSql = `
select
  (select count(*) from public.wage_datasets where lower(package_sha256) = '${EXPECTED_OFFICIAL_PACKAGE_SHA256}')::bigint as matching_sha,
  (select count(*) from public.wage_datasets where status = 'failed')::bigint as failed_datasets,
  (select count(*) from public.wage_datasets where status = 'imported')::bigint as imported_datasets,
  (select count(*) from public.wage_datasets where status = 'active')::bigint as active_wage_datasets,
  (select count(*) from public.zip_crosswalk_versions where status = 'active')::bigint as active_zip;
`;
  const status = rowsOf<{
    matching_sha?: number;
    failed_datasets?: number;
    imported_datasets?: number;
    active_wage_datasets?: number;
    active_zip?: number;
  }>(queryLinkedJson(statusSql))[0] ?? {};
  console.log("Dev counts");
  for (const table of [...H1B_ALL_TABLES, "profiles", "immigration_profiles", "subscriptions", "stripe_webhook_events", "user_feedback", "notification_campaigns", "admin_audit_log", "admin_role_changes"]) {
    console.log(`  ${table}: ${counts[table] ?? "missing"}`);
  }
  console.log(`  matching_sha: ${status.matching_sha ?? "missing"}`);
  console.log(`  failed_datasets: ${status.failed_datasets ?? "missing"}`);
  console.log(`  imported_datasets: ${status.imported_datasets ?? "missing"}`);
  console.log(`  active_wage_datasets: ${status.active_wage_datasets ?? "missing"}`);

  const firstWageIndex = firstWageGlobalIndex(1, 1, 2);
  const failedRef = wageBatchFromGlobalIndex(214, firstWageIndex, WAGE_RECORD_BATCH_SIZE, result.wageRecords.length);
  console.log("Batch numbering");
  console.log(`  first_wage_global_index: ${firstWageIndex}`);
  console.log(`  reported_failed_global_index: 214`);
  console.log(`  zero_based_wage_index: ${failedRef.zeroBasedWageIndex}`);
  console.log(`  one_based_wage_number: ${failedRef.oneBasedWageNumber}`);
  console.log(`  source_offset: ${failedRef.sourceOffset}`);
  console.log(`  source_end_exclusive: ${failedRef.sourceEndExclusive}`);
  console.log(`  completed_full_wage_batches_if_prefix: ${failedRef.zeroBasedWageIndex}`);

  const dupSql = `
select count(*)::bigint as duplicate_groups
from (
  select area_code, soc_code
  from public.oflc_wage_records
  group by area_code, soc_code
  having count(*) > 1
) d;
`;
  const duplicateGroups = Number(rowsOf<{ duplicate_groups?: number }>(queryLinkedJson(dupSql))[0]?.duplicate_groups ?? -1);
  console.log(`duplicate persisted wage key groups: ${duplicateGroups}`);

  const persistedKeys: string[] = [];
  const pageSize = 20000;
  const expectedPages = Math.ceil(Number(counts.oflc_wage_records ?? 0) / pageSize);
  for (let page = 0; page < expectedPages; page += 1) {
    const offset = page * pageSize;
    const pageSql = `
select area_code || '|' || soc_code as wage_key
from public.oflc_wage_records
order by area_code, soc_code
limit ${pageSize} offset ${offset};
`;
    const pageRows = rowsOf<{ wage_key?: string }>(queryLinkedJson(pageSql));
    for (const row of pageRows) {
      if (row.wage_key) persistedKeys.push(row.wage_key);
    }
    console.log(`  fetched wage key page ${page + 1}/${expectedPages} count=${pageRows.length}`);
  }

  const sourceKeys = result.wageRecords.map((row) => wageRecordKey(row.area_code, row.soc_code));
  const reconciled = reconcileOrderedWageKeys(sourceKeys, persistedKeys);
  console.log("Key reconciliation");
  console.log(`  expected: ${reconciled.expected}`);
  console.log(`  persisted: ${reconciled.persisted}`);
  console.log(`  matching: ${reconciled.matching}`);
  console.log(`  missing: ${reconciled.missing}`);
  console.log(`  unexpected: ${reconciled.unexpected}`);
  console.log(`  duplicates: ${reconciled.duplicates}`);
  console.log(`  first_missing_index: ${reconciled.firstMissingIndex}`);
  console.log(`  holes_before_first_missing: ${reconciled.holesBeforeFirstMissing}`);
  console.log(`  missing_is_contiguous_suffix: ${reconciled.missingIsContiguousSuffix}`);
  console.log(`  remaining: ${reconciled.remaining}`);

  const occSql = `select soc_code from public.oflc_occupations;`;
  const areaSql = `select area_code from public.oflc_areas;`;
  const devSocs = new Set(rowsOf<{ soc_code?: string }>(queryLinkedJson(occSql)).map((r) => r.soc_code ?? ""));
  const devAreas = new Set(rowsOf<{ area_code?: string }>(queryLinkedJson(areaSql)).map((r) => r.area_code ?? ""));

  const resumeIndex = reconciled.firstMissingIndex ?? failedRef.sourceOffset;
  const missingBatch = result.wageRecords.slice(resumeIndex, resumeIndex + WAGE_RECORD_BATCH_SIZE);
  const issues: string[] = [];
  const uniqueKeys = new Set(missingBatch.map((row) => wageRecordKey(row.area_code, row.soc_code)));
  if (uniqueKeys.size !== missingBatch.length) issues.push("duplicate keys in missing batch");
  let orphanSoc = 0;
  let orphanArea = 0;
  let invalidGeo = 0;
  let invalidLabel = 0;
  let invalidNumber = 0;
  for (const row of missingBatch) {
    if (!devSocs.has(row.soc_code) || !result.occupations.some((o) => o.soc_code === row.soc_code)) orphanSoc += 1;
    if (!devAreas.has(row.area_code) || !result.areas.some((a) => a.area_code === row.area_code)) orphanArea += 1;
    if (!Number.isInteger(row.geo_level) || row.geo_level < 1 || row.geo_level > 4) invalidGeo += 1;
    if (classifyOfficialLabel(row.label) === "other") invalidLabel += 1;
    if (row.data_source !== OFLC_ALL_INDUSTRIES_DATA_SOURCE) issues.push("non All Industries row");
    for (const value of [row.level1, row.level2, row.level3, row.level4, row.average]) {
      if (value !== null && !Number.isFinite(value)) invalidNumber += 1;
    }
  }
  const sql = buildWageInsertSql(missingBatch);
  const guardAccepted = (() => {
    try {
      assertAuthorizedWriteSql(sql);
      return true;
    } catch {
      return false;
    }
  })();
  const measure = measureSql(sql);
  const semis = countSemicolonsByQuoteContext(sql);
  console.log("First missing batch local validation");
  console.log(`  rows: ${missingBatch.length}`);
  console.log(`  unique_keys: ${uniqueKeys.size}`);
  console.log(`  orphan_soc: ${orphanSoc}`);
  console.log(`  orphan_area: ${orphanArea}`);
  console.log(`  invalid_geo_level: ${invalidGeo}`);
  console.log(`  invalid_number: ${invalidNumber}`);
  console.log(`  other_labels: ${invalidLabel}`);
  console.log(`  kind: ${writeSqlKind(sql)}`);
  console.log(`  tuples: ${measure.tuples}`);
  console.log(`  multiple_statements: ${hasMultipleStatements(sql)}`);
  console.log(`  head_contains_do: ${/\bdo\b/i.test(statementHead(sql))}`);
  console.log(`  quoted_semicolons: ${semis.quoted}`);
  console.log(`  unquoted_semicolons: ${semis.unquoted}`);
  console.log(`  guard_accepted: ${guardAccepted}`);
  console.log(`  sql_chars: ${measure.chars}`);
  console.log(`  sql_bytes: ${measure.bytes}`);
  console.log(`  extra_issues: ${issues.length}`);

  const samples = [
    { name: "first_successful", start: 0 },
    { name: "middle_successful", start: 100 * WAGE_RECORD_BATCH_SIZE },
    { name: "last_successful", start: Math.max(0, resumeIndex - WAGE_RECORD_BATCH_SIZE) },
    { name: "first_missing", start: resumeIndex },
  ];
  console.log("Payload comparison");
  for (const sample of samples) {
    const rows = result.wageRecords.slice(sample.start, sample.start + WAGE_RECORD_BATCH_SIZE);
    const size = measureSql(buildWageInsertSql(rows));
    console.log(`  ${sample.name} offset=${sample.start} chars=${size.chars} bytes=${size.bytes} tuples=${size.tuples}`);
  }

  const localOk =
    uniqueKeys.size === missingBatch.length &&
    orphanSoc === 0 &&
    orphanArea === 0 &&
    invalidGeo === 0 &&
    invalidNumber === 0 &&
    guardAccepted &&
    measure.tuples === missingBatch.length &&
    !hasMultipleStatements(sql) &&
    semis.unquoted === 0 &&
    issues.length === 0;
  console.log(`first_missing_batch_validation: ${localOk ? "PASS" : "FAIL"}`);
  console.log("Original live write error: ORIGINAL ERROR DETAIL NOT RECOVERABLE");
  console.log("DIAGNOSTIC COMPLETE — ZERO MUTATIONS");
}

main();
