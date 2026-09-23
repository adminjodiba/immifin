/**
 * Authorized Dev-only OFLC write. Never activates a dataset.
 * Production and HUD tables are hard-blocked.
 *
 * Recovery reuses an existing failed dataset and never inserts a second
 * wage_datasets row for the same official package SHA.
 */
import { spawnSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { LoadBatch, LoadPlan } from "./loadPlan";
import { resumeWouldWriteParents } from "./resumeOflcDev";
import { buildSupabaseQueryArgs } from "./dbExecution";
import type {
  OflcAreaLocalityRecord,
  OflcAreaRecord,
  OflcImportResult,
  OflcOccupationRecord,
  OflcWageRecord,
} from "./types";

const FORBIDDEN_HEAD_RE =
  /\b(do|delete|truncate|drop|alter|grant|revoke|copy|vacuum|refresh|call|create)\b/i;
const ACTIVE_STATUS_RE = /status\s*=\s*'active'/i;
const FORBIDDEN_TABLE_RE = /\b(county_fips_names|zip_crosswalk_versions|zip_county_crosswalk)\b/i;
const APPROVED_INSERT_TABLE_RE =
  /^\s*insert\s+into\s+public\.(wage_datasets|oflc_occupations|oflc_areas|oflc_area_localities|oflc_wage_records)\b/i;
const APPROVED_LIFECYCLE_UPDATE_RE =
  /^\s*update\s+public\.wage_datasets\s+set\s+status\s*=\s*'(failed|imported)'(?:\s|$)/i;
const DATASET_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const invoked: string[] = [];

export function authorizedWritePathsInvoked(): string[] {
  return [...invoked];
}

export function resetAuthorizedWritePaths(): void {
  invoked.length = 0;
}

export function sqlLiteral(value: string | number | null): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite numeric literal is not allowed.");
    return String(value);
  }
  return `'${value.replace(/'/g, "''")}'`;
}

export function writeSqlKind(sql: string): string {
  return (sql.trim().match(/^([a-zA-Z]+)/)?.[1] ?? "other").toLowerCase();
}

/** Statement structure only. Never includes INSERT VALUES payloads. */
export function statementHead(sql: string): string {
  const trimmed = sql.trim();
  if (writeSqlKind(trimmed) === "insert") {
    return trimmed.split(/\bvalues\b/i)[0] ?? trimmed;
  }
  return trimmed;
}

/** True when a semicolon appears outside quoted SQL literals. */
export function hasMultipleStatements(sql: string): boolean {
  let inString = false;
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === "'") {
      if (inString && sql[i + 1] === "'") {
        i += 1;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (!inString && ch === ";") {
      if (/\S/.test(sql.slice(i + 1))) return true;
    }
  }
  return false;
}

export function assertAuthorizedWriteSql(sql: string): string {
  const trimmed = sql.trim();
  const kind = writeSqlKind(trimmed);
  if (kind !== "insert" && kind !== "update") {
    throw new Error("Write SQL rejected: only INSERT or approved lifecycle UPDATE is allowed.");
  }
  if (hasMultipleStatements(trimmed)) {
    throw new Error("Write SQL rejected: multiple statements are not allowed.");
  }
  const head = statementHead(trimmed);
  if (FORBIDDEN_HEAD_RE.test(head)) {
    throw new Error("Write SQL rejected: destructive or privileged statement is not allowed.");
  }
  if (FORBIDDEN_TABLE_RE.test(head)) {
    throw new Error("Write SQL rejected: HUD / county_fips_names writes are forbidden.");
  }
  if (kind === "insert" && !APPROVED_INSERT_TABLE_RE.test(head)) {
    throw new Error("Write SQL rejected: INSERT target is not an approved OFLC load table.");
  }
  if (kind === "update") {
    if (!APPROVED_LIFECYCLE_UPDATE_RE.test(trimmed)) {
      throw new Error("Write SQL rejected: UPDATE is limited to wage_datasets status failed|imported.");
    }
    if (!/\bwhere\b[\s\S]*\bid\s*=/i.test(trimmed)) {
      throw new Error("Write SQL rejected: lifecycle UPDATE must target a specific dataset id.");
    }
    if (ACTIVE_STATUS_RE.test(trimmed)) {
      throw new Error("Write SQL rejected: dataset activation is forbidden.");
    }
  }
  return sql;
}

export type SanitizedWriteFailure = {
  category:
    | "timeout"
    | "connection"
    | "constraint"
    | "syntax"
    | "payload"
    | "permission"
    | "unknown";
  postgresCode: string | null;
  httpStatus: number | null;
  exitStatus: number | null;
};

