/**
 * Planned Dev HUD load: one non-active version, all official crosswalk rows,
 * no county_fips_names, no winner-selection, no OFLC writes.
 * Pure functions. Never writes to a database.
 */

import { chunkSizes } from "../oflc-wage-import/loadPlan";
import {
  EXPECTED_HUD_COUNTS,
  EXPECTED_HUD_PACKAGE_SHA256,
  EXPECTED_PLACEHOLDER_GEOIDS,
  HUD_CROSSWALK_BATCH_SIZE,
  HUD_LOAD_TABLES,
} from "./constants";
import type { HudImportResult, ImportIssue, ZipCrosswalkVersionRecord } from "./types";

export type ExistingHudVersionRow = {
  id: string;
  package_sha256: string | null;
  status: string;
};

export type HudLoadBatch = {
  table: (typeof HUD_LOAD_TABLES)[number];
  index: number;
  start: number;
  count: number;
};

export type HudRerunDecision = {
  allowed: boolean;
  action: "insert-new" | "reject-duplicate" | "reject-existing";
  reason: string;
};

export type HudLoadPlan = {
  ok: boolean;
  write: false;
  activate: false;
  populateCountyFipsNames: false;
  datasetStatus: "imported" | "failed";
  packageSha256: string;
  version: ZipCrosswalkVersionRecord;
  futureLoadOrder: readonly string[];
  batches: HudLoadBatch[];
  totals: {
    zip_crosswalk_versions: 1;
    county_fips_names: 0;
    zip_county_crosswalk: number;
    crosswalk_batches: number;
    crosswalk_batch_size: number;
  };
  rerun: HudRerunDecision;
  issues: ImportIssue[];
};

function issue(code: string, message: string): ImportIssue {
  return { severity: "error", code, message };
}

export function evaluateHudActiveVersionSafety(existing: ExistingHudVersionRow[]): {
  archiveActive: false;
  replaceActive: false;
  activate: false;
  allowedNewImported: boolean;
  reason: string;
} {
  const hasActive = existing.some((row) => row.status === "active");
  if (hasActive) {
    return {
      archiveActive: false,
      replaceActive: false,
      activate: false,
      allowedNewImported: false,
      reason:
        "An active HUD version exists. The importer will not archive, replace, or activate it.",
    };
  }
  if (existing.length > 0) {
    return {
      archiveActive: false,
      replaceActive: false,
      activate: false,
      allowedNewImported: false,
      reason: "HUD versions already exist. Additional versions are rejected by the current lifecycle policy.",
    };
  }
  return {
    archiveActive: false,
    replaceActive: false,
    activate: false,
    allowedNewImported: true,
    reason: "No existing HUD version. A new non-active imported version may be inserted when write gates pass.",
  };
}

export function evaluateHudRerun(existing: ExistingHudVersionRow[], packageSha256: string): HudRerunDecision {
  const sha = packageSha256.toLowerCase();
  const sameSha = existing.filter((row) => (row.package_sha256 ?? "").toLowerCase() === sha);
  if (sameSha.length > 0) {
    return {
      allowed: false,
      action: "reject-duplicate",
      reason: "This official HUD package SHA-256 is already present. A rerun must not silently duplicate it.",
    };
  }
  if (existing.length > 0) {
    return {
      allowed: false,
      action: "reject-existing",
      reason: "HUD crosswalk versions already exist. An unapproved additional version is forbidden.",
    };
  }
  return {
    allowed: true,
    action: "insert-new",
    reason: "No prior HUD version. Future write would insert status=imported only.",
  };
}

