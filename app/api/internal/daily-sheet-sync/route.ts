export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { runDailyGoogleSheetSync } from "@/lib/data/runDailyGoogleSheetSync";

function isAuthorizedScheduledRequest(request: Request): boolean {
  const secret = process.env.DAILY_SHEET_SYNC_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}

/** Cloudflare Worker cron entry. Timezone guard stays on. */
export async function POST(request: Request) {
  if (!isAuthorizedScheduledRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await runDailyGoogleSheetSync({
    skipTimezoneGuard: false,
    request,
  });

  return NextResponse.json({
    success: result.ran && result.results.every((item) => item.success),
    ...result,
  });
}
