import { NextResponse } from "next/server";
import { ABUSE_THROTTLED_MESSAGE } from "./abuse.types";

export const ABUSE_RETRY_AFTER_BUCKETS = [30, 60, 120] as const;
export const ABUSE_RETRY_AFTER_MAX_SECONDS = 120;

export function coarsenRetryAfterSeconds(rawSeconds: number): number {
  const safe = Math.max(1, Math.ceil(rawSeconds));
  for (const bucket of ABUSE_RETRY_AFTER_BUCKETS) {
    if (safe <= bucket) {
      return bucket;
    }
  }

  return ABUSE_RETRY_AFTER_MAX_SECONDS;
}

export function createAbuseThrottledResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: ABUSE_THROTTLED_MESSAGE },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(coarsenRetryAfterSeconds(retryAfterSeconds)),
      },
    },
  );
}

