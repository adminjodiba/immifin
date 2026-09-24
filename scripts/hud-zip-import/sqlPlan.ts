/**
 * Planned HUD INSERT SQL and gated write execution.
 * Default is Dev --linked. Production uses db query --linked --project-ref.
 * Never runs supabase link. OFLC tables, county_fips_names, and activation are hard-blocked.
 */
import { spawnSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSupabaseQueryArgs } from "../oflc-wage-import/dbExecution";
import {
  hasMultipleStatements,
  sanitizeCliWriteFailure,
  sqlLiteral,
  statementHead,
  writeSqlKind,
} from "../oflc-wage-import/writeOflcDev";
import { HUD_FORBIDDEN_TABLES } from "./constants";
import type { ZipCountyCrosswalkRecord, ZipCrosswalkVersionRecord } from "./types";
import type { HudLoadBatch } from "./loadPlan";
import { resumeWouldWriteParents } from "./resumeHudDev";

const FORBIDDEN_HEAD_RE =
  /\b(do|delete|truncate|drop|alter|grant|revoke|copy|vacuum|refresh|call|create)\b/i;
const ACTIVE_STATUS_RE = /status\s*=\s*'active'/i;
const FORBIDDEN_TABLE_RE = new RegExp(`\\b(${HUD_FORBIDDEN_TABLES.join("|")})\\b`, "i");
const APPROVED_INSERT_TABLE_RE =
  /^\s*insert\s+into\s+public\.(zip_crosswalk_versions|zip_county_crosswalk)\b/i;

export const HUD_WRITE_ENABLED_IN_BUILD = true;

export const HUD_VERSION_INSERT_COLUMNS = [
  "id",
  "hud_year",
  "hud_quarter",
  "census_gazetteer_vintage",
  "package_sha256",
  "status",
  "unmatched_locality_count",
  "validation_report",
] as const;

const invoked: string[] = [];

export function hudMutationPathsInvoked(): string[] {
  return [...invoked];
}

export function resetHudMutationPaths(): void {
  invoked.length = 0;
}

export function assertHudWriteSql(sql: string): string {
  const trimmed = sql.trim();
  const kind = writeSqlKind(trimmed);
  if (kind !== "insert") {
    throw new Error("HUD write SQL rejected: only INSERT is allowed.");
  }
  if (hasMultipleStatements(trimmed)) {
    throw new Error("HUD write SQL rejected: multiple statements are not allowed.");
  }
  const head = statementHead(trimmed);
  if (FORBIDDEN_HEAD_RE.test(head)) {
    throw new Error("HUD write SQL rejected: destructive or privileged statement is not allowed.");
  }
  if (FORBIDDEN_TABLE_RE.test(head) || FORBIDDEN_TABLE_RE.test(trimmed.split(/\bvalues\b/i)[0] ?? trimmed)) {
    throw new Error("HUD write SQL rejected: OFLC and county_fips_names writes are forbidden.");
  }
  if (!APPROVED_INSERT_TABLE_RE.test(head)) {
    throw new Error("HUD write SQL rejected: INSERT target is not an approved HUD load table.");
  }
  if (
    ACTIVE_STATUS_RE.test(trimmed) ||
    (/zip_crosswalk_versions/i.test(head) && /'active'/i.test(trimmed))
  ) {
    throw new Error("HUD write SQL rejected: activating a crosswalk version is forbidden.");
  }
  if (/resolution_policy/i.test(head)) {
    throw new Error("HUD write SQL rejected: resolution_policy is not a migration 021 column.");
  }
  return sql;
}

function validationReportLiteral(report: Record<string, unknown>): string {
  const clone: Record<string, unknown> = { ...report };
  delete clone.resolution_policy;
  return `${sqlLiteral(JSON.stringify(clone))}::jsonb`;
}

export function buildVersionInsertSql(version: ZipCrosswalkVersionRecord): string {
  if (version.status === "active") {
    throw new Error("HUD version INSERT must not be active.");
  }
  if (version.status !== "imported" && version.status !== "failed") {
    throw new Error("HUD version INSERT status must be imported or failed.");
  }
  const sql = `insert into public.zip_crosswalk_versions (${HUD_VERSION_INSERT_COLUMNS.join(", ")}) values (${sqlLiteral(version.id)}, ${sqlLiteral(version.hud_year)}, ${sqlLiteral(version.hud_quarter)}, ${sqlLiteral(version.census_gazetteer_vintage)}, ${sqlLiteral(version.package_sha256)}, ${sqlLiteral(version.status)}, ${sqlLiteral(version.unmatched_locality_count)}, ${validationReportLiteral(version.validation_report)})`;
  return assertHudWriteSql(sql);
}

