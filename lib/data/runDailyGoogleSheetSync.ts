import { isChicagoDailySyncMinute } from "@/lib/data/dailySheetSyncTimezone";
import {
  SCHEDULED_SHEET_SYNC_ACTOR,
  type GoogleSheetRefreshActor,
  type GoogleSheetRefreshTrigger,
} from "@/lib/data/googleSheetRefresh";
import { refreshVisaBulletinData } from "@/lib/data/refreshVisaBulletinData";
import { refreshVisaStampingData } from "@/lib/data/refreshVisaStampingData";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";

export type DailySheetDatasetResult = {
  dataset: "visa-bulletin" | "visa-stamping";
  success: boolean;
  message: string;
  metadata?: Record<string, unknown>;
  error?: string;
};

export type DailyGoogleSheetSyncResult = {
  ran: boolean;
  skipped?: boolean;
  reason?: string;
  timezone: "America/Chicago";
  trigger: GoogleSheetRefreshTrigger;
  results: DailySheetDatasetResult[];
};

async function recordScheduledFailure(
  dataset: DailySheetDatasetResult["dataset"],
  message: string,
  actor: GoogleSheetRefreshActor,
  request?: Request,
): Promise<void> {
  const requestAudit = request
    ? getRequestAuditMetadata(request)
    : { ipAddress: null, userAgent: null };

  try {
    await writeAdminAuditLog({
      actorProfileId: actor.profileId,
      actorClerkUserId: actor.clerkUserId,
      actorEmail: actor.email,
      action:
        dataset === "visa-bulletin" ? "scheduled_sync_visa_bulletin" : "scheduled_sync_visa_stamping",
      resource:
        dataset === "visa-bulletin"
          ? "/api/admin/refresh-visa-bulletin"
          : "/api/admin/refresh-visa-stamping",
      metadata: {
        trigger: "scheduled",
        success: false,
        dataset,
        error: message,
      },
      ipAddress: requestAudit.ipAddress,
      userAgent: requestAudit.userAgent,
    });
  } catch (error: unknown) {
    console.error("[daily-sheet-sync] failure audit log failed:", error);
  }
}

export async function runDailyGoogleSheetSync(options?: {
  skipTimezoneGuard?: boolean;
  now?: Date;
  request?: Request;
  actor?: GoogleSheetRefreshActor;
}): Promise<DailyGoogleSheetSyncResult> {
  const now = options?.now ?? new Date();

  if (!options?.skipTimezoneGuard && !isChicagoDailySyncMinute(now)) {
    return {
      ran: false,
      skipped: true,
      reason: "Not 12:01 AM America/Chicago.",
      timezone: "America/Chicago",
      trigger: "scheduled",
      results: [],
    };
  }

  const actor = options?.actor ?? SCHEDULED_SHEET_SYNC_ACTOR;
  const trigger: GoogleSheetRefreshTrigger = "scheduled";
  const results: DailySheetDatasetResult[] = [];

  try {
    const bulletin = await refreshVisaBulletinData({
      trigger,
      actor,
      request: options?.request,
    });
    results.push({
      dataset: "visa-bulletin",
      success: true,
      message: bulletin.message,
      metadata: bulletin.metadata,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Visa Bulletin scheduled refresh failed.";
    await recordScheduledFailure("visa-bulletin", message, actor, options?.request);
    results.push({
      dataset: "visa-bulletin",
      success: false,
      message,
      error: message,
    });
  }

  try {
    const stamping = await refreshVisaStampingData({
      trigger,
      actor,
      request: options?.request,
    });
    results.push({
      dataset: "visa-stamping",
      success: true,
      message: stamping.message,
      metadata: stamping.metadata,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Visa stamping scheduled refresh failed.";
    await recordScheduledFailure("visa-stamping", message, actor, options?.request);
    results.push({
      dataset: "visa-stamping",
      success: false,
      message,
      error: message,
    });
  }

  return {
    ran: true,
    timezone: "America/Chicago",
    trigger,
    results,
  };
}
