import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import type { SubscriptionCapability } from "@/lib/subscription/capabilities";

export const PREMIUM_VISA_BULLETIN_CACHE_CONTROL = "private, no-store";

export type RequireCapabilityFn = (capability: SubscriptionCapability) => Promise<unknown>;

export function premiumVisaBulletinJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": PREMIUM_VISA_BULLETIN_CACHE_CONTROL },
  });
}

export function premiumVisaBulletinAuthError(error: unknown): NextResponse {
  const response = authErrorResponse(error);
  response.headers.set("Cache-Control", PREMIUM_VISA_BULLETIN_CACHE_CONTROL);
  return response;
}