function crosswalkValues(row: ZipCountyCrosswalkRecord): string {
  return `(${sqlLiteral(row.crosswalk_version)}, ${sqlLiteral(row.zip)}, ${sqlLiteral(row.county_fips)}, ${sqlLiteral(row.res_ratio)}, ${sqlLiteral(row.bus_ratio)}, ${sqlLiteral(row.oth_ratio)}, ${sqlLiteral(row.tot_ratio)}, ${sqlLiteral(row.pref_city)}, ${sqlLiteral(row.pref_state)}, ${sqlLiteral(row.source)}, ${sqlLiteral(row.hud_year)}, ${sqlLiteral(row.hud_quarter)})`;
}

export function buildCrosswalkInsertSql(rows: ZipCountyCrosswalkRecord[]): string {
  if (rows.length === 0) {
    throw new Error("HUD crosswalk INSERT requires at least one row.");
  }
  return assertHudWriteSql(
    `insert into public.zip_county_crosswalk (crosswalk_version, zip, county_fips, res_ratio, bus_ratio, oth_ratio, tot_ratio, pref_city, pref_state, source, hud_year, hud_quarter) values ${rows.map(crosswalkValues).join(",")}`
  );
}

export function proveHudCrosswalkInsertPayload(rows: ZipCountyCrosswalkRecord[]): {
  ok: boolean;
  rowCount: number;
  byteLength: number;
  kind: string;
  multipleStatements: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let sql = "";
  try {
    sql = buildCrosswalkInsertSql(rows);
  } catch (err) {
    issues.push(err instanceof Error ? err.message : "HUD INSERT proof failed.");
    return { ok: false, rowCount: rows.length, byteLength: 0, kind: "invalid", multipleStatements: false, issues };
  }
  const multipleStatements = hasMultipleStatements(sql);
  if (multipleStatements) issues.push("multiple_statements");
  if (writeSqlKind(sql) !== "insert") issues.push("kind");
  if (/resolution_policy/i.test(statementHead(sql))) issues.push("resolution_policy_column");
  return {
    ok: issues.length === 0,
    rowCount: rows.length,
    byteLength: Buffer.byteLength(sql, "utf8"),
    kind: writeSqlKind(sql),
    multipleStatements,
    issues,
  };
}

export function buildHudQueryArgs(input: {
  kind: "dev" | "production";
  projectRef: string;
  filePath: string;
  mode: "read" | "write";
}) {
  return buildSupabaseQueryArgs(input);
}

export type HudAuthorizedWriteFn = (sql: string) => void;

let authorizedHudWriteFn: HudAuthorizedWriteFn = executeLinkedHudWrite;

export function setHudAuthorizedWriteFn(fn: HudAuthorizedWriteFn | null): void {
  authorizedHudWriteFn = fn ?? executeLinkedHudWrite;
}

export function resetHudAuthorizedWriteFn(): void {
  authorizedHudWriteFn = executeLinkedHudWrite;
}

export function executeAuthorizedHudWrite(sql: string): void {
  authorizedHudWriteFn(sql);
}

