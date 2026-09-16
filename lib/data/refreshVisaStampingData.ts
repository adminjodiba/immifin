import { revalidatePath, revalidateTag } from "next/cache";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";
import {
  type GoogleSheetRefreshActor,
  type GoogleSheetRefreshTrigger,
  type VisaStampingRefreshMetadata,
} from "@/lib/data/googleSheetRefresh";
import {
  getVisaStampingSheetData,
  VISA_STAMPING_CACHE_TAG,
} from "@/lib/visa/visaStampingSheetService";

const PUBLIC_STAMPING_PATHS = ["/api/visa-stamping-wait-times", "/immigration/visa-stamping-wait-map"] as const;

function invalidateVisaStampingCaches(): void {
  revalidateTag(VISA_STAMPING_CACHE_TAG);
  for (const path of PUBLIC_STAMPING_PATHS) {
    revalidatePath(path);
  }
}

export async function refreshVisaStampingData(input: {
  trigger: GoogleSheetRefreshTrigger;
  actor: GoogleSheetRefreshActor;
  request?: Request;
}): Promise<{
  success: true;
  message: string;
  metadata: VisaStampingRefreshMetadata;
}> {
  const sheetData = await getVisaStampingSheetData({ forceRefresh: true });

  if (sheetData.source !== "Google Sheets" || sheetData.records.length === 0) {
    throw new Error(
      "Visa stamping refresh did not load valid Google Sheets data. Last known good data was kept.",
    );
  }

  invalidateVisaStampingCaches();

  const metadata: VisaStampingRefreshMetadata = {
    source: "Google Sheets",
    lastUpdated: sheetData.lastUpdated,
    count: sheetData.records.length,
    countries: sheetData.countries,
  };

  const requestAudit = input.request
    ? getRequestAuditMetadata(input.request)
    : { ipAddress: null, userAgent: null };

  try {
    await writeAdminAuditLog({
      actorProfileId: input.actor.profileId,
      actorClerkUserId: input.actor.clerkUserId,
      actorEmail: input.actor.email,
      action: input.trigger === "scheduled" ? "scheduled_sync_visa_stamping" : "refresh_visa_stamping",
      resource: "/api/admin/refresh-visa-stamping",
      metadata: {
        trigger: input.trigger,
        success: true,
        source: metadata.source,
        lastUpdated: metadata.lastUpdated,
        recordCount: metadata.count,
      },
      ipAddress: requestAudit.ipAddress,
      userAgent: requestAudit.userAgent,
    });
  } catch (error: unknown) {
    console.error("[visa-stamping-refresh] audit log failed:", error);
  }

  return {
    success: true,
    message: "Visa stamping wait times refreshed from Google Sheets.",
    metadata,
  };
}
