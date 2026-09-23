/**
 * Pure Production preflight. Never writes. Never activates.
 */

import { H1B_OFLC_TABLES } from "./constants";
import { OFLC_ALL_INDUSTRIES_DATA_SOURCE } from "./types";

export const MIGRATION_021_VERSION = "20260919160000";

export type ProductionPreflightInput = {
  oflcTablesPresent: readonly string[];
  migration021Present: boolean;
  activeAllIndustriesCount: number;
  activeSameShaCount: number;
  sourceValidated: boolean;
  shaOk: boolean;
  countsOk: boolean;
  parsedOk: boolean;
};

export function evaluateProductionPreflight(input: ProductionPreflightInput): {
  ok: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  if (!input.migration021Present) issues.push("migration_021_missing");
  for (const table of H1B_OFLC_TABLES) {
    if (!input.oflcTablesPresent.includes(table)) issues.push(`missing_table_${table}`);
  }
  if (input.activeSameShaCount > 0) issues.push("active_same_sha_conflict");
  if (!input.sourceValidated) issues.push("source_validation_failed");
  if (!input.shaOk) issues.push("source_sha_failed");
  if (!input.countsOk) issues.push("source_counts_failed");
  if (!input.parsedOk) issues.push("source_parse_failed");
  return { ok: issues.length === 0, issues };
}

export function importerHasActivationPath(): false {
  return false;
}

export function activationStatusForbidden(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "active";
}

export const APPROVED_PRODUCTION_DATA_SOURCE = OFLC_ALL_INDUSTRIES_DATA_SOURCE;
