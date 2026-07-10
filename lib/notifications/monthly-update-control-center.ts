/**
 * Control Center summary + controlled bulk orchestration for Monthly Immigration Updates.
 */

import {
  renderMonthlyImmigrationReportEmail,
} from "@/emails/templates/monthly-immigration-report-email";
import {
  prepareMonthlyImmigrationUpdateForUser,
} from "@/lib/notifications/build-monthly-immigration-report-dashboard-source";
import { mapMonthlyImmigrationReportEmailProps } from "@/lib/notifications/mappers/map-monthly-immigration-report-email";
import {
  buildMonthlyUpdateExclusionBreakdown,
  resolveMonthlyUpdateAudience,
  type MonthlyUpdateExclusionBreakdown,
  type MonthlyUpdateSkipReason,
} from "@/lib/notifications/monthly-update-audience";
import {
  completeMonthlyUpdateCampaign,
  createSendingMonthlyUpdateCampaign,
  getCompletedMonthlyUpdateCampaign,
  getLatestMonthlyUpdateCampaign,
  getSendingMonthlyUpdateCampaign,
  markMonthlyUpdateCampaignFailed,
  type NotificationCampaignRecord,
  type NotificationCampaignStatus,
} from "@/lib/notifications/monthly-update-campaigns";
import { createNotificationService } from "@/lib/notifications/core/notification-factory";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  formatVisaBulletinMonthLong,
  getLatestVisaBulletinMonth,
} from "@/lib/visaBulletinHistory";

/** Conservative Worker-safe batching for July 16 MVP (small Pro/Power audience). */
export const MONTHLY_UPDATE_BATCH_SIZE = 5;
export const MONTHLY_UPDATE_BATCH_DELAY_MS = 250;
/** Above this sendable count, refuse sync bulk send — use Queues before production scale. */
export const MONTHLY_UPDATE_MAX_SYNC_RECIPIENTS = 75;

export type MonthlyUpdateControlStatus =
  | "Ready to Send"
  | "Sending"
  | "Completed"
  | "Completed with Failures"
  | "Already Sent"
  | "Not Ready";

export type MonthlyUpdateAudienceSummary = {
  bulletinMonthKey: string | null;
  bulletinMonthLabel: string | null;
  bulletinRefreshedAt: string | null;
  /** Active profiles considered (eligible + excluded). */
  activeUserCount: number;
  proCount: number;
  powerCount: number;
  totalRecipients: number;
  skippedCount: number;
  skippedByReason: Partial<Record<MonthlyUpdateSkipReason, number>>;
  exclusionBreakdown: MonthlyUpdateExclusionBreakdown;
  lastSentAt: string | null;
  lastSentBulletinMonth: string | null;
  controlStatus: MonthlyUpdateControlStatus;
  campaignStatus: NotificationCampaignStatus | null;
  canSend: boolean;
  sendBlockedReason: string | null;
  provider: string;
};

export type MonthlyUpdateBulkSendResult = {
  controlStatus: MonthlyUpdateControlStatus;
  bulletinMonthKey: string;
  bulletinMonthLabel: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  proCount: number;
  powerCount: number;
  completedAt: string | null;
  provider: string;
  campaignId: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toControlStatus(
  campaign: NotificationCampaignRecord | null,
  options: {
    bulletinMonthKey: string | null;
    totalRecipients: number;
  }
): MonthlyUpdateControlStatus {
  if (!options.bulletinMonthKey) {
    return "Not Ready";
  }

  if (campaign?.status === "sending") {
    return "Sending";
  }

  if (campaign?.status === "completed") {
    return "Already Sent";
  }

  if (campaign?.status === "completed_with_failures") {
    return "Completed with Failures";
  }

  if (options.totalRecipients <= 0) {
    return "Not Ready";
  }

  return "Ready to Send";
}

async function getLastVisaBulletinRefreshAt(): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_audit_log")
    .select("created_at")
    .eq("action", "force_sync_visa_bulletin")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[monthly-update] Failed to load bulletin refresh audit:", error);
    return null;
  }

  return data?.created_at ?? null;
}