export function executeProjectRefHudWrite(sql: string, projectRef: string): void {
  const safeSql = assertHudWriteSql(sql);
  const file = join(tmpdir(), `immifin-hud-load-write-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  const built = buildHudQueryArgs({
    kind: "production",
    projectRef,
    filePath: file,
    mode: "write",
  });
  if (!built.ok) {
    throw new Error("Authorized Production HUD write args were rejected.");
  }
  writeFileSync(file, safeSql, "utf8");
  try {
    const result = spawnSync("npx", ["--yes", "supabase", ...built.args], {
      encoding: "utf8",
      shell: true,
    });
    if (result.status !== 0) {
      const sanitized = sanitizeCliWriteFailure(result.status, result.stdout ?? "", result.stderr ?? "");
      throw new Error(
        `Authorized Production HUD write query failed. category=${sanitized.category} postgresCode=${sanitized.postgresCode ?? "none"} httpStatus=${sanitized.httpStatus ?? "none"} exitStatus=${sanitized.exitStatus ?? "none"}`
      );
    }
    const head = statementHead(safeSql);
    if (/zip_crosswalk_versions/i.test(head)) invoked.push("zip_crosswalk_versions");
    if (/zip_county_crosswalk/i.test(head)) invoked.push("zip_county_crosswalk");
  } finally {
    try {
      unlinkSync(file);
    } catch {
      // ignore temp cleanup
    }
  }
}

export function executeLinkedHudWrite(sql: string): void {
  const safeSql = assertHudWriteSql(sql);
  const file = join(tmpdir(), `immifin-hud-load-write-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  const built = buildHudQueryArgs({
    kind: "dev",
    projectRef: "vnhnxxxxxxxxxxxxxxxxxxxxtoxs",
    filePath: file,
    mode: "write",
  });
  if (!built.ok) {
    throw new Error("Authorized Dev HUD write args were rejected.");
  }
  writeFileSync(file, safeSql, "utf8");
  try {
    const result = spawnSync("npx", ["--yes", "supabase", ...built.args], {
      encoding: "utf8",
      shell: true,
    });
    if (result.status !== 0) {
      const sanitized = sanitizeCliWriteFailure(result.status, result.stdout ?? "", result.stderr ?? "");
      throw new Error(
        `Authorized Dev HUD write query failed. category=${sanitized.category} postgresCode=${sanitized.postgresCode ?? "none"} httpStatus=${sanitized.httpStatus ?? "none"} exitStatus=${sanitized.exitStatus ?? "none"}`
      );
    }
    const head = statementHead(safeSql);
    if (/zip_crosswalk_versions/i.test(head)) invoked.push("zip_crosswalk_versions");
    if (/zip_county_crosswalk/i.test(head)) invoked.push("zip_county_crosswalk");
  } finally {
    try {
      unlinkSync(file);
    } catch {
      // ignore temp cleanup
    }
  }
}

export type HudWriteProgress = {
  table: "zip_crosswalk_versions" | "zip_county_crosswalk";
  batchIndex: number;
  start: number;
  expected: number;
  preExisting: number;
  postVerified: number;
};

export function applyApprovedHudLoad(
  version: ZipCrosswalkVersionRecord,
  rows: ZipCountyCrosswalkRecord[],
  batches: HudLoadBatch[],
  hooks: {
    assertAbsent: (batchRows: ZipCountyCrosswalkRecord[]) => number;
    assertPresent: (batchRows: ZipCountyCrosswalkRecord[]) => number;
    onBatch: (progress: HudWriteProgress) => void;
    insertVersion?: (version: ZipCrosswalkVersionRecord) => void;
    insertBatch?: (batchRows: ZipCountyCrosswalkRecord[]) => void;
  }
):
  | { ok: true; completed: HudWriteProgress[] }
  | {
      ok: false;
      failed: HudWriteProgress;
      completed: HudWriteProgress[];
      reason: string;
    } {
  if (invoked.some((path) => HUD_FORBIDDEN_TABLES.includes(path as (typeof HUD_FORBIDDEN_TABLES)[number]))) {
    throw new Error("HUD load must not write OFLC tables or county_fips_names.");
  }
  if (version.status === "active") {
    throw new Error("HUD load must not activate the crosswalk version.");
  }
  const completed: HudWriteProgress[] = [];
  try {
    (hooks.insertVersion ?? ((item: ZipCrosswalkVersionRecord) => executeAuthorizedHudWrite(buildVersionInsertSql(item))))(
      version
    );
    const versionProgress: HudWriteProgress = {
      table: "zip_crosswalk_versions",
      batchIndex: 0,
      start: 0,
      expected: 1,
      preExisting: 0,
      postVerified: 1,
    };
    completed.push(versionProgress);
    hooks.onBatch(versionProgress);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "HUD version INSERT failed.";
    return {
      ok: false,
      failed: {
        table: "zip_crosswalk_versions",
        batchIndex: 0,
        start: 0,
        expected: 1,
        preExisting: -1,
        postVerified: -1,
      },
      completed,
      reason,
    };
  }

  const crosswalkBatches = batches.filter((batch) => batch.table === "zip_county_crosswalk");
  for (const batch of crosswalkBatches) {
    const slice = rows.slice(batch.start, batch.start + batch.count);
    const failedBase: HudWriteProgress = {
      table: "zip_county_crosswalk",
      batchIndex: batch.index,
      start: batch.start,
      expected: batch.count,
      preExisting: -1,
      postVerified: -1,
    };
    if (slice.length !== batch.count) {
      return {
        ok: false,
        failed: failedBase,
        completed,
        reason: "HUD crosswalk batch slice does not match expected row count.",
      };
    }
    let preExisting = 0;
    try {
      preExisting = hooks.assertAbsent(slice);
    } catch (err) {
      return {
        ok: false,
        failed: failedBase,
        completed,
        reason: err instanceof Error ? err.message : "HUD pre-write absence check failed.",
      };
    }
    if (preExisting !== 0) {
      return {
        ok: false,
        failed: { ...failedBase, preExisting },
        completed,
        reason: "HUD STATE CHANGED — expected batch keys were already present.",
      };
    }
    try {
      (hooks.insertBatch ?? ((batchRows: ZipCountyCrosswalkRecord[]) => executeAuthorizedHudWrite(buildCrosswalkInsertSql(batchRows))))(
        slice
      );
      const postVerified = hooks.assertPresent(slice);
      const progress: HudWriteProgress = {
        table: "zip_county_crosswalk",
        batchIndex: batch.index,
        start: batch.start,
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
        };
      }
      completed.push(progress);
      hooks.onBatch(progress);
    } catch (err) {
      return {
        ok: false,
        failed: { ...failedBase, preExisting },
        completed,
        reason: err instanceof Error ? err.message : "Authorized Dev HUD write failed.",
      };
    }
  }
  return { ok: true, completed };
}

