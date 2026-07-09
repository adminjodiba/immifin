export const runtime = "nodejs";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";
import {
  getVisaBulletinHistory,
  VISA_BULLETIN_HISTORY_CACHE_TAG,
} from "@/lib/visaBulletinHistory";
import {
  loadAllVisaBulletinSheets,
  VISA_BULLETIN_SHEETS_CACHE_TAG,
} from "@/lib/visaBulletinSheets";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();

    revalidateTag(VISA_BULLETIN_SHEETS_CACHE_TAG);
    revalidateTag(VISA_BULLETIN_HISTORY_CACHE_TAG);

    const sheets = await loadAllVisaBulletinSheets({ forceRefresh: true });
    const historyRecords = await getVisaBulletinHistory({}, { forceRefresh: true });
    const latestMonth =
      historyRecords.length === 0
        ? null
        : historyRecords.reduce(
            (latest, record) => (record.month > latest ? record.month : latest),
            historyRecords[0].month,
          );
    const auditMetadata = getRequestAuditMetadata(request);

    const rowCounts = {
      FinalActionDates: sheets.FinalActionDates.length,
      DatesForFiling: sheets.DatesForFiling.length,
      PreviousFinalActionDates: sheets.PreviousFinalActionDates.length,
      PreviousDatesForFiling: sheets.PreviousDatesForFiling.length,
      VisaBulletinHistory: historyRecords.length,
    };

    await writeAdminAuditLog({
      actorProfileId: actor.profile.id,
      actorClerkUserId: actor.profile.clerk_user_id,
      actorEmail: actor.profile.email,
      action: "force_sync_visa_bulletin",
      resource: "/api/admin/refresh-visa-bulletin",
      metadata: {
        rowCounts,
        latestMonth,
      },
      ipAddress: auditMetadata.ipAddress,
      userAgent: auditMetadata.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Visa Bulletin sheets refreshed from Google Sheets.",
      metadata: {
        source: "Google Sheets",
        lastUpdated: latestMonth ?? "unknown",
        count:
          rowCounts.FinalActionDates +
          rowCounts.DatesForFiling +
          rowCounts.PreviousFinalActionDates +
          rowCounts.PreviousDatesForFiling,
        rowCounts,
        latestMonth,
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to refresh Visa Bulletin sheets";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
