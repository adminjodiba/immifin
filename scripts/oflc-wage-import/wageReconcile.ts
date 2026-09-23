/**
 * Pure wage-key reconciliation and global-vs-wage batch numbering.
 * Never connects to a database.
 */

export const WAGE_RECORD_KEY_SEPARATOR = "|";

export function wageRecordKey(area_code: string, soc_code: string): string {
  return `${area_code}${WAGE_RECORD_KEY_SEPARATOR}${soc_code}`;
}

export type GlobalWageBatchRef = {
  globalIndex: number;
  zeroBasedWageIndex: number;
  oneBasedWageNumber: number;
  sourceOffset: number;
  sourceEndExclusive: number;
  count: number;
};

/** Map a global LoadBatch.index onto wage-only coordinates. */
export function wageBatchFromGlobalIndex(
  globalIndex: number,
  firstWageGlobalIndex: number,
  batchSize: number,
  totalWageRows: number
): GlobalWageBatchRef {
  if (globalIndex < firstWageGlobalIndex) {
    throw new Error("globalIndex is not a wage-record batch.");
  }
  const zeroBasedWageIndex = globalIndex - firstWageGlobalIndex;
  const sourceOffset = zeroBasedWageIndex * batchSize;
  const remaining = totalWageRows - sourceOffset;
  const count = Math.min(batchSize, remaining);
  return {
    globalIndex,
    zeroBasedWageIndex,
    oneBasedWageNumber: zeroBasedWageIndex + 1,
    sourceOffset,
    sourceEndExclusive: sourceOffset + count,
    count,
  };
}

export function firstWageGlobalIndex(occupationBatches: number, areaBatches: number, localityBatches: number): number {
  return 1 + occupationBatches + areaBatches + localityBatches;
}

export type WageKeyReconcileResult = {
  expected: number;
  persisted: number;
  matching: number;
  missing: number;
  unexpected: number;
  duplicates: number;
  firstMissingIndex: number | null;
  holesBeforeFirstMissing: number;
  missingIsContiguousSuffix: boolean;
  remaining: number;
};

export function reconcileOrderedWageKeys(
  sourceKeys: readonly string[],
  persistedKeys: readonly string[]
): WageKeyReconcileResult {
  const persistedSet = new Set<string>();
  let duplicates = 0;
  for (const key of persistedKeys) {
    if (persistedSet.has(key)) duplicates += 1;
    else persistedSet.add(key);
  }

  let matching = 0;
  let firstMissingIndex: number | null = null;
  let holesBeforeFirstMissing = 0;
  const missingIndexes: number[] = [];
  for (let i = 0; i < sourceKeys.length; i += 1) {
    const key = sourceKeys[i];
    if (!key) continue;
    if (persistedSet.has(key)) {
      matching += 1;
      continue;
    }
    missingIndexes.push(i);
    if (firstMissingIndex === null) firstMissingIndex = i;
    else if (i < firstMissingIndex) holesBeforeFirstMissing += 1;
  }
  if (firstMissingIndex !== null) {
    holesBeforeFirstMissing = missingIndexes.filter((i) => i < firstMissingIndex).length;
  }

  let unexpected = 0;
  const sourceSet = new Set(sourceKeys);
  for (const key of persistedSet) {
    if (!sourceSet.has(key)) unexpected += 1;
  }

  const missing = sourceKeys.length - matching;
  const missingIsContiguousSuffix =
    firstMissingIndex !== null &&
    missingIndexes.length === sourceKeys.length - firstMissingIndex &&
    missingIndexes[0] === firstMissingIndex &&
    missingIndexes[missingIndexes.length - 1] === sourceKeys.length - 1 &&
    holesBeforeFirstMissing === 0 &&
    unexpected === 0 &&
    duplicates === 0 &&
    matching === firstMissingIndex;

  return {
    expected: sourceKeys.length,
    persisted: persistedKeys.length,
    matching,
    missing,
    unexpected,
    duplicates,
    firstMissingIndex,
    holesBeforeFirstMissing,
    missingIsContiguousSuffix,
    remaining: missing,
  };
}
