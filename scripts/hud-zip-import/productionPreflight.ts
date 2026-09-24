/**
 * Pure Production HUD preflight and write-authorization.
 * Never writes. Never activates. Never populates county_fips_names.
 * Never modifies OFLC tables.
 */

import { assertLoaderTarget, type TargetKind } from "../oflc-wage-import/targetGuard";

export const HUD_MIGRATION_021_VERSION = "20260919160000";

export const HUD_SCHEMA_TABLES = [
  "zip_crosswalk_versions",
  "zip_county_crosswalk",
  "county_fips_names",
] as const;

export const HUD_OFLC_FORBIDDEN_TABLES = [
  "wage_datasets",
  "oflc_occupations",
  "oflc_areas",
  "oflc_area_localities",
  "oflc_wage_records",
] as const;

export type ProductionHudPreflightInput = {
  hudTablesPresent: readonly string[];
  migration021Present: boolean;
  activeHudCount: number;
  existingVersionCount: number;
  sourceValidated: boolean;
  shaOk: boolean;
  countsOk: boolean;
  parsedOk: boolean;
};

export function evaluateProductionHudPreflight(input: ProductionHudPreflightInput): {
  ok: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  if (!input.migration021Present) issues.push("migration_021_missing");
  for (const table of HUD_SCHEMA_TABLES) {
    if (!input.hudTablesPresent.includes(table)) issues.push(`missing_table_${table}`);
  }
  if (input.activeHudCount > 0) issues.push("active_hud_conflict");
  if (!input.sourceValidated) issues.push("source_validation_failed");
  if (!input.shaOk) issues.push("source_sha_failed");
  if (!input.countsOk) issues.push("source_counts_failed");
  if (!input.parsedOk) issues.push("source_parse_failed");
  return { ok: issues.length === 0, issues };
}

export type HudProductionWriteAuthInput = {
  explicitTarget?: string | null;
  projectRef?: string | null;
  write?: boolean;
  confirmProduction?: boolean;
  writeEnabledInBuild?: boolean;
  sourceValidated: boolean;
  shaOk: boolean;
  countsOk: boolean;
  parsedOk: boolean;
  preflightOk: boolean;
  planOk: boolean;
  activate: boolean;
  versionStatus: string;
  populateCountyFipsNames: boolean;
};

export function evaluateHudProductionWriteAuthorization(input: HudProductionWriteAuthInput): {
  authorized: boolean;
  wouldInvokeWrite: boolean;
  issues: string[];
} {
  const guard = assertLoaderTarget({
    explicitTarget: input.explicitTarget,
    projectRef: input.projectRef,
    write: input.write,
    writeEnabledInBuild: input.writeEnabledInBuild,
    confirmProduction: input.confirmProduction,
  });
  const issues: string[] = [];
  if (!guard.ok) issues.push(...guard.issues.map((item) => item.code));
  if (guard.mode !== "write") issues.push("not_write_mode");
  if (!guard.acceptProduction) issues.push("production_not_accepted");
  if (!input.sourceValidated) issues.push("source_validation_failed");
  if (!input.shaOk) issues.push("source_sha_failed");
  if (!input.countsOk) issues.push("source_counts_failed");
  if (!input.parsedOk) issues.push("source_parse_failed");
  if (!input.preflightOk) issues.push("preflight_failed");
  if (!input.planOk) issues.push("plan_failed");
  if (input.activate) issues.push("activation_forbidden");
  if (activationStatusForbidden(input.versionStatus)) issues.push("active_status_forbidden");
  if (input.populateCountyFipsNames) issues.push("county_fips_names_forbidden");
  const authorized = issues.length === 0;
  return { authorized, wouldInvokeWrite: authorized, issues };
}

export function hudImporterHasActivationPath(): false {
  return false;
}

export function activationStatusForbidden(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "active";
}

export function hudImporterWritesOflc(table: string): boolean {
  return (HUD_OFLC_FORBIDDEN_TABLES as readonly string[]).includes(table);
}

export function hudTargetKindLabel(kind: TargetKind | "missing" | "unsupported"): string {
  if (kind === "production") return "PRODUCTION";
  if (kind === "dev") return "DEV";
  return "UNRESOLVED";
}
