/**
 * Explicit wage-resume gates. Pure functions. Never writes to a database.
 */
import type { TargetKind } from "./targetGuard";
import type { WageKeyReconcileResult } from "./wageReconcile";

export const AUTHORIZED_WAGE_RESUME_OFFSET = 418000;

export type ResumeWageBatch = {
  sourceOffset: number;
  zeroBasedWageIndex: number;
  oneBasedWageNumber: number;
  count: number;
};

export type WageResumeEvaluation = {
  ok: boolean;
  issues: string[];
  resumeOffset: number | null;
};

export type WageResumeInput = {
  resumeRequested: boolean;
  writeRequested: boolean;
  explicitTarget: string | null | undefined;
  targetKind: TargetKind;
  packageSha256: string;
  expectedSha256: string;
  existingDatasetId: string | null;
  requiredDatasetId: string | null;
  existingStatus: string | null;
  existingActive: boolean;
  matchingShaCount: number;
  reconciled: WageKeyReconcileResult;
  requiredOffset: number;
  authorizedOffset?: number;
  confirmProduction?: boolean;
};

export function remainingWageResumeBatches(
  totalRows: number,
  resumeOffset: number,
  batchSize: number
): ResumeWageBatch[] {
  if (resumeOffset < 0 || batchSize <= 0 || resumeOffset > totalRows) {
    throw new Error("Invalid wage resume range.");
  }
  const batches: ResumeWageBatch[] = [];
  let start = resumeOffset;
  while (start < totalRows) {
    const count = Math.min(batchSize, totalRows - start);
    const zeroBasedWageIndex = Math.floor(start / batchSize);
    batches.push({
      sourceOffset: start,
      zeroBasedWageIndex,
      oneBasedWageNumber: zeroBasedWageIndex + 1,
      count,
    });
    start += count;
  }
  return batches;
}

export function evaluateWageResume(input: WageResumeInput): WageResumeEvaluation {
  const issues: string[] = [];
  const authorizedOffset = input.authorizedOffset ?? AUTHORIZED_WAGE_RESUME_OFFSET;
  if (!input.resumeRequested) issues.push("resume_intent_required");
  if (!input.writeRequested) issues.push("resume_requires_write");
  const explicit = (input.explicitTarget ?? "").trim().toLowerCase();
  if (explicit === "dev") {
    if (input.targetKind === "production") issues.push("production_resume_rejected");
    else if (input.targetKind !== "dev") issues.push("resume_requires_dev");
  } else if (explicit === "production" || explicit === "prod") {
    if (input.confirmProduction !== true) issues.push("production_confirm_required");
    if (input.targetKind !== "production") issues.push("production_ref_mismatch");
  } else {
    issues.push("resume_requires_dev_target");
  }
  if (input.packageSha256.toLowerCase() !== input.expectedSha256.toLowerCase()) issues.push("wrong_package_sha");
  if (!input.existingDatasetId) issues.push("existing_dataset_id_required");
  if (input.requiredDatasetId && input.requiredDatasetId !== input.existingDatasetId) {
    issues.push("wrong_dataset");
  }
  if (input.existingActive) issues.push("active_dataset_rejected");
  if (input.existingStatus !== "failed") issues.push("non_failed_dataset_rejected");
  if (input.matchingShaCount !== 1) issues.push("matching_sha_count_rejected");
  if (!input.reconciled.missingIsContiguousSuffix) issues.push("non_contiguous_missing_rows");
  if (input.reconciled.firstMissingIndex !== input.requiredOffset) issues.push("resume_offset_mismatch");
  if (input.requiredOffset !== authorizedOffset) issues.push("unauthorized_resume_offset");
  if (input.reconciled.unexpected !== 0) issues.push("unexpected_persisted_keys");
  if (input.reconciled.duplicates !== 0) issues.push("duplicate_persisted_keys");
  if (input.reconciled.holesBeforeFirstMissing !== 0) issues.push("holes_before_resume_boundary");
  if (input.reconciled.expected !== 449440) issues.push("unexpected_source_wage_count");
  if (input.reconciled.persisted !== input.requiredOffset) issues.push("persisted_count_mismatch");
  if (input.reconciled.missing !== 31440) issues.push("remaining_count_mismatch");
  return {
    ok: issues.length === 0,
    issues,
    resumeOffset: issues.length === 0 ? input.requiredOffset : null,
  };
}

export function classifyBatchPresence(existingCount: number): "absent" | "state-changed" {
  if (existingCount === 0) return "absent";
  return "state-changed";
}

const PARENT_WRITE_PATHS = [
  "wage_datasets",
  "oflc_occupations",
  "oflc_areas",
  "oflc_area_localities",
] as const;

export function resumeWouldWriteParents(paths: readonly string[]): boolean {
  return paths.some((path) => PARENT_WRITE_PATHS.includes(path as (typeof PARENT_WRITE_PATHS)[number]));
}

export type PostResumeImportedGate = {
  wageDatasets: number;
  occupations: number;
  areas: number;
  localities: number;
  wages: number;
  matchingSha: number;
  datasetStatus: string;
  activeWageDatasets: number;
  expected: number;
  persisted: number;
  matching: number;
  missing: number;
  unexpected: number;
  duplicates: number;
  orphanOccupations: number;
  orphanAreas: number;
  duplicateWageKeys: number;
  blank: number;
  annualWage: number;
  highWage: number;
  noLeveledWage: number;
  other: number;
  fixturesOk: boolean;
  newRows: number;
  completedBatches: number;
  hudCounty: number;
  hudVersions: number;
  hudCrosswalk: number;
};

export function mayMarkDatasetImported(input: PostResumeImportedGate): boolean {
  return (
    input.wageDatasets === 1 &&
    input.occupations === 848 &&
    input.areas === 530 &&
    input.localities === 3275 &&
    input.wages === 449440 &&
    input.matchingSha === 1 &&
    input.datasetStatus === "failed" &&
    input.activeWageDatasets === 0 &&
    input.expected === 449440 &&
    input.persisted === 449440 &&
    input.matching === 449440 &&
    input.missing === 0 &&
    input.unexpected === 0 &&
    input.duplicates === 0 &&
    input.orphanOccupations === 0 &&
    input.orphanAreas === 0 &&
    input.duplicateWageKeys === 0 &&
    input.blank === 410620 &&
    input.annualWage === 32299 &&
    input.highWage === 5866 &&
    input.noLeveledWage === 655 &&
    input.other === 0 &&
    input.fixturesOk === true &&
    input.newRows === 31440 &&
    input.completedBatches === 16 &&
    input.hudCounty === 0 &&
    input.hudVersions === 0 &&
    input.hudCrosswalk === 0
  );
}
