import { NextResponse } from "next/server";

export const WRITE_FREEZE_ENV = "IMMIFIN_WRITE_FREEZE";
export const WRITE_FREEZE_CODE = "IMMIFIN_WRITE_FROZEN" as const;
export const WRITE_FREEZE_MESSAGE =
  "IMMIFIN is undergoing brief scheduled maintenance. Please try again shortly.";
export const WRITE_FREEZE_RETRY_AFTER_SECONDS = "120";

export const MUTATING_SUPABASE_RPCS = [
  "upsert_profile_from_clerk",
  "soft_delete_profile_by_clerk_id",
  "set_profile_role",
  "claim_stripe_webhook_event",
  "complete_stripe_webhook_event",
  "fail_stripe_webhook_event",
] as const;

const MUTATING_RPC_SET = new Set<string>(MUTATING_SUPABASE_RPCS);

export class WriteFrozenError extends Error {
  readonly name = "WriteFrozenError";
  readonly code = WRITE_FREEZE_CODE;
  readonly status = 503;

  constructor(message = WRITE_FREEZE_MESSAGE) {
    super(message);
    this.name = "WriteFrozenError";
  }
}

export function isWriteFrozenError(error: unknown): error is WriteFrozenError {
  if (error instanceof WriteFrozenError) {
    return true;
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === WRITE_FREEZE_CODE
  );
}

/**
 * Runtime write-freeze flag. Evaluated on every call so a Worker secret/var
 * toggle can take effect without capturing the value at module import.
 */
export function isWriteFreezeEnabled(): boolean {
  const raw = process.env[WRITE_FREEZE_ENV];
  if (raw === undefined) {
    return false;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
}

export function isMutatingSupabaseRpc(name: string): boolean {
  return MUTATING_RPC_SET.has(name);
}

export function createWriteFreezeResponse(): NextResponse {
  return NextResponse.json(
    { error: WRITE_FREEZE_MESSAGE },
    {
      status: 503,
      headers: { "Retry-After": WRITE_FREEZE_RETRY_AFTER_SECONDS },
    },
  );
}
