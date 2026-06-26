import { NextResponse } from "next/server";
import { AuthError, isAuthError } from "@/lib/auth/errors";

export function authErrorResponse(error: unknown): NextResponse {
  if (isAuthError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Internal server error";

  return NextResponse.json({ error: message }, { status: 500 });
}