const SECRET_RE = /service_role|Bearer\s+[A-Za-z0-9._-]+|postgres:\/\/\S+|password=|apikey\s*[:=]\s*\S+/gi;

export function sanitizeCliWriteFailure(
  status: number | null,
  stdout: string,
  stderr: string
): SanitizedWriteFailure {
  const text = `${stdout ?? ""}\n${stderr ?? ""}`.replace(SECRET_RE, "[redacted]");
  const postgresMatch =
    text.match(/\b(?:SQLSTATE|sqlstate)\s*[:=]?\s*([0-9A-Z]{5})\b/i) ||
    text.match(/\b(23505|23503|23514|42601|42501|57014|08P01|53200|53400|22P02)\b/);
  const postgresCode = postgresMatch?.[1] ?? null;
  const httpMatch = text.match(/\b(?:HTTP\/\d(?:\.\d)?\s+|status(?:Code)?:\s*)(\d{3})\b/i);
  const httpStatus = httpMatch ? Number(httpMatch[1]) : null;
  let category: SanitizedWriteFailure["category"] = "unknown";
  if (/timeout|ETIMEDOUT|statement timeout|57014/i.test(text)) category = "timeout";
  else if (/ECONNRESET|ECONNREFUSED|ENOTFOUND|socket hang up|08P01/i.test(text)) category = "connection";
  else if (/too large|payload|request entity|max_allowed_packet|query is too/i.test(text) || httpStatus === 413) {
    category = "payload";
  } else if (/unique|foreign key|check constraint|23505|23503|23514/i.test(text)) category = "constraint";
  else if (/syntax error|42601/i.test(text)) category = "syntax";
  else if (/permission denied|42501|401|403/i.test(text) || httpStatus === 401 || httpStatus === 403) {
    category = "permission";
  }
  return { category, postgresCode, httpStatus, exitStatus: status };
}

