/**
 * Planned Dev load: batches, expected-count gates, rerun rules, no auto-activate.
 * Pure functions. Never writes to a database.
 */

import {
  EXPECTED_OFFICIAL_COUNTS,
  EXPECTED_OFFICIAL_GEOGRAPHY,
  EXPECTED_OFFICIAL_LABELS,
  EXPECTED_OFFICIAL_PACKAGE_SHA256,
  FUTURE_LOAD_ORDER,
  H1B_OFLC_TABLES,
  WAGE_RECORD_BATCH_SIZE,
} from "./constants";
import {
  EXPECTED_OFLC_2026_27,
  OFLC_ALL_INDUSTRIES_DATA_SOURCE,
  type ImportIssue,
  type OflcImportResult,
} from "./types";

export type ExistingDatasetRow = {
  id: string;
  package_sha256: string;
  data_source: string;
  status: string;
};

export type LoadBatch = {
  table: (typeof H1B_OFLC_TABLES)[number];
  index: number;
  start: number;
  count: number;
};

export type RerunDecision = {
  allowed: boolean;
  action: "insert-new" | "retry-failed" | "reject-duplicate" | "reject-active";
  reason: string;
};

export type LoadPlan = {
  ok: boolean;
  write: false;
  activate: false;
  datasetStatus: "imported" | "failed";
  packageSha256: string;
  futureLoadOrder: readonly string[];
  batches: LoadBatch[];
  totals: {
    wage_datasets: 1;
    occupations: number;
    areas: number;
    localities: number;
    wage_records: number;
    wage_record_batches: number;
  };
  rerun: RerunDecision;
  issues: ImportIssue[];
};

function issue(code: string, message: string): ImportIssue {
  return { severity: "error", code, message };
}

export function chunkSizes(total: number, size: number): number[] {
  if (total < 0) throw new Error("total must be >= 0");
  if (size <= 0) throw new Error("batch size must be > 0");
  if (total === 0) return [];
  const sizes: number[] = [];
  let remaining = total;
  while (remaining > 0) {
    const next = Math.min(size, remaining);
    sizes.push(next);
    remaining -= next;
  }
  return sizes;
}

export function buildTableBatches(
  table: LoadBatch["table"],
  total: number,
  size: number,
  startIndex: number
): LoadBatch[] {
  const sizes = chunkSizes(total, size);
  let cursor = 0;
  return sizes.map((count, i) => {
    const batch: LoadBatch = {
      table,
      index: startIndex + i,
      start: cursor,
      count,
    };
    cursor += count;
    return batch;
  });
}

export function evaluateRerun(
  existing: ExistingDatasetRow[],
  packageSha256: string,
  dataSource: string = OFLC_ALL_INDUSTRIES_DATA_SOURCE
): RerunDecision {
  const sha = packageSha256.toLowerCase();
  const sameSha = existing.filter((row) => row.package_sha256.toLowerCase() === sha);
  const activeSameSha = sameSha.find((row) => row.status === "active");
  if (activeSameSha) {
    return {
      allowed: false,
      action: "reject-active",
      reason: "An active dataset with this package SHA-256 already exists. Automatic replace/archive is forbidden.",
    };
  }
  const importedSameSha = sameSha.find((row) => row.status === "imported");
  if (importedSameSha) {
    return {
      allowed: false,
      action: "reject-duplicate",
      reason: "This official package is already imported. A rerun must not silently duplicate it.",
    };
  }
  const failedSameSha = sameSha.find((row) => row.status === "failed");
  if (failedSameSha) {
    return {
      allowed: true,
      action: "retry-failed",
      reason: "A prior failed import of this SHA-256 may be retried. It still cannot auto-activate.",
    };
  }
  const activeSameSource = existing.find(
    (row) => row.data_source === dataSource && row.status === "active"
  );
  if (activeSameSource) {
    return {
      allowed: true,
      action: "insert-new",
      reason: "An active dataset for this data_source exists. A new imported revision is allowed; it will not replace the active row.",
    };
  }
  return {
    allowed: true,
    action: "insert-new",
    reason: "No prior row for this package SHA-256. Future write would insert status=imported only.",
  };
}

