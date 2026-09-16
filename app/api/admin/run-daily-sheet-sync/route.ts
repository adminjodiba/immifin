export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  DAILY_SHEET_SYNC_CRON_UTC,
  getChicagoClock,
  isChicagoDailySyncMinute,
} from "@/lib/data/dailySheetSyncTimezone";
import { SCHEDULED_SHEET_SYNC_ACTOR } from "@/lib/data/googleSheetRefresh";
import { runDailyGoogleSheetSync } from "@/lib/data/runDailyGoogleSheetSync";

/** Timezone probe only — does not refresh Sheets. */
export async function GET() {
  try {
    await requireAdmin();
    const now = new Date();
    return NextResponse.json({
      nowIso: now.toISOString(),
      chicago: getChicagoClock(now),
      wouldRunNow: isChicagoDailySyncMinute(now),
      target: "12:01 AM America/Chicago",
      utcCrons: DAILY_SHEET_SYNC_CRON_UTC,
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message = error instanceof Error ? error.message : "Failed to read daily sync clock";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * Local/dev invocation of the same scheduled handler (skips the 12:01 AM guard).
 * Does not change production cron behavior.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const result = await runDailyGoogleSheetSync({
      skipTimezoneGuard: true,
      actor: SCHEDULED_SHEET_SYNC_ACTOR,
      request,
    });

    return NextResponse.json({
      success: result.ran && result.results.every((item) => item.success),
      ...result,
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to run daily Google Sheet sync";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
