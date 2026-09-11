import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import type { ImmigrationProfile, Profile } from "@/lib/supabase/types";

export type AccountMeResponse = {
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
};

type AccountMeResult =
  | { ok: true; data: AccountMeResponse }
  | { ok: false; error: string };

let inFlight: Promise<AccountMeResult> | null = null;

/**
 * Shared GET /api/account/me for My Profile sections.
 * Concurrent callers on the same page reuse one in-flight request so Clerk
 * + Supabase work is not repeated three times on first paint.
 */
export function fetchAccountMe(): Promise<AccountMeResult> {
  if (!inFlight) {
    inFlight = (async () => {
      const response = await fetch("/api/account/me");
      return readJsonResponseBody<AccountMeResponse>(response);
    })().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}