export function executeLinkedWrite(sql: string): void {
  const safeSql = assertAuthorizedWriteSql(sql);
  const file = join(tmpdir(), `immifin-oflc-load-write-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  writeFileSync(file, safeSql, "utf8");
  try {
    const result = spawnSync(
      "npx",
      ["--yes", "supabase", "db", "query", "--linked", "--file", file],
      { encoding: "utf8", shell: true }
    );
    if (result.status !== 0) {
      const sanitized = sanitizeCliWriteFailure(result.status, result.stdout ?? "", result.stderr ?? "");
      throw new Error(
        `Authorized Dev write query failed. category=${sanitized.category} postgresCode=${sanitized.postgresCode ?? "none"} httpStatus=${sanitized.httpStatus ?? "none"} exitStatus=${sanitized.exitStatus ?? "none"}`
      );
    }
  } finally {
    try {
      unlinkSync(file);
    } catch {
      // ignore temp cleanup
    }
  }
}

export type AuthorizedWriteFn = (sql: string) => void;

let authorizedWriteFn: AuthorizedWriteFn = executeLinkedWrite;

export function setAuthorizedWriteFn(fn: AuthorizedWriteFn | null): void {
  authorizedWriteFn = fn ?? executeLinkedWrite;
}

export function resetAuthorizedWriteFn(): void {
  authorizedWriteFn = executeLinkedWrite;
}

function runAuthorizedWrite(sql: string): void {
  authorizedWriteFn(sql);
}

export function executeProjectRefWrite(sql: string, projectRef: string): void {
  const safeSql = assertAuthorizedWriteSql(sql);
  const file = join(tmpdir(), `immifin-oflc-load-write-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  const built = buildSupabaseQueryArgs({
    kind: "production",
    projectRef,
    filePath: file,
    mode: "write",
  });
  if (!built.ok) {
    throw new Error("Authorized Production write args were rejected.");
  }
  writeFileSync(file, safeSql, "utf8");
  try {
    const result = spawnSync(
      "npx",
      ["--yes", "supabase", ...built.args],
      { encoding: "utf8", shell: true }
    );
    if (result.status !== 0) {
      const sanitized = sanitizeCliWriteFailure(result.status, result.stdout ?? "", result.stderr ?? "");
      throw new Error(
        `Authorized write query failed. category=${sanitized.category} postgresCode=${sanitized.postgresCode ?? "none"} httpStatus=${sanitized.httpStatus ?? "none"} exitStatus=${sanitized.exitStatus ?? "none"}`
      );
    }
  } finally {
    try {
      unlinkSync(file);
    } catch {
      // ignore temp cleanup
    }
  }
}

export function assertDatasetId(datasetId: string): string {
  if (!DATASET_ID_RE.test(datasetId)) {
    throw new Error("Recovery dataset id is not a UUID.");
  }
  return datasetId;
}

export function bindImportToDatasetId(result: OflcImportResult, datasetId: string): OflcImportResult {
  const id = assertDatasetId(datasetId);
  return {
    ...result,
    dataset: {
      ...result.dataset,
      id,
      status: "failed",
      activated_at: null,
      activated_by_clerk_user_id: null,
    },
    occupations: result.occupations.map((row) => ({ ...row, dataset_id: id })),
    areas: result.areas.map((row) => ({ ...row, dataset_id: id })),
    localities: result.localities.map((row) => ({ ...row, dataset_id: id })),
    wageRecords: result.wageRecords.map((row) => ({ ...row, dataset_id: id })),
  };
}

export function childLoadBatches(plan: LoadPlan): LoadBatch[] {
  return plan.batches.filter((batch) => batch.table !== "wage_datasets");
}

function occupationValues(row: OflcOccupationRecord): string {
  return `(${sqlLiteral(row.dataset_id)}, ${sqlLiteral(row.soc_code)}, ${sqlLiteral(row.title)}, ${sqlLiteral(row.description)})`;
}

export function buildOccupationInsertSql(rows: OflcOccupationRecord[]): string {
  if (rows.length === 0) {
    throw new Error("Occupation INSERT requires at least one row.");
  }
  return `insert into public.oflc_occupations (dataset_id, soc_code, title, description) values ${rows.map(occupationValues).join(",")}`;
}

export function countInsertValueTuples(sql: string): number {
  const match = sql.match(/\bvalues\b/i);
  if (!match || match.index === undefined) return 0;
  let inString = false;
  let depth = 0;
  let tuples = 0;
  for (let i = match.index + match[0].length; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === "'") {
      if (inString && sql[i + 1] === "'") {
        i += 1;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "(") {
      if (depth === 0) tuples += 1;
      depth += 1;
    } else if (ch === ")") {
      depth = Math.max(0, depth - 1);
    }
  }
  return tuples;
}

export function countSemicolonsByQuoteContext(sql: string): { quoted: number; unquoted: number } {
  let inString = false;
  let quoted = 0;
  let unquoted = 0;
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === "'") {
      if (inString && sql[i + 1] === "'") {
        i += 1;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (ch !== ";") continue;
    if (inString) quoted += 1;
    else unquoted += 1;
  }
  return { quoted, unquoted };
}

export type OccupationInsertProof = {
  ok: boolean;
  rowCount: number;
  uniqueSocCount: number;
  tupleCount: number;
  kind: string;
  multipleStatements: boolean;
  quotedSemicolons: number;
  unquotedSemicolons: number;
  rowsWithSemicolon: number;
  rowsWithApostrophe: number;
  headContainsDo: boolean;
  guardAccepted: boolean;
  issues: string[];
};

/** Build and classify the exact occupation INSERT. Never executes SQL. */
export function proveOccupationInsertPayload(
  rows: OflcOccupationRecord[],
  expectedCount = 848
): OccupationInsertProof {
  const issues: string[] = [];
  const uniqueSocCount = new Set(rows.map((row) => row.soc_code)).size;
  const rowsWithSemicolon = rows.filter((row) => `${row.title}\n${row.description ?? ""}`.includes(";")).length;
  const rowsWithApostrophe = rows.filter((row) => `${row.title}\n${row.description ?? ""}`.includes("'")).length;
  if (rows.length !== expectedCount) {
    issues.push(`occupation rowCount ${rows.length} != ${expectedCount}`);
  }
  if (uniqueSocCount !== rows.length) {
    issues.push("occupation payload contains duplicate soc_code values");
  }
  if (uniqueSocCount !== expectedCount) {
    issues.push(`unique soc_code count ${uniqueSocCount} != ${expectedCount}`);
  }

  const sql = buildOccupationInsertSql(rows);
  const kind = writeSqlKind(sql);
  const multipleStatements = hasMultipleStatements(sql);
  const headContainsDo = /\bdo\b/i.test(statementHead(sql));
  const tupleCount = countInsertValueTuples(sql);
  const semis = countSemicolonsByQuoteContext(sql);
  if (kind !== "insert") issues.push(`statement kind is ${kind}, expected insert`);
  if (multipleStatements) issues.push("generated occupation SQL contains stacked statements");
  if (headContainsDo) issues.push("occupation statement head was classified using VALUES text");
  if (tupleCount !== expectedCount) issues.push(`INSERT tuple count ${tupleCount} != ${expectedCount}`);
  if (semis.unquoted > 0) issues.push(`unquoted semicolons ${semis.unquoted}`);
  const sourceSemicolons = rows.reduce((n, row) => {
    const titleCount = row.title.split(";").length - 1;
    const descriptionCount = (row.description ?? "").split(";").length - 1;
    return n + titleCount + descriptionCount;
  }, 0);
  if (semis.quoted !== sourceSemicolons) {
    issues.push("quoted semicolon count does not match official occupation text");
  }
  let guardAccepted = false;
  try {
    assertAuthorizedWriteSql(sql);
    guardAccepted = true;
  } catch (err) {
    guardAccepted = false;
    issues.push(err instanceof Error ? err.message : "occupation INSERT rejected by SQL guard");
  }
  if (!guardAccepted) issues.push("hardened SQL guard rejected the occupation INSERT");
  return {
    ok: issues.length === 0,
    rowCount: rows.length,
    uniqueSocCount,
    tupleCount,
    kind,
    multipleStatements,
    quotedSemicolons: semis.quoted,
    unquotedSemicolons: semis.unquoted,
    rowsWithSemicolon,
    rowsWithApostrophe,
    headContainsDo,
    guardAccepted,
    issues,
  };
}

function areaValues(row: OflcAreaRecord): string {
  return `(${sqlLiteral(row.dataset_id)}, ${sqlLiteral(row.area_code)}, ${sqlLiteral(row.area_name)})`;
}

function localityValues(row: OflcAreaLocalityRecord): string {
  return `(${sqlLiteral(row.dataset_id)}, ${sqlLiteral(row.area_code)}, ${sqlLiteral(row.state_ab)}, ${sqlLiteral(row.state_name)}, ${sqlLiteral(row.county_town_name)}, ${sqlLiteral(row.county_fips)})`;
}

function wageValues(row: OflcWageRecord): string {
  return `(${sqlLiteral(row.dataset_id)}, ${sqlLiteral(row.data_source)}, ${sqlLiteral(row.area_code)}, ${sqlLiteral(row.soc_code)}, ${sqlLiteral(row.geo_level)}, ${sqlLiteral(row.level1)}, ${sqlLiteral(row.level2)}, ${sqlLiteral(row.level3)}, ${sqlLiteral(row.level4)}, ${sqlLiteral(row.average)}, ${sqlLiteral(row.label)})`;
}

export function buildWageInsertSql(rows: OflcWageRecord[]): string {
  if (rows.length === 0) {
    throw new Error("Wage INSERT requires at least one row.");
  }
  return `insert into public.oflc_wage_records (dataset_id, data_source, area_code, soc_code, geo_level, level1, level2, level3, level4, average, label) values ${rows.map(wageValues).join(",")}`;
}

export function markDatasetFailed(datasetId: string, table: string, batchIndex: number): void {
  runAuthorizedWrite(
    `update public.wage_datasets set status = 'failed' where id = ${sqlLiteral(assertDatasetId(datasetId))} and status <> 'active'`
  );
  invoked.push(`failed:${table}:${batchIndex}`);
}

export function markDatasetImported(datasetId: string, packageSha256: string): void {
  runAuthorizedWrite(
    `update public.wage_datasets set status = 'imported' where id = ${sqlLiteral(assertDatasetId(datasetId))} and lower(package_sha256) = ${sqlLiteral(packageSha256.toLowerCase())} and status = 'failed' and status <> 'active'`
  );
  invoked.push("imported");
}

export function insertDatasetImported(result: OflcImportResult): void {
  const d = result.dataset;
  if (d.status === "active") {
    throw new Error("Parsed dataset status must not be active.");
  }
  const sql = `insert into public.wage_datasets (
  id, wage_year, effective_start, effective_end, data_source,
  package_filename, package_sha256, source_url, bls_survey, soc_version,
  status, activated_at, activated_by_clerk_user_id, row_counts, validation_report, notes
) values (
  ${sqlLiteral(d.id)},
  ${sqlLiteral(d.wage_year)},
  ${sqlLiteral(d.effective_start)}::date,
  ${sqlLiteral(d.effective_end)}::date,
  ${sqlLiteral(d.data_source)},
  ${sqlLiteral(d.package_filename)},
  ${sqlLiteral(d.package_sha256.toLowerCase())},
  ${sqlLiteral(d.source_url)},
  ${sqlLiteral(d.bls_survey)},
  ${sqlLiteral(d.soc_version)},
  'imported',
  null,
  null,
  ${sqlLiteral(JSON.stringify(d.row_counts))}::jsonb,
  ${sqlLiteral(JSON.stringify({ source: "oflc-dev-load-002", status: "imported" }))}::jsonb,
  ${sqlLiteral("Official OFLC 2026-27 All Industries import. Not active.")}
)`;
  runAuthorizedWrite(sql);
  invoked.push("wage_datasets");
}

export function insertOccupationBatch(rows: OflcOccupationRecord[]): void {
  if (rows.length === 0) return;
  runAuthorizedWrite(buildOccupationInsertSql(rows));
  invoked.push("oflc_occupations");
}

export function insertAreaBatch(rows: OflcAreaRecord[]): void {
  if (rows.length === 0) return;
  runAuthorizedWrite(
    `insert into public.oflc_areas (dataset_id, area_code, area_name) values ${rows.map(areaValues).join(",")}`
  );
  invoked.push("oflc_areas");
}

export function insertLocalityBatch(rows: OflcAreaLocalityRecord[]): void {
  if (rows.length === 0) return;
  runAuthorizedWrite(
    `insert into public.oflc_area_localities (dataset_id, area_code, state_ab, state_name, county_town_name, county_fips) values ${rows.map(localityValues).join(",")}`
  );
  invoked.push("oflc_area_localities");
}

export function insertWageBatch(rows: OflcWageRecord[]): void {
  if (rows.length === 0) return;
  runAuthorizedWrite(buildWageInsertSql(rows));
  invoked.push("oflc_wage_records");
}

export type ResumeBatchProgress = {
  table: "oflc_wage_records";
  sourceOffset: number;
  zeroBasedWageIndex: number;
  oneBasedWageNumber: number;
  expected: number;
  preExisting: number;
  postVerified: number;
};

export function applyApprovedDevWageResume(
  rows: OflcWageRecord[],
  batches: Array<{ sourceOffset: number; zeroBasedWageIndex: number; oneBasedWageNumber: number; count: number }>,
  hooks: {
    assertAbsent: (batchRows: OflcWageRecord[]) => number;
    assertPresent: (batchRows: OflcWageRecord[]) => number;
    onBatch: (progress: ResumeBatchProgress) => void;
    insertBatch?: (batchRows: OflcWageRecord[]) => void;
  }
):
  | { ok: true; completed: ResumeBatchProgress[] }
  | {
      ok: false;
      failed: ResumeBatchProgress;
      completed: ResumeBatchProgress[];
      reason: string;
      stateChanged: boolean;
    } {
  if (resumeWouldWriteParents(invoked)) {
    throw new Error("Resume must not write wage_datasets or parent OFLC tables.");
  }
  const completed: ResumeBatchProgress[] = [];
  for (const batch of batches) {
    const slice = rows.slice(batch.sourceOffset, batch.sourceOffset + batch.count);
    if (slice.length !== batch.count) {
      return {
        ok: false,
        failed: {
          table: "oflc_wage_records",
          sourceOffset: batch.sourceOffset,
          zeroBasedWageIndex: batch.zeroBasedWageIndex,
          oneBasedWageNumber: batch.oneBasedWageNumber,
          expected: batch.count,
          preExisting: -1,
          postVerified: -1,
        },
        completed,
        reason: "Resume batch slice does not match expected row count.",
        stateChanged: false,
      };
    }
    let preExisting = 0;
    try {
      preExisting = hooks.assertAbsent(slice);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Resume pre-write absence check failed.";
      return {
        ok: false,
        failed: {
          table: "oflc_wage_records",
          sourceOffset: batch.sourceOffset,
          zeroBasedWageIndex: batch.zeroBasedWageIndex,
          oneBasedWageNumber: batch.oneBasedWageNumber,
          expected: batch.count,
          preExisting: -1,
          postVerified: -1,
        },
        completed,
        reason,
        stateChanged: reason.includes("RESUME STATE CHANGED"),
      };
    }
    if (preExisting !== 0) {
      return {
        ok: false,
        failed: {
          table: "oflc_wage_records",
          sourceOffset: batch.sourceOffset,
          zeroBasedWageIndex: batch.zeroBasedWageIndex,
          oneBasedWageNumber: batch.oneBasedWageNumber,
          expected: batch.count,
          preExisting,
          postVerified: -1,
        },
        completed,
        reason: "RESUME STATE CHANGED — REVIEW REQUIRED",
        stateChanged: true,
      };
    }
    try {
      (hooks.insertBatch ?? insertWageBatch)(slice);
      const postVerified = hooks.assertPresent(slice);
      const progress: ResumeBatchProgress = {
        table: "oflc_wage_records",
        sourceOffset: batch.sourceOffset,
        zeroBasedWageIndex: batch.zeroBasedWageIndex,
        oneBasedWageNumber: batch.oneBasedWageNumber,
        expected: batch.count,
        preExisting,
        postVerified,
      };
      if (postVerified !== batch.count) {
        return {
          ok: false,
          failed: progress,
          completed,
          reason: "Post-write key verification did not match expected batch count.",
          stateChanged: false,
        };
      }
      completed.push(progress);
      hooks.onBatch(progress);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Authorized Dev write failed.";
      return {
        ok: false,
        failed: {
          table: "oflc_wage_records",
          sourceOffset: batch.sourceOffset,
          zeroBasedWageIndex: batch.zeroBasedWageIndex,
          oneBasedWageNumber: batch.oneBasedWageNumber,
          expected: batch.count,
          preExisting,
          postVerified: -1,
        },
        completed,
        reason,
        stateChanged: false,
      };
    }
  }
  return { ok: true, completed };
}

export type WriteProgress = {
  table: string;
  batchIndex: number;
  count: number;
};

export function applyApprovedDevLoad(
  result: OflcImportResult,
  plan: LoadPlan,
  onBatch: (progress: WriteProgress) => void
): { ok: true; completed: WriteProgress[] } | { ok: false; failed: WriteProgress; completed: WriteProgress[]; reason: string } {
  const completed: WriteProgress[] = [];
  insertDatasetImported(result);
  const datasetBatch: WriteProgress = { table: "wage_datasets", batchIndex: 0, count: 1 };
  completed.push(datasetBatch);
  onBatch(datasetBatch);

  return writeChildBatches(result, plan, completed, onBatch);
}

export function applyApprovedDevRecovery(
  result: OflcImportResult,
  plan: LoadPlan,
  existingDatasetId: string,
  onBatch: (progress: WriteProgress) => void
): { ok: true; completed: WriteProgress[] } | { ok: false; failed: WriteProgress; completed: WriteProgress[]; reason: string } {
  if (result.dataset.id !== existingDatasetId) {
    throw new Error("Recovery must bind to the existing failed dataset id.");
  }
  if (result.dataset.status === "active") {
    throw new Error("Recovery dataset must remain non-active.");
  }
  if (invoked.includes("wage_datasets")) {
    throw new Error("Recovery must not insert another wage_datasets row.");
  }
  return writeChildBatches(result, plan, [], onBatch);
}

function writeChildBatches(
  result: OflcImportResult,
  plan: LoadPlan,
  completed: WriteProgress[],
  onBatch: (progress: WriteProgress) => void
): { ok: true; completed: WriteProgress[] } | { ok: false; failed: WriteProgress; completed: WriteProgress[]; reason: string } {
  for (const batch of childLoadBatches(plan)) {
    try {
      writeOneBatch(result, batch);
      const progress = { table: batch.table, batchIndex: batch.index, count: batch.count };
      completed.push(progress);
      onBatch(progress);
    } catch (err) {
      const failed = { table: batch.table, batchIndex: batch.index, count: batch.count };
      const reason = err instanceof Error ? err.message : "Authorized Dev write failed.";
      try {
        markDatasetFailed(result.dataset.id, batch.table, batch.index);
      } catch {
        // dataset already exists and remains non-active
      }
      return { ok: false, failed, completed, reason };
    }
  }
  return { ok: true, completed };
}

function writeOneBatch(result: OflcImportResult, batch: LoadBatch): void {
  const start = batch.start;
  const end = batch.start + batch.count;
  if (batch.table === "oflc_occupations") {
    insertOccupationBatch(result.occupations.slice(start, end));
    return;
  }
  if (batch.table === "oflc_areas") {
    insertAreaBatch(result.areas.slice(start, end));
    return;
  }
  if (batch.table === "oflc_area_localities") {
    insertLocalityBatch(result.localities.slice(start, end));
    return;
  }
  if (batch.table === "oflc_wage_records") {
    insertWageBatch(result.wageRecords.slice(start, end));
    return;
  }
  throw new Error(`Unsupported write table ${batch.table}`);
}
