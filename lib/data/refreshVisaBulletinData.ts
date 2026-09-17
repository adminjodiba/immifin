import { revalidatePath, revalidateTag } from "next/cache";
import { isDevVisaBulletinFixtureActive } from "@/lib/visaBulletinDevFixture";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";
import {
  type GoogleSheetRefreshActor,
  type GoogleSheetRefreshTrigger,
  type VisaBulletinRefreshMetadata,
} from "@/lib/data/googleSheetRefresh";
import {
  getVisaBulletinHistory,
  VISA_BULLETIN_HISTORY_CACHE_TAG,
} from "@/lib/visaBulletinHistory";
import {
  loadAllVisaBulletinSheets,
  VISA_BULLETIN_SHEETS_CACHE_TAG,
} from "@/lib/visaBulletinSheets";

const PUBLIC_BULLETIN_PATHS = [
  "/api/visa-bulletin",
  "/api/visa-bulletin-history",
  "/api/visa-bulletin-movement",
  "/api/admin/debug-history",
  "/immigration/visa-bulletin",
  "/immigration/visa-bulletin-movement",
  "/immigration/visa-bulletin-movement-2",
  "/immigration/visa-bulletin-dashboard-2",
  "/visa-bulletin",
] as const;

function invalidateVisaBulletinCaches(): void {
  revalidateTag(VISA_BULLETIN_SHEETS_CACHE_TAG);
  revalidateTag(VISA_BULLETIN_HISTORY_CACHE_TAG);
  for (const path of PUBLIC_BULLETIN_PATHS) {
    revalidatePath(path);
  }
}

export async function refreshVisaBulletinData(input: {
  trigger: GoogleSheetRefreshTrigger;
  actor: GoogleSheetRefreshActor;
  request?: Request;
}): Promise<{
  success: true;
  message: string;
  metadata: VisaBulletinRefreshMetadata;
}> {
  if (isDevVisaBulletinFixtureActive()) {
    throw new Error(
      "Visa Bulletin Data Refresh is disabled while the development bulletin fixture is active.",
    );
  }

  const sheets = await loadAllVisaBulletinSheets({ forceRefresh: true });
  const historyRecords = await getVisaBulletinHistory({}, { forceRefresh: true });

  if (sheets.FinalActionDates.length === 0 && sheets.DatesForFiling.length === 0) {
    throw new Error("Visa Bulletin refresh returned empty current sheets. Last known good data was kept.");
  }

  const latestMonth =
    historyRecords.length === 0
      ? null
      : historyRecords.reduce(
          (latest, record) => (record.month > latest ? record.month : latest),
          historyRecords[0].month,
        );

  const rowCounts = {
    FinalActionDates: sheets.FinalActionDates.length,
    DatesForFiling: sheets.DatesForFiling.length,
    PreviousFinalActionDates: sheets.PreviousFinalActionDates.length,
    PreviousDatesForFiling: sheets.PreviousDatesForFiling.length,
    VisaBulletinHistory: historyRecords.length,
  };

  invalidateVisaBulletinCaches();

  const metadata: VisaBulletinRefreshMetadata = {
    source: "Google Sheets",
    lastUpdated: latestMonth ?? "unknown",
    count:
      rowCounts.FinalActionDates +
      rowCounts.DatesForFiling +
      rowCounts.PreviousFinalActionDates +
      rowCounts.PreviousDatesForFiling,
    rowCounts,
    latestMonth,
  };

  const requestAudit = input.request
    ? getRequestAuditMetadata(input.request)
    : { ipAddress: null, userAgent: null };

  try {
    await writeAdminAuditLog({
      actorProfileId: input.actor.profileId,
      actorClerkUserId: input.actor.clerkUserId,
      actorEmail: input.actor.email,
      action: input.trigger === "scheduled" ? "scheduled_sync_visa_bulletin" : "force_sync_visa_bulletin",
      resource: "/api/admin/refresh-visa-bulletin",
      metadata: {
        trigger: input.trigger,
        success: true,
        rowCounts,
        latestMonth,
        source: metadata.source,
        count: metadata.count,
      },
      ipAddress: requestAudit.ipAddress,
      userAgent: requestAudit.userAgent,
    });
  } catch (error: unknown) {
    console.error("[visa-bulletin-refresh] audit log failed:", error);
  }

  return {
    success: true,
    message: "Visa Bulletin sheets refreshed from Google Sheets.",
    metadata,
  };
}
