/**
 * Explicit HUD crosswalk-resume gates. Pure functions. Never writes to a database.
 */
import type { TargetKind } from "../oflc-wage-import/targetGuard";
import type { WageKeyReconcileResult } from "../oflc-wage-import/wageReconcile";

export const AUTHORIZED_HUD_RESUME_OFFSET = 35000;
export const AUTHORIZED_HUD_RESUME_REMAINING = 19570;
export const AUTHORIZED_HUD_RESUME_BATCHES = 20;

export type ResumeHudBatch = {
  sourceOffset: number;
  zeroBasedResumeIndex: number;
  oneBasedResumeNumber: number;
  count: number;
};

export type HudResumeEvaluation = {
  ok: boolean;
  issues: string[];
  resumeOffset: number | null;
};

export type HudResumeInput = {
  resumeRequested: boolean;
  writeRequested: boolean;
  explicitTarget: string | null | undefined;
  targetKind: TargetKind;
  confirmProduction?: boolean;
  packageSha256: string;
  expectedSha256: string;
  existingVersionId: string | null;
  requiredVersionId: string | null;
  existingStatus: string | null;
  existingActive: boolean;
  matchingShaCount: number;
  versionCount: number;
  countyFipsNames: number;
  reconciled: WageKeyReconcileResult;
  requiredOffset: number;
  authorizedOffset?: number;
};

export function remainingHudResumeBatches(
  totalRows: number,
  resumeOffset: number,
  batchSize: number
): ResumeHudBatch[] {
  if (resumeOffset < 0 || batchSize <= 0 || resumeOffset > totalRows) {
    throw new Error("Invalid HUD resume range.");
  }
  const batches: ResumeHudBatch[] = [];
  let start = resumeOffset;
  let resumeIndex = 0;
  while (start < totalRows) {
    const count = Math.min(batchSize, totalRows - start);
    batches.push({
      sourceOffset: start,
      zeroBasedResumeIndex: resumeIndex,
      oneBasedResumeNumber: resumeIndex + 1,
      count,
    });
    start += count;
    resumeIndex += 1;
  }
  return batches;
}

export function evaluateHudResume(input: HudResumeInput): HudResumeEvaluation {
  const issues: string[] = [];
  const authorizedOffset = input.authorizedOffset ?? AUTHORIZED_HUD_RESUME_OFFSET;
  if (!input.resumeRequested) issues.push("resume_intent_required");
  if (!input.writeRequested) issues.push("resume_requires_write");
  if ((input.explicitTarget ?? "").trim().toLowerCase() !== "dev") issues.push("resume_requires_dev_target");
  if (input.targetKind === "production") issues.push("production_resume_rejected");
  else if (input.targetKind !== "dev") issues.push("resume_requires_dev");
  if (input.packageSha256.toLowerCase() !== input.expectedSha256.toLowerCase()) issues.push("wrong_package_sha");
  if (!input.existingVersionId) issues.push("existing_version_id_required");
  if (input.requiredVersionId && input.requiredVersionId !== input.existingVersionId) {
    issues.push("wrong_version");
  }
  if (input.existingActive) issues.push("active_version_rejected");
  if (input.existingStatus !== "imported") issues.push("non_imported_version_rejected");
  if (input.matchingShaCount !== 1) issues.push("matching_sha_count_rejected");
  if (input.versionCount !== 1) issues.push("version_count_rejected");
  if (input.countyFipsNames !== 0) issues.push("county_fips_names_not_empty");
  if (!input.reconciled.missingIsContiguousSuffix) issues.push("non_contiguous_missing_rows");
  if (input.reconciled.firstMissingIndex !== input.requiredOffset) issues.push("resume_offset_mismatch");
  if (input.requiredOffset !== authorizedOffset) issues.push("unauthorized_resume_offset");
  if (input.reconciled.unexpected !== 0) issues.push("unexpected_persisted_keys");
  if (input.reconciled.duplicates !== 0) issues.push("duplicate_persisted_keys");
  if (
    input.reconciled.holesBeforeFirstMissing !== 0 ||
    (input.reconciled.firstMissingIndex !== null && input.reconciled.firstMissingIndex < input.requiredOffset)
  ) {
    issues.push("holes_before_resume_boundary");
  }
  if (input.reconciled.expected !== 54570) issues.push("unexpected_source_count");
  if (input.reconciled.persisted !== input.requiredOffset) issues.push("persisted_count_mismatch");
  if (input.reconciled.missing !== AUTHORIZED_HUD_RESUME_REMAINING) issues.push("remaining_count_mismatch");
  return {
    ok: issues.length === 0,
    issues,
    resumeOffset: issues.length === 0 ? input.requiredOffset : null,
  };
}

export function classifyHudBatchPresence(existingCount: number): "absent" | "state-changed" {
  if (existingCount === 0) return "absent";
  return "state-changed";
}

export function resumeWouldWriteParents(paths: readonly string[]): boolean {
  return paths.some(
    (path) =>
      path === "zip_crosswalk_versions" ||
      path === "county_fips_names" ||
      path === "wage_datasets" ||
      path.startsWith("oflc_")
  );
}