export function validateOfficialHud(result: HudImportResult): ImportIssue[] {
  const issues: ImportIssue[] = [];
  if (result.version.package_sha256.toLowerCase() !== EXPECTED_HUD_PACKAGE_SHA256) {
    issues.push(issue("sha256_mismatch", "Package SHA-256 does not match the official HUD 2026 Q2 digest."));
  }
  if (result.counts.rows !== EXPECTED_HUD_COUNTS.rows) {
    issues.push(issue("unexpected_counts", `Rows ${result.counts.rows} != ${EXPECTED_HUD_COUNTS.rows}`));
  }
  if (result.counts.uniqueZips !== EXPECTED_HUD_COUNTS.uniqueZips) {
    issues.push(issue("unexpected_counts", `Unique ZIPs ${result.counts.uniqueZips} != ${EXPECTED_HUD_COUNTS.uniqueZips}`));
  }
  if (result.counts.uniqueCountyFips !== EXPECTED_HUD_COUNTS.uniqueCountyFips) {
    issues.push(
      issue(
        "unexpected_counts",
        `Unique county FIPS ${result.counts.uniqueCountyFips} != ${EXPECTED_HUD_COUNTS.uniqueCountyFips}`
      )
    );
  }
  if (result.counts.duplicateSourceKeys !== EXPECTED_HUD_COUNTS.duplicateSourceKeys) {
    issues.push(issue("duplicate_key", `Duplicate source keys ${result.counts.duplicateSourceKeys} != 0`));
  }
  if (result.counts.malformedZips !== EXPECTED_HUD_COUNTS.malformedZips) {
    issues.push(issue("malformed_zip", `Malformed ZIPs ${result.counts.malformedZips} != 0`));
  }
  if (result.counts.zeroBusRatioRows !== EXPECTED_HUD_COUNTS.zeroBusRatioRows) {
    issues.push(
      issue("unexpected_counts", `Zero BUS_RATIO rows ${result.counts.zeroBusRatioRows} != ${EXPECTED_HUD_COUNTS.zeroBusRatioRows}`)
    );
  }
  if (result.counts.multiCountyZips !== EXPECTED_HUD_COUNTS.multiCountyZips) {
    issues.push(
      issue("unexpected_counts", `Multi-county ZIPs ${result.counts.multiCountyZips} != ${EXPECTED_HUD_COUNTS.multiCountyZips}`)
    );
  }
  if (result.counts.maxCountiesPerZip !== EXPECTED_HUD_COUNTS.maxCountiesPerZip) {
    issues.push(
      issue("unexpected_counts", `Max counties/ZIP ${result.counts.maxCountiesPerZip} != ${EXPECTED_HUD_COUNTS.maxCountiesPerZip}`)
    );
  }
  if (result.counts.busResPrimaryDiffer !== EXPECTED_HUD_COUNTS.busResPrimaryDiffer) {
    issues.push(
      issue(
        "unexpected_counts",
        `BUS vs RES primary differ ${result.counts.busResPrimaryDiffer} != ${EXPECTED_HUD_COUNTS.busResPrimaryDiffer}`
      )
    );
  }
  if (result.counts.placeholderGeoidRows !== EXPECTED_HUD_COUNTS.placeholderGeoidRows) {
    issues.push(
      issue(
        "placeholder_geoid",
        `Placeholder GEOID rows ${result.counts.placeholderGeoidRows} != ${EXPECTED_HUD_COUNTS.placeholderGeoidRows}`
      )
    );
  }
  for (const fips of EXPECTED_PLACEHOLDER_GEOIDS) {
    if (!result.counts.placeholderGeoids.includes(fips)) {
      issues.push(issue("placeholder_geoid", `Official placeholder GEOID ${fips} was not preserved.`));
    }
  }
  if (result.version.status === "active") {
    issues.push(issue("auto_activate_forbidden", "Parsed HUD version must not be active."));
  }
  if (
    Array.isArray(result.rows) &&
    result.rows.some((row) => "resolution" in row || "oflc_area" in row || "user_wage_level" in row)
  ) {
    issues.push(issue("winner_selection_forbidden", "Runtime winner-selection fields are not allowed on import rows."));
  }
  if (result.rows.length !== result.counts.rows) {
    issues.push(issue("unexpected_counts", "Parsed row array length does not match counted rows."));
  }
  return issues;
}

export function buildHudTableBatches(
  table: HudLoadBatch["table"],
  total: number,
  size: number,
  startIndex: number
): HudLoadBatch[] {
  const sizes = chunkSizes(total, size);
  let cursor = 0;
  return sizes.map((count, i) => {
    const batch: HudLoadBatch = {
      table,
      index: startIndex + i,
      start: cursor,
      count,
    };
    cursor += count;
    return batch;
  });
}

export function buildHudLoadPlan(
  result: HudImportResult,
  existing: ExistingHudVersionRow[] = []
): HudLoadPlan {
  const issues: ImportIssue[] = [
    ...validateOfficialHud(result),
    ...result.issues.filter((item) => item.severity === "error"),
  ];
  const rerun = evaluateHudRerun(existing, result.version.package_sha256);
  if (!rerun.allowed) {
    issues.push(issue("duplicate_dataset", rerun.reason));
  }

  const version: ZipCrosswalkVersionRecord = {
    ...result.version,
    census_gazetteer_vintage: null,
    status: issues.length === 0 && result.ok ? "imported" : "failed",
    imported_at: null,
    validation_report: {
      rows: result.counts.rows,
      unique_zips: result.counts.uniqueZips,
      unique_county_fips: result.counts.uniqueCountyFips,
      duplicate_source_keys: result.counts.duplicateSourceKeys,
      malformed_zips: result.counts.malformedZips,
      zero_bus_ratio_rows: result.counts.zeroBusRatioRows,
      multi_county_zips: result.counts.multiCountyZips,
      max_counties_per_zip: result.counts.maxCountiesPerZip,
      bus_res_primary_differ: result.counts.busResPrimaryDiffer,
      placeholder_geoid_rows: result.counts.placeholderGeoidRows,
      unmatched_locality_count: result.join?.notJoined ?? result.version.unmatched_locality_count,
      populate_county_fips_names: false,
      activate: false,
    },
  };

  const crosswalkBatches = buildHudTableBatches(
    "zip_county_crosswalk",
    result.rows.length,
    HUD_CROSSWALK_BATCH_SIZE,
    1
  );
  const covered = crosswalkBatches.reduce((sum, batch) => sum + batch.count, 0);
  if (covered !== result.rows.length) {
    issues.push(issue("batch_incomplete", `Crosswalk batches cover ${covered} of ${result.rows.length} records`));
  }

  const ok = issues.length === 0 && result.ok && rerun.allowed && version.status !== "active";
  return {
    ok,
    write: false,
    activate: false,
    populateCountyFipsNames: false,
    datasetStatus: ok ? "imported" : "failed",
    packageSha256: result.version.package_sha256.toLowerCase(),
    version,
    futureLoadOrder: ["zip_crosswalk_versions", "zip_county_crosswalk"],
    batches: [{ table: "zip_crosswalk_versions", index: 0, start: 0, count: 1 }, ...crosswalkBatches],
    totals: {
      zip_crosswalk_versions: 1,
      county_fips_names: 0,
      zip_county_crosswalk: result.rows.length,
      crosswalk_batches: crosswalkBatches.length,
      crosswalk_batch_size: HUD_CROSSWALK_BATCH_SIZE,
    },
    rerun,
    issues,
  };
}
