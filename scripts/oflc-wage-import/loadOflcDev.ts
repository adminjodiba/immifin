/**
 * Controlled OFLC loader.
 *
 *   npx tsx scripts/oflc-wage-import/loadOflcDev.ts --target dev
 *   npx tsx scripts/oflc-wage-import/loadOflcDev.ts --target production
 *   npx tsx scripts/oflc-wage-import/loadOflcDev.ts --target dev --write
 *   npx tsx scripts/oflc-wage-import/loadOflcDev.ts --target production --write --confirm-production
 *
 * Default is no-write. Production writes require all gates and never use --linked.
 * Never activates. Never runs supabase link.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import {
  EXPECTED_OFFICIAL_PACKAGE_SHA256,
  H1B_ALL_TABLES,
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
import { assertSchemaShape, parseOflcAllIndustriesPackage } from "./parseOflcPackage";
import { buildLoadPlan, evaluateSchemaCompatibility, type ExistingDatasetRow } from "./loadPlan";
import { assertReadOnlySql, WRITE_ENABLED_IN_BUILD } from "./readOnlySql";
import { assertLoaderTarget, classifyProjectRef, maskProjectRef } from "./targetGuard";
import { EXPECTED_OFLC_2026_27 } from "./types";
import { SOFTWARE_DEVELOPER_FIXTURES } from "./parseOflcPackage";
import {
  applyApprovedDevLoad,
  applyApprovedDevRecovery,
  applyApprovedDevWageResume,
  bindImportToDatasetId,
  childLoadBatches,
  executeProjectRefWrite,
  markDatasetImported,
  proveOccupationInsertPayload,
  resetAuthorizedWriteFn,
  setAuthorizedWriteFn,
  sqlLiteral,
} from "./writeOflcDev";
import {
  buildSupabaseQueryArgs,
  describeResolvedTarget,
  resolveDbTarget,
  type ResolvedDbTarget,
} from "./dbExecution";
import { evaluateProductionPreflight, importerHasActivationPath } from "./productionPreflight";
import {
  AUTHORIZED_WAGE_RESUME_OFFSET,
  classifyBatchPresence,
  evaluateWageResume,
  mayMarkDatasetImported,
  remainingWageResumeBatches,
} from "./resumeOflcDev";
import { reconcileOrderedWageKeys, wageRecordKey } from "./wageReconcile";

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
  const file = join(tmpdir(), `immifin-oflc-load-readonly-${Date.now()}.sql`);
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

function completedByTable(completed: Array<{ table: string; batchIndex: number; count: number }>): Record<string, { batches: number; rows: number }> {
  const out: Record<string, { batches: number; rows: number }> = {};
  for (const item of completed) {
    const cur = out[item.table] ?? { batches: 0, rows: 0 };
    cur.batches += 1;
    cur.rows += item.count;
    out[item.table] = cur;
  }
  return out;
}

function numericEq(actual: unknown, expected: string): boolean {
  return Number(actual) === Number(expected);
}

function logOccupationProof(proof: ReturnType<typeof proveOccupationInsertPayload>): void {
  console.log("Occupation INSERT pre-write proof (not executed)");
  console.log(`  rows: ${proof.rowCount}`);
  console.log(`  unique_soc: ${proof.uniqueSocCount}`);
  console.log(`  tuples: ${proof.tupleCount}`);
  console.log(`  kind: ${proof.kind}`);
  console.log(`  multiple_statements: ${proof.multipleStatements}`);
  console.log(`  quoted_semicolons: ${proof.quotedSemicolons}`);
  console.log(`  unquoted_semicolons: ${proof.unquotedSemicolons}`);
  console.log(`  rows_with_semicolon: ${proof.rowsWithSemicolon}`);
  console.log(`  rows_with_apostrophe: ${proof.rowsWithApostrophe}`);
  console.log(`  head_contains_do: ${proof.headContainsDo}`);
  console.log(`  guard_accepted: ${proof.guardAccepted}`);
  if (!proof.ok) {
    for (const issue of proof.issues.slice(0, 10)) {
      console.error(`  PROOF ERROR: ${issue}`);
    }
  }
}

function fetchPersistedWageKeys(): string[] {
  const countPayload = queryLinkedJson(`select count(*)::bigint as n from public.oflc_wage_records;`);
  const total = Number(readFirstRow<{ n?: number }>(countPayload)?.n ?? 0);
  const pageSize = 20000;
  const keys: string[] = [];
  const pages = Math.ceil(total / pageSize) || 0;
  for (let page = 0; page < pages; page += 1) {
    const offset = page * pageSize;
    const payload = queryLinkedJson(`
select area_code || '|' || soc_code as wage_key
from public.oflc_wage_records
order by area_code, soc_code
limit ${pageSize} offset ${offset};
`);
    const rows =
      payload && typeof payload === "object" && "rows" in payload
        ? (payload as { rows: Array<{ wage_key?: string }> }).rows
        : [];
    for (const row of rows ?? []) {
      if (row.wage_key) keys.push(row.wage_key);
    }
  }
  return keys;
}

function countExactWageKeys(datasetId: string, rows: Array<{ area_code: string; soc_code: string }>): number {
  if (rows.length === 0) return 0;
  const tuples = rows.map((row) => `(${sqlLiteral(row.area_code)}, ${sqlLiteral(row.soc_code)})`).join(",");
  const payload = queryLinkedJson(`
select count(*)::bigint as n
from public.oflc_wage_records
where dataset_id = ${sqlLiteral(datasetId)}
  and (area_code, soc_code) in (${tuples});
`);
  return Number(readFirstRow<{ n?: number }>(payload)?.n ?? -1);
}

function main(): void {
  const explicitTarget = argValue("--target");
  const writeRequested = hasFlag("--write");
  const confirmProduction = hasFlag("--confirm-production");
  const resumeRequested = hasFlag("--resume");
  const resumeOffsetArg = argValue("--offset");
  const packagePath = argValue("--package") ?? process.env.OFLC_WAGES_PACKAGE ?? DEFAULT_OFLC_PACKAGE;
  const extractedArg = argValue("--extracted") ?? process.env.OFLC_WAGES_EXTRACTED;
  const gazetteerPath =
    argValue("--gazetteer") ?? process.env.OFLC_CENSUS_GAZETTEER ?? DEFAULT_CENSUS_GAZETTEER;
  const notesArg = argValue("--notes") ?? process.env.OFLC_WAGES_NOTES ?? DEFAULT_OFLC_NOTES;

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
  console.log(`Activation path: ${importerHasActivationPath() ? "YES" : "NO"}`);
  if (linked) {
    console.log(`Repository CLI link (must remain Dev): ${linked.name} ${maskProjectRef(linked.id)}`);
  }
  if (resolved.target.kind === "production") {
    console.log("Production execution uses --project-ref. Repository is not relinked.");
  }

  const guard = assertLoaderTarget({
    explicitTarget,
    projectRef: resolved.target.projectRef,
    write: writeRequested,
    writeEnabledInBuild: WRITE_ENABLED_IN_BUILD,
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
    setAuthorizedWriteFn((sql) => executeProjectRefWrite(sql, resolved.target.projectRef));
  } else {
    resetAuthorizedWriteFn();
  }

  if (!existsSync(packagePath) || !existsSync(gazetteerPath)) {
    console.error("STOP: official OFLC package or Census Gazetteer is not available locally.");
    console.error(`Needed package: ${EXPECTED_OFLC_2026_27.packageFilename}`);
    process.exit(2);
  }

  const packageFilename = basename(packagePath);
  const packageSha256 = sha256File(packagePath).toLowerCase();
  console.log(`package: ${packageFilename}`);
  console.log(`sha256_match: ${packageSha256 === EXPECTED_OFFICIAL_PACKAGE_SHA256}`);
  if (packageSha256 !== EXPECTED_OFFICIAL_PACKAGE_SHA256) {
    console.error("STOP: official package SHA-256 mismatch.");
    process.exit(2);
  }

  const extracted = ensureExtractedPackage(packagePath, packageSha256, extractedArg);
  if (extracted.edcPath) {
    console.log("EDC present — ignored for V1 All Industries.");
  }

  const result = parseOflcAllIndustriesPackage({
    packageFilename,
    packageSha256,
    occupationsCsv: readFileSync(extracted.occPath, "utf8"),
    geographyCsv: readFileSync(extracted.geoPath, "utf8"),
    alcCsv: readFileSync(extracted.alcPath, "utf8"),
    gazetteerText: readFileSync(gazetteerPath, "utf8"),
    notesText: loadNotes(existsSync(notesArg) ? notesArg : undefined, extracted.extractedDir),
  });
  for (const msg of assertSchemaShape(result)) {
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
select id::text, package_sha256, data_source, status::text
from public.wage_datasets
order by imported_at nulls last;
`;
  const tablesSql = `
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (${H1B_ALL_TABLES.map((t) => `'${t}'`).join(",")})
order by 1;
`;

  console.log(`Read-only ${described.target} schema/count probe (no writes).`);
  let remoteProbeOk = true;
  let beforeCounts: Record<string, number> = {};
  let beforeActive: { rows?: Array<{ active_wage_datasets?: number; active_zip_crosswalks?: number }> } = { rows: [] };
  let existing: ExistingDatasetRow[] = [];
  let publicTables: string[] = [];
  try {
    beforeCounts = readCountMap(queryLinkedJson(countSql));
    beforeActive = queryLinkedJson(activeSql) as {
      rows?: Array<{ active_wage_datasets?: number; active_zip_crosswalks?: number }>;
    };
    const existingPayload = queryLinkedJson(existingSql) as {
      rows?: ExistingDatasetRow[];
    };
    const tablesPayload = queryLinkedJson(tablesSql) as { rows?: Array<{ table_name?: string }> };
    publicTables = (tablesPayload.rows ?? []).map((row) => row.table_name ?? "").filter(Boolean);
    existing = existingPayload.rows ?? [];
  } catch {
    remoteProbeOk = false;
    if (writeRequested) {
      console.error("STOP: remote schema probe failed. Zero writes.");
      process.exit(2);
    }
    console.log("REMOTE SCHEMA PROBE: UNAVAILABLE — local source validation only. MODE remains DRY RUN / NO WRITE.");
  }
  const schemaIssues = remoteProbeOk ? evaluateSchemaCompatibility(publicTables) : [];
  const plan = buildLoadPlan(result, existing);
  plan.issues.push(...schemaIssues);

  console.log("Parsed official dataset");
  console.log(`  occupations: ${result.occupations.length}`);
  console.log(`  areas: ${result.areas.length}`);
  console.log(`  localities: ${result.localities.length}`);
  console.log(`  wage_records: ${result.wageRecords.length}`);
  console.log(
    `  geography resolved=${result.fipsResolution.resolved} gu_vi=${result.fipsResolution.nullGuVi} unmatched=${result.fipsResolution.unmatched}`
  );
  console.log("Label distribution");
  for (const [label, count] of Object.entries(result.labelDistribution)) {
    console.log(`  ${label}: ${count}`);
  }
  console.log("Future load order");
  console.log(`  ${plan.futureLoadOrder.join(" -> ")}`);
  console.log("county_fips_names: not in OFLC V1 load (gazetteer used only to resolve locality FIPS).");
  console.log("HUD tables: not loaded.");
  console.log("Batches");
  console.log(`  wage_datasets: 1`);
  console.log(`  occupations: ${result.occupations.length} in ${plan.batches.filter((b) => b.table === "oflc_occupations").length}`);
  console.log(`  areas: ${result.areas.length} in ${plan.batches.filter((b) => b.table === "oflc_areas").length}`);
  console.log(`  localities: ${result.localities.length} in ${plan.batches.filter((b) => b.table === "oflc_area_localities").length}`);
  console.log(
    `  wage_records: ${plan.totals.wage_records} in ${plan.totals.wage_record_batches} batches of up to 2000`
  );
  console.log(`Dataset status if later written: ${plan.datasetStatus}`);
  console.log(`Activation: ${plan.activate ? "YES" : "NO (forbidden in this loader)"}`);
  console.log(`Write: ${plan.write}`);
  console.log(`Rerun: ${plan.rerun.action} — ${plan.rerun.reason}`);
  console.log(`${described.target} H1B counts BEFORE`);
  for (const table of H1B_ALL_TABLES) {
    console.log(`  ${table}: ${beforeCounts[table] ?? "missing"}`);
  }
  const activeBefore = beforeActive.rows?.[0] ?? {};
  console.log(`  active_wage_datasets: ${activeBefore.active_wage_datasets ?? 0}`);
  console.log(`  active_zip_crosswalks: ${activeBefore.active_zip_crosswalks ?? 0}`);

  const occupationProof = proveOccupationInsertPayload(result.occupations, 848);
  logOccupationProof(occupationProof);

  const errors = [...plan.issues, ...guard.issues].filter((i) => i.severity === "error");
  for (const item of errors.slice(0, 25)) {
    console.error(`ERROR ${item.code}: ${item.message}`);
  }

  if (!writeRequested) {
    let countsUnchanged = true;
    if (remoteProbeOk) {
      const afterCounts = readCountMap(queryLinkedJson(countSql));
      const afterActive = queryLinkedJson(activeSql) as {
        rows?: Array<{ active_wage_datasets?: number; active_zip_crosswalks?: number }>;
      };
      console.log(`${described.target} H1B counts AFTER (must match BEFORE)`);
      for (const table of H1B_ALL_TABLES) {
        const before = beforeCounts[table] ?? -1;
        const after = afterCounts[table] ?? -1;
        if (before !== after) countsUnchanged = false;
        console.log(`  ${table}: ${after}`);
      }
      const activeAfter = afterActive.rows?.[0] ?? {};
      console.log(`  active_wage_datasets: ${activeAfter.active_wage_datasets ?? 0}`);
      console.log(`  active_zip_crosswalks: ${activeAfter.active_zip_crosswalks ?? 0}`);
      if (!countsUnchanged) {
        console.error("ERROR database_write: H1B counts changed during no-write validation.");
      }
    } else {
      console.log("Remote after-counts skipped (probe unavailable). Zero writes executed.");
    }
    const writeWouldBeRefusedSafely =
      plan.rerun.action === "reject-active" || plan.rerun.action === "reject-duplicate";
    const pass =
      guard.ok &&
      countsUnchanged &&
      schemaIssues.length === 0 &&
      occupationProof.ok &&
      result.ok &&
      (plan.ok || writeWouldBeRefusedSafely);
    console.log("");
    console.log(pass ? "LOADER NO-WRITE PASS" : "LOADER NO-WRITE FAIL");
    process.exit(pass ? 0 : 1);
  }

  if (guard.mode !== "write" || !plan.ok) {
    console.error("LOADER WRITE FAIL — gates did not authorize write.");
    process.exit(2);
  }
  if (resolved.target.kind === "dev" && (!guard.acceptDev || classifyProjectRef(resolved.target.projectRef) !== "dev")) {
    console.error("LOADER WRITE FAIL — Dev target/ref mismatch.");
    process.exit(2);
  }
  if (
    resolved.target.kind === "production" &&
    (!guard.acceptProduction || !confirmProduction || classifyProjectRef(resolved.target.projectRef) !== "production")
  ) {
    console.error("LOADER WRITE FAIL — Production gates did not authorize write.");
    process.exit(2);
  }
  const productionPreflight = evaluateProductionPreflight({
    oflcTablesPresent: publicTables,
    migration021Present: publicTables.includes("wage_datasets") && publicTables.includes("oflc_wage_records"),
    activeAllIndustriesCount: Number(activeBefore.active_wage_datasets ?? 0),
    activeSameShaCount: existing.filter(
      (row) =>
        row.status === "active" &&
        (row.package_sha256 ?? "").toLowerCase() === EXPECTED_OFFICIAL_PACKAGE_SHA256
    ).length,
    sourceValidated: plan.ok && occupationProof.ok,
    shaOk: packageSha256 === EXPECTED_OFFICIAL_PACKAGE_SHA256,
    countsOk:
      result.occupations.length === 848 &&
      result.areas.length === 530 &&
      result.localities.length === 3275 &&
      result.wageRecords.length === 449440,
    parsedOk: result.ok,
  });
  if (resolved.target.kind === "production" && !productionPreflight.ok) {
    console.error("LOADER WRITE FAIL — Production preflight.");
    for (const item of productionPreflight.issues) {
      console.error(`ERROR ${item}`);
    }
    process.exit(2);
  }
  if (!occupationProof.ok) {
    console.error("STOP: actual 848-occupation INSERT payload failed the hardened SQL guard. No write.");
    process.exit(2);
  }

  const shaSql = `
select count(*)::bigint as matching_sha
from public.wage_datasets
where lower(package_sha256) = '${EXPECTED_OFFICIAL_PACKAGE_SHA256}';
`;
  const matchingSha = Number(readFirstRow<{ matching_sha?: number }>(queryLinkedJson(shaSql))?.matching_sha ?? -1);
  console.log(`Matching SHA datasets: ${matchingSha}`);

  const logProgress = (progress: { table: string; batchIndex: number; count: number }) => {
    console.log(`  wrote ${progress.table} batch ${progress.batchIndex} count=${progress.count}`);
  };

  const opsSql = `
select 'profiles' as table_name, count(*)::bigint as n from public.profiles
union all select 'immigration_profiles', count(*)::bigint from public.immigration_profiles
union all select 'subscriptions', count(*)::bigint from public.subscriptions
union all select 'stripe_webhook_events', count(*)::bigint from public.stripe_webhook_events
union all select 'user_feedback', count(*)::bigint from public.user_feedback
union all select 'notification_campaigns', count(*)::bigint from public.notification_campaigns
union all select 'admin_audit_log', count(*)::bigint from public.admin_audit_log
union all select 'admin_role_changes', count(*)::bigint from public.admin_role_changes
order by 1;
`;

  const identitySql = `
select id::text as id, status::text as status
from public.wage_datasets
where lower(package_sha256) = '${EXPECTED_OFFICIAL_PACKAGE_SHA256}';
`;

  if (resumeRequested) {
    const requiredOffset = Number(resumeOffsetArg);
    if (!Number.isInteger(requiredOffset)) {
      console.error("STOP: --resume requires --offset <integer>.");
      process.exit(2);
    }
    const identity = readFirstRow<{ id?: string; status?: string }>(queryLinkedJson(identitySql));
    const existingId = identity?.id ?? null;
    console.log("Resume preflight: fetching persisted wage keys (read-only).");
    const persistedKeys = fetchPersistedWageKeys();
    const sourceKeys = result.wageRecords.map((row) => wageRecordKey(row.area_code, row.soc_code));
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
    const resumeGate = evaluateWageResume({
      resumeRequested: true,
      writeRequested,
      explicitTarget,
      targetKind: resolved.target.kind,
      packageSha256,
      expectedSha256: EXPECTED_OFFICIAL_PACKAGE_SHA256,
      existingDatasetId: existingId,
      requiredDatasetId: existingId,
      existingStatus: identity?.status ?? null,
      existingActive: Number(activeBefore.active_wage_datasets ?? -1) !== 0,
      matchingShaCount: matchingSha,
      reconciled,
      requiredOffset,
      authorizedOffset: AUTHORIZED_WAGE_RESUME_OFFSET,
      confirmProduction,
    });
    for (const issue of resumeGate.issues) {
      console.error(`ERROR ${issue}`);
    }
    const preflightOk =
      (beforeCounts.wage_datasets ?? -1) === 1 &&
      (beforeCounts.oflc_occupations ?? -1) === 848 &&
      (beforeCounts.oflc_areas ?? -1) === 530 &&
      (beforeCounts.oflc_area_localities ?? -1) === 3275 &&
      (beforeCounts.oflc_wage_records ?? -1) === 418000 &&
      (beforeCounts.county_fips_names ?? -1) === 0 &&
      (beforeCounts.zip_crosswalk_versions ?? -1) === 0 &&
      (beforeCounts.zip_county_crosswalk ?? -1) === 0;
    if (!resumeGate.ok || !preflightOk || !existingId) {
      console.error("STOP: resume gates did not pass. No write.");
      process.exit(2);
    }
    const bound = bindImportToDatasetId(result, existingId);
    const batches = remainingWageResumeBatches(
      bound.wageRecords.length,
      requiredOffset,
      WAGE_RECORD_BATCH_SIZE
    );
    console.log(`Resume offset: ${requiredOffset}`);
    console.log(`Resume batches planned: ${batches.length}`);
    console.log("Beginning authorized Dev wage resume. Reusing existing failed dataset. Wage rows only. Not activating.");
    const written = applyApprovedDevWageResume(bound.wageRecords, batches, {
      assertAbsent: (batchRows) => {
        const existingCount = countExactWageKeys(existingId, batchRows);
        if (classifyBatchPresence(existingCount) === "state-changed") {
          throw new Error("RESUME STATE CHANGED — REVIEW REQUIRED");
        }
        return existingCount;
      },
      assertPresent: (batchRows) => countExactWageKeys(existingId, batchRows),
      onBatch: (progress) => {
        console.log(
          `  resume offset=${progress.sourceOffset} wage_index=${progress.zeroBasedWageIndex} wage_number=${progress.oneBasedWageNumber} expected=${progress.expected} pre=${progress.preExisting} post=${progress.postVerified} result=PASS`
        );
      },
    });
    if (!written.ok) {
      const afterFailCounts = readCountMap(queryLinkedJson(countSql));
      const failKeys = fetchPersistedWageKeys();
      const failReconciled = reconcileOrderedWageKeys(sourceKeys, failKeys);
      if (written.stateChanged) {
        console.error("RESUME STATE CHANGED — REVIEW REQUIRED");
      } else {
        console.error("RESUME PARTIAL/FAILED — REVIEW REQUIRED");
      }
      console.error(
        `table=${written.failed.table} offset=${written.failed.sourceOffset} wage_index=${written.failed.zeroBasedWageIndex} wage_number=${written.failed.oneBasedWageNumber} expected=${written.failed.expected}`
      );
      console.error(`sanitized_cause: ${written.reason}`);
      console.error(`completed_resume_batches=${written.completed.length}`);
      console.error(`current_wages=${afterFailCounts.oflc_wage_records ?? "missing"}`);
      console.error(`first_missing_index=${failReconciled.firstMissingIndex}`);
      process.exit(1);
    }

    console.log("Resume batches completed. READ-ONLY full verification before imported transition.");
    const afterCounts = readCountMap(queryLinkedJson(countSql));
    const afterActive = readFirstRow<{ active_wage_datasets?: number }>(queryLinkedJson(activeSql));
    const afterSha = Number(readFirstRow<{ matching_sha?: number }>(queryLinkedJson(shaSql))?.matching_sha ?? -1);
    const afterIdentity = readFirstRow<{ id?: string; status?: string }>(queryLinkedJson(identitySql));
    const finalKeys = fetchPersistedWageKeys();
    const finalReconciled = reconcileOrderedWageKeys(sourceKeys, finalKeys);
    console.log("Final source/Dev reconciliation");
    console.log(`  expected: ${finalReconciled.expected}`);
    console.log(`  persisted: ${finalReconciled.persisted}`);
    console.log(`  matching: ${finalReconciled.matching}`);
    console.log(`  missing: ${finalReconciled.missing}`);
    console.log(`  unexpected: ${finalReconciled.unexpected}`);
    console.log(`  duplicates: ${finalReconciled.duplicates}`);
    const quotedId = `'${existingId.replace(/'/g, "''")}'`;
    const qualitySql = `
select
  (select count(*) from public.oflc_occupations where dataset_id = ${quotedId})::bigint as occupations,
  (select count(*) from public.oflc_areas where dataset_id = ${quotedId})::bigint as areas,
  (select count(*) from public.oflc_area_localities where dataset_id = ${quotedId})::bigint as localities,
  (select count(*) from public.oflc_wage_records where dataset_id = ${quotedId})::bigint as wages,
  (select count(*) from public.oflc_wage_records w
     left join public.oflc_occupations o
       on o.dataset_id = w.dataset_id and o.soc_code = w.soc_code
     where w.dataset_id = ${quotedId} and o.soc_code is null)::bigint as orphan_occupations,
  (select count(*) from public.oflc_wage_records w
     left join public.oflc_areas a
       on a.dataset_id = w.dataset_id and a.area_code = w.area_code
     where w.dataset_id = ${quotedId} and a.area_code is null)::bigint as orphan_areas,
  (select count(*) from (
     select 1
     from public.oflc_wage_records
     where dataset_id = ${quotedId}
     group by dataset_id, data_source, area_code, soc_code
     having count(*) > 1
  ) d)::bigint as duplicate_wage_keys;
`;
    const labelsSql = `
select
  count(*) filter (where label is null or btrim(label) = '')::bigint as blank,
  count(*) filter (where label = 'Annual Wage')::bigint as annual_wage,
  count(*) filter (where label = 'High Wage')::bigint as high_wage,
  count(*) filter (where label = 'No Leveled Wage')::bigint as no_leveled_wage,
  count(*) filter (where label is not null and btrim(label) <> '' and label not in ('Annual Wage', 'High Wage', 'No Leveled Wage'))::bigint as other
from public.oflc_wage_records
where dataset_id = ${quotedId};
`;
    const fixtureSql = `
select area_code, level1, level2, level3, level4
from public.oflc_wage_records
where dataset_id = ${quotedId}
  and soc_code = '15-1252'
  and area_code in ('26420', '41860', '42660', '4800001');
`;
    const quality = readFirstRow<{
      occupations?: number;
      areas?: number;
      localities?: number;
      wages?: number;
      orphan_occupations?: number;
      orphan_areas?: number;
      duplicate_wage_keys?: number;
    }>(queryLinkedJson(qualitySql));
    const labels = readFirstRow<{
      blank?: number;
      annual_wage?: number;
      high_wage?: number;
      no_leveled_wage?: number;
      other?: number;
    }>(queryLinkedJson(labelsSql));
    const fixtureRows =
      (
        queryLinkedJson(fixtureSql) as {
          rows?: Array<{ area_code?: string; level1?: unknown; level2?: unknown; level3?: unknown; level4?: unknown }>;
        }
      ).rows ?? [];
    const fixturesOk = SOFTWARE_DEVELOPER_FIXTURES.every((fix) => {
      const row = fixtureRows.find((item) => item.area_code === fix.area_code);
      if (!row) return false;
      return (
        numericEq(row.level1, fix.expected[0]) &&
        numericEq(row.level2, fix.expected[1]) &&
        numericEq(row.level3, fix.expected[2]) &&
        numericEq(row.level4, fix.expected[3])
      );
    });
    const opsCounts = readCountMap(queryLinkedJson(opsSql));
    console.log("Post-resume counts");
    for (const table of H1B_ALL_TABLES) {
      console.log(`  ${table}: ${afterCounts[table] ?? "missing"}`);
    }
    console.log(`  dataset_status: ${afterIdentity?.status ?? "missing"}`);
    console.log(`  active_wage_datasets: ${afterActive?.active_wage_datasets ?? 0}`);
    console.log("Loaded labels");
    console.log(`  blank: ${labels?.blank ?? "missing"}`);
    console.log(`  Annual Wage: ${labels?.annual_wage ?? "missing"}`);
    console.log(`  High Wage: ${labels?.high_wage ?? "missing"}`);
    console.log(`  No Leveled Wage: ${labels?.no_leveled_wage ?? "missing"}`);
    console.log(`  other: ${labels?.other ?? "missing"}`);
    console.log(`orphan occupations: ${quality?.orphan_occupations ?? "missing"}`);
    console.log(`orphan areas: ${quality?.orphan_areas ?? "missing"}`);
    console.log(`duplicate wage keys: ${quality?.duplicate_wage_keys ?? "missing"}`);
    console.log(`fixture verification: ${fixturesOk ? "PASS" : "FAIL"}`);
    console.log("Software Developer expected fixture summary");
    for (const fix of SOFTWARE_DEVELOPER_FIXTURES) {
      console.log(`  ${fix.name} ${fix.area_code} ${fix.expected.join("/")}`);
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
    const newRows = written.completed.reduce((sum, batch) => sum + batch.expected, 0);
    const opsUnchanged =
      opsCounts.profiles === 5 &&
      opsCounts.immigration_profiles === 5 &&
      opsCounts.subscriptions === 5 &&
      opsCounts.stripe_webhook_events === 16 &&
      opsCounts.user_feedback === 2 &&
      opsCounts.notification_campaigns === 2 &&
      opsCounts.admin_audit_log === 21 &&
      opsCounts.admin_role_changes === 1;
    const validated =
      mayMarkDatasetImported({
        wageDatasets: afterCounts.wage_datasets ?? -1,
        occupations: afterCounts.oflc_occupations ?? -1,
        areas: afterCounts.oflc_areas ?? -1,
        localities: afterCounts.oflc_area_localities ?? -1,
        wages: afterCounts.oflc_wage_records ?? -1,
        matchingSha: afterSha,
        datasetStatus: afterIdentity?.status ?? "",
        activeWageDatasets: Number(afterActive?.active_wage_datasets ?? -1),
        expected: finalReconciled.expected,
        persisted: finalReconciled.persisted,
        matching: finalReconciled.matching,
        missing: finalReconciled.missing,
        unexpected: finalReconciled.unexpected,
        duplicates: finalReconciled.duplicates,
        orphanOccupations: Number(quality?.orphan_occupations),
        orphanAreas: Number(quality?.orphan_areas),
        duplicateWageKeys: Number(quality?.duplicate_wage_keys),
        blank: Number(labels?.blank),
        annualWage: Number(labels?.annual_wage),
        highWage: Number(labels?.high_wage),
        noLeveledWage: Number(labels?.no_leveled_wage),
        other: Number(labels?.other),
        fixturesOk,
        newRows,
        completedBatches: written.completed.length,
        hudCounty: afterCounts.county_fips_names ?? -1,
        hudVersions: afterCounts.zip_crosswalk_versions ?? -1,
        hudCrosswalk: afterCounts.zip_county_crosswalk ?? -1,
      }) && opsUnchanged;
    if (!validated) {
      console.error("RESUME PARTIAL/FAILED — post-load validation did not pass. Dataset remains failed / non-active.");
      process.exit(1);
    }
    console.log("Post-resume validation PASS. Transitioning same dataset failed -> imported.");
    markDatasetImported(existingId, EXPECTED_OFFICIAL_PACKAGE_SHA256);
    const finalIdentity = readFirstRow<{ id?: string; status?: string }>(queryLinkedJson(identitySql));
    const finalActive = readFirstRow<{ active_wage_datasets?: number }>(queryLinkedJson(activeSql));
    const finalSha = Number(readFirstRow<{ matching_sha?: number }>(queryLinkedJson(shaSql))?.matching_sha ?? -1);
    if (
      finalIdentity?.status !== "imported" ||
      finalSha !== 1 ||
      Number(finalActive?.active_wage_datasets ?? -1) !== 0
    ) {
      console.error("RESUME PARTIAL/FAILED — imported transition verification failed. Dataset remains non-active.");
      process.exit(1);
    }
    console.log(`Final matching SHA datasets: ${finalSha}`);
    console.log(`Final dataset status: ${finalIdentity.status}`);
    console.log(`Final active wage datasets: ${finalActive?.active_wage_datasets ?? 0}`);
    console.log("DEV OFLC RESUME COMPLETE — SAME DATASET IMPORTED / NOT ACTIVE");
    process.exit(0);
  }

  if (plan.rerun.action === "retry-failed") {
    if (matchingSha !== 1) {
      console.error("STOP: recovery requires exactly one matching SHA dataset.");
      process.exit(2);
    }
    if ((beforeCounts.wage_datasets ?? -1) !== 1) {
      console.error("STOP: recovery requires wage_datasets = 1.");
      process.exit(2);
    }
    if (Number(activeBefore.active_wage_datasets ?? -1) !== 0) {
      console.error("STOP: recovery requires active wage datasets = 0.");
      process.exit(2);
    }
    const childrenEmpty =
      (beforeCounts.oflc_occupations ?? -1) === 0 &&
      (beforeCounts.oflc_areas ?? -1) === 0 &&
      (beforeCounts.oflc_area_localities ?? -1) === 0 &&
      (beforeCounts.oflc_wage_records ?? -1) === 0;
    if (!childrenEmpty) {
      console.error("STOP: child tables are not empty. Partial-child recovery is not authorized.");
      process.exit(2);
    }
    const hudEmpty =
      (beforeCounts.county_fips_names ?? -1) === 0 &&
      (beforeCounts.zip_crosswalk_versions ?? -1) === 0 &&
      (beforeCounts.zip_county_crosswalk ?? -1) === 0;
    if (!hudEmpty) {
      console.error("STOP: HUD tables are not empty.");
      process.exit(2);
    }

    const identity = readFirstRow<{ id?: string; status?: string }>(queryLinkedJson(identitySql));
    if (!identity?.id || identity.status !== "failed") {
      console.error("STOP: matching SHA dataset is not a single failed row.");
      process.exit(2);
    }
    const existingId = identity.id;
    const bound = bindImportToDatasetId(result, existingId);
    const expectedChildBatches = childLoadBatches(plan);
    console.log("Recovery identity: existing failed SHA dataset confirmed.");
    console.log(`Recovery child batches planned: ${expectedChildBatches.length}`);
    const boundOccupationProof = proveOccupationInsertPayload(bound.occupations, 848);
    logOccupationProof(boundOccupationProof);
    if (!boundOccupationProof.ok) {
      console.error("STOP: actual 848-occupation INSERT payload failed the hardened SQL guard. No write.");
      process.exit(2);
    }
    console.log("Beginning authorized Dev recovery. Reusing existing failed dataset. Not inserting wage_datasets. Not activating.");

    const written = applyApprovedDevRecovery(bound, plan, existingId, logProgress);
    const byTable = completedByTable(written.completed);
    if (!written.ok) {
      const afterFailCounts = readCountMap(queryLinkedJson(countSql));
      console.error(
        `RECOVERY PARTIAL/FAILED — table=${written.failed.table} batch=${written.failed.batchIndex} count=${written.failed.count}`
      );
      console.error(`sanitized_cause: ${written.reason}`);
      console.error(
        `completed occupations batches=${byTable.oflc_occupations?.batches ?? 0} rows=${byTable.oflc_occupations?.rows ?? 0}`
      );
      console.error(`completed areas batches=${byTable.oflc_areas?.batches ?? 0} rows=${byTable.oflc_areas?.rows ?? 0}`);
      console.error(
        `completed localities batches=${byTable.oflc_area_localities?.batches ?? 0} rows=${byTable.oflc_area_localities?.rows ?? 0}`
      );
      console.error(
        `completed wages batches=${byTable.oflc_wage_records?.batches ?? 0} rows=${byTable.oflc_wage_records?.rows ?? 0}`
      );
      for (const table of H1B_ALL_TABLES) {
        console.error(`  ${table}: ${afterFailCounts[table] ?? "missing"}`);
      }
      process.exit(1);
    }

    console.log("Child load completed. READ-ONLY post-load verification before imported transition.");
    const afterCounts = readCountMap(queryLinkedJson(countSql));
    const afterActive = readFirstRow<{ active_wage_datasets?: number; active_zip_crosswalks?: number }>(
      queryLinkedJson(activeSql)
    );
    const afterSha = Number(readFirstRow<{ matching_sha?: number }>(queryLinkedJson(shaSql))?.matching_sha ?? -1);
    const afterIdentity = readFirstRow<{ id?: string; status?: string }>(queryLinkedJson(identitySql));
    const quotedId = `'${existingId.replace(/'/g, "''")}'`;
    const qualitySql = `
select
  (select count(*) from public.oflc_occupations where dataset_id = ${quotedId})::bigint as occupations,
  (select count(*) from public.oflc_areas where dataset_id = ${quotedId})::bigint as areas,
  (select count(*) from public.oflc_area_localities where dataset_id = ${quotedId})::bigint as localities,
  (select count(*) from public.oflc_wage_records where dataset_id = ${quotedId})::bigint as wages,
  (select count(*) from public.oflc_wage_records w
     left join public.oflc_occupations o
       on o.dataset_id = w.dataset_id and o.soc_code = w.soc_code
     where w.dataset_id = ${quotedId} and o.soc_code is null)::bigint as orphan_occupations,
  (select count(*) from public.oflc_wage_records w
     left join public.oflc_areas a
       on a.dataset_id = w.dataset_id and a.area_code = w.area_code
     where w.dataset_id = ${quotedId} and a.area_code is null)::bigint as orphan_areas,
  (select count(*) from (
     select 1
     from public.oflc_wage_records
     where dataset_id = ${quotedId}
     group by dataset_id, data_source, area_code, soc_code
     having count(*) > 1
  ) d)::bigint as duplicate_wage_keys;
`;
    const labelsSql = `
select
  count(*) filter (where label is null or btrim(label) = '')::bigint as blank,
  count(*) filter (where label = 'Annual Wage')::bigint as annual_wage,
  count(*) filter (where label = 'High Wage')::bigint as high_wage,
  count(*) filter (where label = 'No Leveled Wage')::bigint as no_leveled_wage,
  count(*) filter (where label is not null and btrim(label) <> '' and label not in ('Annual Wage', 'High Wage', 'No Leveled Wage'))::bigint as other
from public.oflc_wage_records
where dataset_id = ${quotedId};
`;
    const fixtureSql = `
select area_code, level1, level2, level3, level4
from public.oflc_wage_records
where dataset_id = ${quotedId}
  and soc_code = '15-1252'
  and area_code in ('26420', '41860', '42660', '4800001');
`;
    const quality = readFirstRow<{
      occupations?: number;
      areas?: number;
      localities?: number;
      wages?: number;
      orphan_occupations?: number;
      orphan_areas?: number;
      duplicate_wage_keys?: number;
    }>(queryLinkedJson(qualitySql));
    const labels = readFirstRow<{
      blank?: number;
      annual_wage?: number;
      high_wage?: number;
      no_leveled_wage?: number;
      other?: number;
    }>(queryLinkedJson(labelsSql));
    const fixturePayload = queryLinkedJson(fixtureSql) as {
      rows?: Array<{ area_code?: string; level1?: unknown; level2?: unknown; level3?: unknown; level4?: unknown }>;
    };
    const fixtureRows = fixturePayload.rows ?? [];
    const fixturesOk = SOFTWARE_DEVELOPER_FIXTURES.every((fix) => {
      const row = fixtureRows.find((item) => item.area_code === fix.area_code);
      if (!row) return false;
      return (
        numericEq(row.level1, fix.expected[0]) &&
        numericEq(row.level2, fix.expected[1]) &&
        numericEq(row.level3, fix.expected[2]) &&
        numericEq(row.level4, fix.expected[3])
      );
    });
    const opsCounts = readCountMap(queryLinkedJson(opsSql));

    console.log("Post-load counts");
    for (const table of H1B_ALL_TABLES) {
      console.log(`  ${table}: ${afterCounts[table] ?? "missing"}`);
    }
    console.log(`  matching_sha: ${afterSha}`);
    console.log(`  dataset_status: ${afterIdentity?.status ?? "missing"}`);
    console.log(`  active_wage_datasets: ${afterActive?.active_wage_datasets ?? 0}`);
    console.log("Loaded labels");
    console.log(`  blank: ${labels?.blank ?? "missing"}`);
    console.log(`  Annual Wage: ${labels?.annual_wage ?? "missing"}`);
    console.log(`  High Wage: ${labels?.high_wage ?? "missing"}`);
    console.log(`  No Leveled Wage: ${labels?.no_leveled_wage ?? "missing"}`);
    console.log(`  other: ${labels?.other ?? "missing"}`);
    console.log(`orphan occupations: ${quality?.orphan_occupations ?? "missing"}`);
    console.log(`orphan areas: ${quality?.orphan_areas ?? "missing"}`);
    console.log(`duplicate wage keys: ${quality?.duplicate_wage_keys ?? "missing"}`);
    console.log(`fixture verification: ${fixturesOk ? "PASS" : "FAIL"}`);
    console.log("Software Developer expected fixture summary");
    for (const fix of SOFTWARE_DEVELOPER_FIXTURES) {
      console.log(`  ${fix.name} ${fix.area_code} ${fix.expected.join("/")}`);
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

    const countsOk =
      (afterCounts.wage_datasets ?? -1) === 1 &&
      (afterCounts.oflc_occupations ?? -1) === 848 &&
      (afterCounts.oflc_areas ?? -1) === 530 &&
      (afterCounts.oflc_area_localities ?? -1) === 3275 &&
      (afterCounts.oflc_wage_records ?? -1) === 449440 &&
      (afterCounts.county_fips_names ?? -1) === 0 &&
      (afterCounts.zip_crosswalk_versions ?? -1) === 0 &&
      (afterCounts.zip_county_crosswalk ?? -1) === 0 &&
      afterSha === 1 &&
      Number(afterActive?.active_wage_datasets ?? -1) === 0 &&
      afterIdentity?.status === "failed";
    const qualityOk =
      Number(quality?.occupations) === 848 &&
      Number(quality?.areas) === 530 &&
      Number(quality?.localities) === 3275 &&
      Number(quality?.wages) === 449440 &&
      Number(quality?.orphan_occupations) === 0 &&
      Number(quality?.orphan_areas) === 0 &&
      Number(quality?.duplicate_wage_keys) === 0 &&
      Number(labels?.blank) === 410620 &&
      Number(labels?.annual_wage) === 32299 &&
      Number(labels?.high_wage) === 5866 &&
      Number(labels?.no_leveled_wage) === 655 &&
      Number(labels?.other) === 0 &&
      fixturesOk &&
      (byTable.oflc_occupations?.batches ?? 0) === 1 &&
      (byTable.oflc_occupations?.rows ?? 0) === 848 &&
      (byTable.oflc_areas?.batches ?? 0) === 1 &&
      (byTable.oflc_areas?.rows ?? 0) === 530 &&
      (byTable.oflc_area_localities?.batches ?? 0) === 2 &&
      (byTable.oflc_area_localities?.rows ?? 0) === 3275 &&
      (byTable.oflc_wage_records?.batches ?? 0) === 225 &&
      (byTable.oflc_wage_records?.rows ?? 0) === 449440;
    const opsOk =
      opsCounts.profiles === 5 &&
      opsCounts.immigration_profiles === 5 &&
      opsCounts.subscriptions === 5 &&
      opsCounts.stripe_webhook_events === 16 &&
      opsCounts.user_feedback === 2 &&
      opsCounts.notification_campaigns === 2 &&
      opsCounts.admin_audit_log === 21 &&
      opsCounts.admin_role_changes === 1;

    if (!countsOk || !qualityOk || !opsOk) {
      console.error("RECOVERY PARTIAL/FAILED — post-load validation did not pass. Dataset remains failed / non-active.");
      process.exit(1);
    }

    console.log("Post-load validation PASS. Transitioning same dataset failed -> imported.");
    markDatasetImported(existingId, EXPECTED_OFFICIAL_PACKAGE_SHA256);
    const finalIdentity = readFirstRow<{ id?: string; status?: string }>(queryLinkedJson(identitySql));
    const finalActive = readFirstRow<{ active_wage_datasets?: number }>(queryLinkedJson(activeSql));
    const finalSha = Number(readFirstRow<{ matching_sha?: number }>(queryLinkedJson(shaSql))?.matching_sha ?? -1);
    const finalDatasets = readCountMap(queryLinkedJson(countSql)).wage_datasets;
    if (
      finalIdentity?.status !== "imported" ||
      finalSha !== 1 ||
      Number(finalActive?.active_wage_datasets ?? -1) !== 0 ||
      finalDatasets !== 1
    ) {
      console.error("RECOVERY PARTIAL/FAILED — imported transition verification failed. Dataset remains non-active.");
      process.exit(1);
    }
    console.log(`Final matching SHA datasets: ${finalSha}`);
    console.log(`Final dataset status: ${finalIdentity.status}`);
    console.log(`Final active wage datasets: ${finalActive?.active_wage_datasets ?? 0}`);
    console.log("DEV OFLC RECOVERY COMPLETE — SAME DATASET IMPORTED / NOT ACTIVE");
    process.exit(0);
  }

  if (matchingSha !== 0) {
    console.error("STOP: a dataset with this official package SHA-256 already exists.");
    process.exit(2);
  }

  console.log("Beginning authorized Dev write. Dataset will remain imported / not active.");
  const written = applyApprovedDevLoad(result, plan, logProgress);
  if (!written.ok) {
    console.error(
      `DEV LOAD PARTIAL/FAILED — table=${written.failed.table} batch=${written.failed.batchIndex} count=${written.failed.count}`
    );
    process.exit(1);
  }
  console.log(`Completed batches: ${written.completed.length}`);
  console.log("LOADER WRITE PASS — dataset imported / not active");
  process.exit(0);
}

main();
