/**
 * Fail-closed guard: this loader may only issue SELECT-style SQL.
 * Never used to authorize writes.
 */

const MUTATION_RE =
  /\b(insert|update|upsert|delete|truncate|alter|drop|create|grant|revoke|call|do|copy|refresh|vacuum)\b/i;

/** Authorized by S7A-H1BWAGE-OFLC-DEV-LOAD-002. Default CLI is still no-write unless --write. */
export const WRITE_ENABLED_IN_BUILD = true;

export function assertReadOnlySql(sql: string): string {
  if (MUTATION_RE.test(sql)) {
    throw new Error("Read-only SQL rejected: mutation keyword is not allowed in this loader.");
  }
  return sql;
}

export function isMutationSql(sql: string): boolean {
  return MUTATION_RE.test(sql);
}

/** Future write entrypoints. Empty in this no-write build. */
export function mutationPathsInvoked(): string[] {
  return [];
}
