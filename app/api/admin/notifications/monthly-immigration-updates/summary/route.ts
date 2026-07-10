export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { buildMonthlyUpdateAudienceSummary } from "@/lib/notifications/monthly-update-control-center";

export async function GET() {
  try {
    await requireAdmin();
    const summary = await buildMonthlyUpdateAudienceSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("[admin] monthly-immigration-updates summary failed:", error);
    return NextResponse.json(
      {
        success: false,
        errorCode: "MONTHLY_UPDATE_SUMMARY_FAILED",
        errorMessage: "Failed to load Monthly Immigration Updates summary.",
      },
      { status: 500 }
    );
  }
}
