import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { createWriteFreezeResponse, isWriteFrozenError } from "@/lib/platform/writeFreeze";

export function authErrorResponse(error: unknown): NextResponse {
  if (isWriteFrozenError(error)) {
    return createWriteFreezeResponse();
  }

  if (isAuthError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Internal server error";

  return NextResponse.json({ error: message }, { status: 500 });
}
