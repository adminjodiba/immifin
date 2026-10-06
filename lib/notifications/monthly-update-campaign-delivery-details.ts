import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  NotificationCampaignRecipient,
  NotificationDeliveryAttempt,
  NotificationRecoveryRun,
} from "@/lib/supabase/types";
import { buildMonthlyUpdateCampaignDeliveryDetails } from "@/lib/notifications/monthly-update-campaign-delivery-details-model";
import type {
  DeliveryDetailsPagination,
  MonthlyUpdateCampaignDeliveryDetails,
  RecipientDeliveryCounts,
} from "@/lib/notifications/monthly-update-campaign-delivery-details-model";
import {
  MONTHLY_IMMIGRATION_UPDATE_CAMPAIGN_TYPE,
  type NotificationCampaignRecord,
} from "@/lib/notifications/monthly-update-campaigns";

export {
  DEFAULT_DELIVERY_DETAILS_PAGE_SIZE,
  MAX_DELIVERY_DETAILS_PAGE_SIZE,
  parseDeliveryDetailsPagination,
} from "@/lib/notifications/monthly-update-campaign-delivery-details-model";
export type {
  DeliveryDetailsPagination,
  MonthlyUpdateCampaignDeliveryDetails,
  MonthlyUpdateCampaignDeliveryRecipientRow,
  MonthlyUpdateCampaignRecoveryRunHistoryRow,
} from "@/lib/notifications/monthly-update-campaign-delivery-details-model";

const MAX_RECOVERY_RUN_HISTORY = 50;

async function countRecipients(
  campaignId: string,
  column: string,
  value: string | string[],
): Promise<number> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("notification_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  query = Array.isArray(value)
    ? query.in(column, value)
    : query.eq(column, value);
  const { count, error } = await query;
  if (error)
    throw new Error(
      `Failed to count notification campaign recipients: ${error.message}`,
    );
  return count ?? 0;
}

async function countTrackedRecipients(campaignId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("notification_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  if (error)
    throw new Error(
      `Failed to count tracked notification recipients: ${error.message}`,
    );
  return count ?? 0;
}

/** Read-only Admin delivery evidence for one Monthly Immigration Update campaign. */
export async function getMonthlyUpdateCampaignDeliveryDetails(input: {
  campaignId: string;
  pagination: DeliveryDetailsPagination;
}): Promise<MonthlyUpdateCampaignDeliveryDetails | null> {
  const supabase = getSupabaseAdminClient();
  const { data: campaignData, error: campaignError } = await supabase
    .from("notification_campaigns")
    .select("*")
    .eq("id", input.campaignId)
    .eq("campaign_type", MONTHLY_IMMIGRATION_UPDATE_CAMPAIGN_TYPE)
    .maybeSingle();
  if (campaignError)
    throw new Error(
      `Failed to load notification campaign: ${campaignError.message}`,
    );
  if (!campaignData) return null;
  const campaign = campaignData as NotificationCampaignRecord;

  const [
    trackedRecipientCount,
    originalEligibleCount,
    originalExcludedCount,
    providerAcceptedCount,
    failedBeforeProviderCount,
    failedProviderCount,
    submissionUnknownCount,
    skippedIneligibleCount,
    activeRecoveryRunCount,
    recoveryRunsResult,
  ] = await Promise.all([
    countTrackedRecipients(input.campaignId),
    countRecipients(input.campaignId, "original_eligibility_state", "eligible"),
    countRecipients(input.campaignId, "original_eligibility_state", "excluded"),
    countRecipients(
      input.campaignId,
      "latest_delivery_state",
      "provider_accepted",
    ),
    countRecipients(
      input.campaignId,
      "latest_delivery_state",
      "failed_before_provider",
    ),
    countRecipients(
      input.campaignId,
      "latest_delivery_state",
      "failed_provider",
    ),
    countRecipients(
      input.campaignId,
      "latest_delivery_state",
      "submission_unknown",
    ),
    countRecipients(
      input.campaignId,
      "latest_delivery_state",
      "skipped_ineligible",
    ),
    (async () => {
      const { count, error } = await supabase
        .from("notification_recovery_runs")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", input.campaignId)
        .in("status", ["requested", "processing"]);
      if (error)
        throw new Error(
          `Failed to count active notification recovery runs: ${error.message}`,
        );
      return count ?? 0;
    })(),
    supabase
      .from("notification_recovery_runs")
      .select("*")
      .eq("campaign_id", input.campaignId)
      .order("requested_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(MAX_RECOVERY_RUN_HISTORY),
  ]);
  if (recoveryRunsResult.error)
    throw new Error(
      `Failed to load notification recovery runs: ${recoveryRunsResult.error.message}`,
    );

  const recipientCounts: RecipientDeliveryCounts = {
    originalEligibleCount,
    originalExcludedCount,
    providerAcceptedCount,
    failedBeforeProviderCount,
    failedProviderCount,
    submissionUnknownCount,
    skippedIneligibleCount,
    retryableFailedCount: failedBeforeProviderCount + failedProviderCount,
  };
  if (trackedRecipientCount === 0) {
    return buildMonthlyUpdateCampaignDeliveryDetails({
      campaign,
      pagination: input.pagination,
      trackedRecipientCount,
      totalRecipientRows: 0,
      recipientCounts,
      recipients: [],
      attempts: [],
      recoveryRuns: [],
      activeRecoveryRunCount: 0,
    });
  }

  const from = (input.pagination.page - 1) * input.pagination.pageSize;
  const to = from + input.pagination.pageSize - 1;
  const {
    data: recipientData,
    error: recipientsError,
    count: totalRecipientRows,
  } = await supabase
    .from("notification_campaign_recipients")
    .select("*", { count: "exact" })
    .eq("campaign_id", input.campaignId)
    .order("latest_delivery_state", { ascending: true })
    .order("profile_id", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);
  if (recipientsError)
    throw new Error(
      `Failed to load notification campaign recipients: ${recipientsError.message}`,
    );
  const recipients = (recipientData ?? []) as NotificationCampaignRecipient[];
  const recipientIds = recipients.map((recipient) => recipient.id);
  let attempts: NotificationDeliveryAttempt[] = [];
  if (recipientIds.length > 0) {
    const { data, error } = await supabase
      .from("notification_delivery_attempts")
      .select("*")
      .in("campaign_recipient_id", recipientIds)
      .order("attempted_at", { ascending: false })
      .order("id", { ascending: false });
    if (error)
      throw new Error(
        `Failed to load notification delivery attempts: ${error.message}`,
      );
    attempts = (data ?? []) as NotificationDeliveryAttempt[];
  }

  return buildMonthlyUpdateCampaignDeliveryDetails({
    campaign,
    pagination: input.pagination,
    trackedRecipientCount,
    totalRecipientRows: totalRecipientRows ?? 0,
    recipientCounts,
    recipients,
    attempts,
    recoveryRuns: (recoveryRunsResult.data ?? []) as NotificationRecoveryRun[],
    activeRecoveryRunCount,
  });
}