export function validateOfficialDataset(result: OflcImportResult): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const sha = result.dataset.package_sha256.toLowerCase();
  if (sha !== EXPECTED_OFFICIAL_PACKAGE_SHA256) {
    issues.push(
      issue(
        "source_hash_mismatch",
        `Package SHA-256 does not match the official OFLC 2026-27 digest.`
      )
    );
  }
  if (result.dataset.data_source !== OFLC_ALL_INDUSTRIES_DATA_SOURCE) {
    issues.push(issue("unsupported_data_source", "V1 accepts All Industries only. ACWIA is not imported."));
  }
  if (result.dataset.wage_year !== EXPECTED_OFLC_2026_27.wageYear) {
    issues.push(
      issue(
        "unsupported_wage_year",
        `Unsupported wage year ${result.dataset.wage_year}. Only ${EXPECTED_OFLC_2026_27.wageYear} is accepted.`
      )
    );
  }
  if (
    result.dataset.effective_start !== EXPECTED_OFLC_2026_27.effectiveStart ||
    result.dataset.effective_end !== EXPECTED_OFLC_2026_27.effectiveEnd
  ) {
    issues.push(issue("unsupported_wage_year", "Official 2026-27 effective dates do not match."));
  }
  if (result.occupations.length !== EXPECTED_OFFICIAL_COUNTS.occupations) {
    issues.push(
      issue(
        "unexpected_counts",
        `Occupations ${result.occupations.length} != ${EXPECTED_OFFICIAL_COUNTS.occupations}`
      )
    );
  }
  if (result.areas.length !== EXPECTED_OFFICIAL_COUNTS.areas) {
    issues.push(
      issue("unexpected_counts", `Areas ${result.areas.length} != ${EXPECTED_OFFICIAL_COUNTS.areas}`)
    );
  }
  if (result.localities.length !== EXPECTED_OFFICIAL_COUNTS.localities) {
    issues.push(
      issue(
        "unexpected_counts",
        `Localities ${result.localities.length} != ${EXPECTED_OFFICIAL_COUNTS.localities}`
      )
    );
  }
  if (result.wageRecords.length !== EXPECTED_OFFICIAL_COUNTS.wage_records) {
    issues.push(
      issue(
        "unexpected_counts",
        `Wage records ${result.wageRecords.length} != ${EXPECTED_OFFICIAL_COUNTS.wage_records}`
      )
    );
  }
  for (const [key, expected] of Object.entries(EXPECTED_OFFICIAL_LABELS)) {
    const actual = result.labelDistribution[key] ?? 0;
    if (actual !== expected) {
      issues.push(issue("unexpected_label", `Label ${key} ${actual} != ${expected}`));
    }
  }
  if (result.otherLabels.length > 0) {
    issues.push(issue("unexpected_label", `Unexpected official labels: ${result.otherLabels.join(", ")}`));
  }
  if (result.fipsResolution.resolved !== EXPECTED_OFFICIAL_GEOGRAPHY.resolved) {
    issues.push(
      issue(
        "unexpected_counts",
        `Resolved FIPS ${result.fipsResolution.resolved} != ${EXPECTED_OFFICIAL_GEOGRAPHY.resolved}`
      )
    );
  }
  if (result.fipsResolution.nullGuVi !== EXPECTED_OFFICIAL_GEOGRAPHY.nullGuVi) {
    issues.push(
      issue(
        "unexpected_counts",
        `GU/VI null FIPS ${result.fipsResolution.nullGuVi} != ${EXPECTED_OFFICIAL_GEOGRAPHY.nullGuVi}`
      )
    );
  }
  if (result.fipsResolution.unmatched !== EXPECTED_OFFICIAL_GEOGRAPHY.unmatched) {
    issues.push(
      issue("unexpected_counts", `Unmatched geography ${result.fipsResolution.unmatched} != 0`)
    );
  }
  if (result.dataset.status === "active") {
    issues.push(issue("auto_activate_forbidden", "Parsed dataset must not be active."));
  }
  if (result.dataset.activated_at !== null || result.dataset.activated_by_clerk_user_id !== null) {
    issues.push(issue("auto_activate_forbidden", "Activation fields must remain unused during load planning."));
  }
  return issues;
}