export type HudResumeProgress = {
  table: "zip_county_crosswalk";
  sourceOffset: number;
  zeroBasedResumeIndex: number;
  oneBasedResumeNumber: number;
  expected: number;
  preExisting: number;
  postVerified: number;
};

export function applyApprovedHudResume(
  rows: ZipCountyCrosswalkRecord[],
  batches: Array<{
    sourceOffset: number;
    zeroBasedResumeIndex: number;
    oneBasedResumeNumber: number;
    count: number;
  }>,
  hooks: {
    assertAbsent: (batchRows: ZipCountyCrosswalkRecord[]) => number;
    assertPresent: (batchRows: ZipCountyCrosswalkRecord[]) => number;
    onBatch: (progress: HudResumeProgress) => void;
    insertBatch?: (batchRows: ZipCountyCrosswalkRecord[]) => void;
  }
):
  | { ok: true; completed: HudResumeProgress[] }
  | {
      ok: false;
      failed: HudResumeProgress;
      completed: HudResumeProgress[];
      reason: string;
      stateChanged: boolean;
    } {
  if (resumeWouldWriteParents(invoked)) {
    throw new Error("HUD resume must not write zip_crosswalk_versions, county_fips_names, or OFLC tables.");
  }
  const completed: HudResumeProgress[] = [];
  for (const batch of batches) {
    const slice = rows.slice(batch.sourceOffset, batch.sourceOffset + batch.count);
    const failedBase: HudResumeProgress = {
      table: "zip_county_crosswalk",
      sourceOffset: batch.sourceOffset,
      zeroBasedResumeIndex: batch.zeroBasedResumeIndex,
      oneBasedResumeNumber: batch.oneBasedResumeNumber,
      expected: batch.count,
      preExisting: -1,
      postVerified: -1,
    };
    if (slice.length !== batch.count) {
      return {
        ok: false,
        failed: failedBase,
        completed,
        reason: "HUD resume batch slice does not match expected row count.",
        stateChanged: false,
      };
    }
    let preExisting = 0;
    try {
      preExisting = hooks.assertAbsent(slice);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "HUD resume pre-write absence check failed.";
      return {
        ok: false,
        failed: failedBase,
        completed,
        reason,
        stateChanged: reason.includes("RESUME STATE CHANGED"),
      };
    }
    if (preExisting !== 0) {
      return {
        ok: false,
        failed: { ...failedBase, preExisting },
        completed,
        reason: "RESUME STATE CHANGED — REVIEW REQUIRED",
        stateChanged: true,
      };
    }
    try {
      (hooks.insertBatch ?? ((batchRows: ZipCountyCrosswalkRecord[]) => executeAuthorizedHudWrite(buildCrosswalkInsertSql(batchRows))))(
        slice
      );
      const postVerified = hooks.assertPresent(slice);
      const progress: HudResumeProgress = {
        table: "zip_county_crosswalk",
        sourceOffset: batch.sourceOffset,
        zeroBasedResumeIndex: batch.zeroBasedResumeIndex,
        oneBasedResumeNumber: batch.oneBasedResumeNumber,
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
      return {
        ok: false,
        failed: { ...failedBase, preExisting },
        completed,
        reason: err instanceof Error ? err.message : "Authorized Dev HUD resume write failed.",
        stateChanged: false,
      };
    }
  }
  return { ok: true, completed };
}