export async function buildMonthlyUpdateAudienceSummary(): Promise<MonthlyUpdateAudienceSummary> {
  const bulletinMonthKey = await getLatestVisaBulletinMonth();
  const bulletinMonthLabel = bulletinMonthKey
    ? formatVisaBulletinMonthLong(bulletinMonthKey)
    : null;
  const bulletinRefreshedAt = await getLastVisaBulletinRefreshAt();

  const emptyBreakdown = buildMonthlyUpdateExclusionBreakdown({});
  const audience = bulletinMonthKey
    ? await resolveMonthlyUpdateAudience()
    : {
        sendable: [],
        activeUserCount: 0,
        proCount: 0,
        powerCount: 0,
        totalRecipients: 0,
        skippedCount: 0,
        skippedByReason: {},
        exclusionBreakdown: emptyBreakdown,
      };

  const completedForMonth = bulletinMonthKey
    ? await getCompletedMonthlyUpdateCampaign(bulletinMonthKey)
    : null;
  const sendingForMonth = bulletinMonthKey
    ? await getSendingMonthlyUpdateCampaign(bulletinMonthKey)
    : null;
  const latestCampaign = await getLatestMonthlyUpdateCampaign();

  const blockingCampaign = sendingForMonth ?? completedForMonth;
  const controlStatus = toControlStatus(blockingCampaign, {
    bulletinMonthKey,
    totalRecipients: audience.totalRecipients,
  });

  let sendBlockedReason: string | null = null;
  let canSend = false;

  if (!bulletinMonthKey) {
    sendBlockedReason = "Visa Bulletin month is unavailable.";
  } else if (sendingForMonth) {
    sendBlockedReason = "A send is already in progress for this bulletin month.";
  } else if (completedForMonth) {
    sendBlockedReason =
      completedForMonth.status === "completed_with_failures"
        ? "This bulletin month already completed with failures. Duplicate send is blocked."
        : "This bulletin month was already sent successfully. Duplicate send is blocked.";
  } else if (audience.totalRecipients <= 0) {
    sendBlockedReason = "No eligible Pro/Power recipients for this update.";
  } else if (audience.totalRecipients > MONTHLY_UPDATE_MAX_SYNC_RECIPIENTS) {
    sendBlockedReason = `Audience (${audience.totalRecipients}) exceeds the safe synchronous limit (${MONTHLY_UPDATE_MAX_SYNC_RECIPIENTS}). Cloudflare Queues are required before production bulk sending.`;
  } else {
    canSend = true;
  }

  return {
    bulletinMonthKey,
    bulletinMonthLabel,
    bulletinRefreshedAt,
    activeUserCount: audience.activeUserCount,
    proCount: audience.proCount,
    powerCount: audience.powerCount,
    totalRecipients: audience.totalRecipients,
    skippedCount: audience.skippedCount,
    skippedByReason: audience.skippedByReason,
    exclusionBreakdown: audience.exclusionBreakdown,
    lastSentAt:
      completedForMonth?.completed_at ??
      (latestCampaign?.status !== "sending" ? latestCampaign?.completed_at ?? null : null),
    lastSentBulletinMonth:
      completedForMonth?.bulletin_month ??
      (latestCampaign && latestCampaign.status !== "sending"
        ? latestCampaign.bulletin_month
        : null),
    controlStatus,
    campaignStatus: blockingCampaign?.status ?? null,
    canSend,
    sendBlockedReason,
    provider: "Resend",
  };
}

export async function sendMonthlyImmigrationUpdatesBulk(input: {
  actorProfileId: string;
  actorClerkUserId: string;
  actorEmail: string;
}): Promise<MonthlyUpdateBulkSendResult> {
  const summary = await buildMonthlyUpdateAudienceSummary();

  if (!summary.canSend || !summary.bulletinMonthKey || !summary.bulletinMonthLabel) {
    throw new Error(
      summary.sendBlockedReason ?? "Monthly Immigration Updates cannot be sent right now."
    );
  }

  const audience = await resolveMonthlyUpdateAudience();
  if (audience.totalRecipients <= 0) {
    throw new Error("No eligible Pro/Power recipients for this update.");
  }
  if (audience.totalRecipients > MONTHLY_UPDATE_MAX_SYNC_RECIPIENTS) {
    throw new Error(
      `Audience (${audience.totalRecipients}) exceeds the safe synchronous limit (${MONTHLY_UPDATE_MAX_SYNC_RECIPIENTS}). Cloudflare Queues are required before production bulk sending.`
    );
  }

  const campaign = await createSendingMonthlyUpdateCampaign({
    bulletinMonth: summary.bulletinMonthKey,
    proCount: audience.proCount,
    powerCount: audience.powerCount,
    totalRecipients: audience.totalRecipients,
    skippedCount: audience.skippedCount,
    actorProfileId: input.actorProfileId,
    actorClerkUserId: input.actorClerkUserId,
    actorEmail: input.actorEmail,
    provider: "resend",
  });

  const notificationService = createNotificationService();
  let successCount = 0;
  let failureCount = 0;

  try {
    for (let index = 0; index < audience.sendable.length; index += 1) {
      const candidate = audience.sendable[index];

      try {
        const prepared = await prepareMonthlyImmigrationUpdateForUser(
          candidate.profileWithRelations
        );
        const emailProps = mapMonthlyImmigrationReportEmailProps(prepared.source);
        const rendered = await renderMonthlyImmigrationReportEmail(emailProps);
        const result = await notificationService.sendEmail({
          to: candidate.profileWithRelations.profile.email,
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
          tags: [
            { name: "template", value: "monthly-immigration-report" },
            { name: "send_mode", value: "bulk_monthly_update" },
            { name: "campaign_id", value: campaign.id },
          ],
        });

        if (result.success) {
          successCount += 1;
        } else {
          failureCount += 1;
        }
      } catch {
        failureCount += 1;
      }

      const isBatchBoundary =
        (index + 1) % MONTHLY_UPDATE_BATCH_SIZE === 0 &&
        index + 1 < audience.sendable.length;
      if (isBatchBoundary) {
        await sleep(MONTHLY_UPDATE_BATCH_DELAY_MS);
      }
    }

    const completed = await completeMonthlyUpdateCampaign({
      campaignId: campaign.id,
      successCount,
      failureCount,
      skippedCount: audience.skippedCount,
      proCount: audience.proCount,
      powerCount: audience.powerCount,
      totalRecipients: audience.totalRecipients,
    });

    return {
      controlStatus:
        failureCount > 0 ? "Completed with Failures" : "Completed",
      bulletinMonthKey: summary.bulletinMonthKey,
      bulletinMonthLabel: summary.bulletinMonthLabel,
      totalRecipients: audience.totalRecipients,
      successCount,
      failureCount,
      skippedCount: audience.skippedCount,
      proCount: audience.proCount,
      powerCount: audience.powerCount,
      completedAt: completed.completed_at,
      provider: "Resend",
      campaignId: campaign.id,
    };
  } catch (error: unknown) {
    await markMonthlyUpdateCampaignFailed({
      campaignId: campaign.id,
      successCount,
      failureCount: failureCount + 1,
      skippedCount: audience.skippedCount,
    });
    throw error;
  }
}