export function validateFkPlan(result: OflcImportResult): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const datasetId = result.dataset.id;
  const occs = new Set(result.occupations.map((o) => o.soc_code));
  const areas = new Set(result.areas.map((a) => a.area_code));
  if (result.occupations.some((o) => o.dataset_id !== datasetId)) {
    issues.push(issue("fk_inconsistency", "Occupation dataset_id does not match planned wage_datasets.id"));
  }
  if (result.areas.some((a) => a.dataset_id !== datasetId)) {
    issues.push(issue("fk_inconsistency", "Area dataset_id does not match planned wage_datasets.id"));
  }
  for (const loc of result.localities) {
    if (loc.dataset_id !== datasetId || !areas.has(loc.area_code)) {
      issues.push(issue("fk_inconsistency", `Locality ${loc.area_code}/${loc.county_town_name} fails area FK`));
      break;
    }
  }
  for (const wage of result.wageRecords) {
    if (
      wage.dataset_id !== datasetId ||
      wage.data_source !== result.dataset.data_source ||
      !areas.has(wage.area_code) ||
      !occs.has(wage.soc_code)
    ) {
      issues.push(
        issue("fk_inconsistency", `Wage ${wage.area_code}/${wage.soc_code} fails dataset/area/occupation FK`)
      );
      break;
    }
  }
  return issues;
}

export function evaluateSchemaCompatibility(publicTables: string[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  const have = new Set(publicTables);
  for (const table of H1B_OFLC_TABLES) {
    if (!have.has(table)) {
      issues.push(issue("unexpected_schema", `Dev is missing required table ${table}`));
    }
  }
  return issues;
}

export function buildLoadPlan(
  result: OflcImportResult,
  existing: ExistingDatasetRow[] = [],
  options: { officialGate?: boolean } = {}
): LoadPlan {
  const officialGate = options.officialGate !== false;
  const issues: ImportIssue[] = [
    ...(officialGate ? validateOfficialDataset(result) : []),
    ...validateFkPlan(result),
    ...result.issues.filter((item) => item.severity === "error"),
  ];

  const rerun = evaluateRerun(existing, result.dataset.package_sha256, result.dataset.data_source);
  if (!rerun.allowed) {
    issues.push(issue("duplicate_dataset", rerun.reason));
  }

  const occupationBatches = buildTableBatches("oflc_occupations", result.occupations.length, 1000, 1);
  const areaBatches = buildTableBatches("oflc_areas", result.areas.length, 1000, 1 + occupationBatches.length);
  const localityBatches = buildTableBatches(
    "oflc_area_localities",
    result.localities.length,
    WAGE_RECORD_BATCH_SIZE,
    1 + occupationBatches.length + areaBatches.length
  );
  const wageBatches = buildTableBatches(
    "oflc_wage_records",
    result.wageRecords.length,
    WAGE_RECORD_BATCH_SIZE,
    1 + occupationBatches.length + areaBatches.length + localityBatches.length
  );

  const batches: LoadBatch[] = [
    { table: "wage_datasets", index: 0, start: 0, count: 1 },
    ...occupationBatches,
    ...areaBatches,
    ...localityBatches,
    ...wageBatches,
  ];

  const wageBatchSum = wageBatches.reduce((sum, batch) => sum + batch.count, 0);
  if (wageBatchSum !== result.wageRecords.length) {
    issues.push(
      issue(
        "batch_incomplete",
        `Wage batches cover ${wageBatchSum} of ${result.wageRecords.length} records`
      )
    );
  }

  const datasetStatus = issues.length === 0 && result.ok ? "imported" : "failed";

  return {
    ok: issues.length === 0 && result.ok && rerun.allowed,
    write: false,
    activate: false,
    datasetStatus,
    packageSha256: result.dataset.package_sha256.toLowerCase(),
    futureLoadOrder: FUTURE_LOAD_ORDER,
    batches,
    totals: {
      wage_datasets: 1,
      occupations: result.occupations.length,
      areas: result.areas.length,
      localities: result.localities.length,
      wage_records: result.wageRecords.length,
      wage_record_batches: wageBatches.length,
    },
    rerun,
    issues,
  };
}
