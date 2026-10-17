import type {
  NotificationCampaignRecipient,
  NotificationDeliveryAttempt,
  NotificationRecoveryRun,
  NotificationRecipientDeliveryState,
} from "@/lib/supabase/types";
import type { NotificationCampaignRecord } from "@/lib/notifications/monthly-update-campaigns";

export const DEFAULT_DELIVERY_DETAILS_PAGE_SIZE = 50;
export const MAX_DELIVERY_DETAILS_PAGE_SIZE = 100;
export type DeliveryDetailsPagination = { page: number; pageSize: number };
export type DeliveryDetailsStatusFilter =
  | "provider_accepted"
  | "failed"
  | "skipped"
  | "submission_unknown";

export type MonthlyUpdateCampaignDeliveryRecipientRow = {
  campaignRecipientId: string;
  profileId: string;
  originalEligibilityState: NotificationCampaignRecipient["original_eligibility_state"];
  originalTier: NotificationCampaignRecipient["original_tier"];
  currentDeliveryState: NotificationRecipientDeliveryState;
  originalExclusionReason: string | null;
  attemptCount: number;
  latestAttemptNumber: number | null;
  latestAttemptType: NotificationDeliveryAttempt["attempt_type"] | null;
  latestAttemptOutcome: NotificationDeliveryAttempt["outcome"] | null;
  latestAttemptAt: string | null;
  providerMessageId: string | null;
  retryable: boolean;
  retryBlockedReason: string | null;
};
export type MonthlyUpdateCampaignRecoveryRunHistoryRow = {
  recoveryRunId: string;
  status: NotificationRecoveryRun["status"];
  requestedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  targetedCount: number;
  providerAcceptedCount: number;
  failedCount: number;
  skippedIneligibleCount: number;
  submissionUnknownCount: number;
};
export type MonthlyUpdateCampaignDeliveryDetails = {
  campaignId: string;
  campaignType: string;
  bulletinMonth: string;
  campaignStatus: NotificationCampaignRecord["status"];
  startedAt: string | null;
  completedAt: string | null;
  provider: string | null;
  tracked: boolean;
  legacy: boolean;
  originalEligibleCount: number;
  originalExcludedCount: number;
  providerAcceptedCount: number;
  failedBeforeProviderCount: number;
  failedProviderCount: number;
  submissionUnknownCount: number;
  skippedIneligibleCount: number;
  retryableFailedCount: number;
  hasActiveRecoveryRun: boolean;
  latestRecoveryRunStatus: NotificationRecoveryRun["status"] | null;
  legacyReason: string | null;
  recipients: MonthlyUpdateCampaignDeliveryRecipientRow[];
  pagination: DeliveryDetailsPagination & {
    totalRows: number;
    totalPages: number;
  };
  recoveryRuns: MonthlyUpdateCampaignRecoveryRunHistoryRow[];
};
export type RecipientDeliveryCounts = {
  originalEligibleCount: number;
  originalExcludedCount: number;
  providerAcceptedCount: number;
  failedBeforeProviderCount: number;
  failedProviderCount: number;
  submissionUnknownCount: number;
  skippedIneligibleCount: number;
  retryableFailedCount: number;
};

export function parseDeliveryDetailsPagination(input: {
  page: string | null;
  pageSize: string | null;
}): DeliveryDetailsPagination | null {
  const parsePositiveInteger = (
    value: string | null,
    fallback: number,
  ): number | null => {
    if (value === null) return fallback;
    if (!/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null;
  };
  const page = parsePositiveInteger(input.page, 1);
  const pageSize = parsePositiveInteger(
    input.pageSize,
    DEFAULT_DELIVERY_DETAILS_PAGE_SIZE,
  );
  return page === null ||
    pageSize === null ||
    pageSize > MAX_DELIVERY_DETAILS_PAGE_SIZE
    ? null
    : { page, pageSize };
}

export function parseDeliveryDetailsStatusFilter(
  value: string | null,
): DeliveryDetailsStatusFilter | null | undefined {
  if (value === null || value === "") return null;
  if (
    value === "provider_accepted" ||
    value === "failed" ||
    value === "skipped" ||
    value === "submission_unknown"
  ) {
    return value;
  }
  return undefined;
}

function retryBlockedReason(
  state: NotificationRecipientDeliveryState,
): string | null {
  switch (state) {
    case "failed_before_provider":
    case "failed_provider":
      return null;
    case "provider_accepted":
      return "provider_accepted";
    case "submission_unknown":
      return "submission_unknown";
    case "skipped_ineligible":
      return "skipped_ineligible";
    case "audience_excluded":
      return "audience_excluded";
    case "eligible_pending":
      return "pending";
    case "attempt_in_progress":
      return "attempt_in_progress";
  }
}
function isRetryable(state: NotificationRecipientDeliveryState): boolean {
  return state === "failed_before_provider" || state === "failed_provider";
}
function compareLatestAttempt(
  a: NotificationDeliveryAttempt,
  b: NotificationDeliveryAttempt,
): number {
  return (
    Date.parse(b.attempted_at) - Date.parse(a.attempted_at) ||
    b.id.localeCompare(a.id)
  );
}
function mapRecoveryRun(
  run: NotificationRecoveryRun,
): MonthlyUpdateCampaignRecoveryRunHistoryRow {
  return {
    recoveryRunId: run.id,
    status: run.status,
    requestedAt: run.requested_at,
    startedAt: run.processing_started_at,
    completedAt: run.completed_at,
    targetedCount: run.attempted_recipient_count,
    providerAcceptedCount: run.provider_accepted_count,
    failedCount: run.failed_before_provider_count + run.failed_provider_count,
    skippedIneligibleCount: run.skipped_ineligible_count,
    submissionUnknownCount: run.submission_unknown_count,
  };
}

export function buildMonthlyUpdateCampaignDeliveryDetails(input: {
  campaign: NotificationCampaignRecord;
  pagination: DeliveryDetailsPagination;
  trackedRecipientCount: number;
  totalRecipientRows: number;
  recipientCounts: RecipientDeliveryCounts;
  recipients: NotificationCampaignRecipient[];
  attempts: NotificationDeliveryAttempt[];
  recoveryRuns: NotificationRecoveryRun[];
  activeRecoveryRunCount: number;
}): MonthlyUpdateCampaignDeliveryDetails {
  const tracked = input.trackedRecipientCount > 0;
  const attemptsByRecipientId = new Map<
    string,
    NotificationDeliveryAttempt[]
  >();
  for (const attempt of input.attempts) {
    const recipientAttempts =
      attemptsByRecipientId.get(attempt.campaign_recipient_id) ?? [];
    recipientAttempts.push(attempt);
    attemptsByRecipientId.set(attempt.campaign_recipient_id, recipientAttempts);
  }
  const recipients = tracked
    ? input.recipients.map((recipient) => {
        const attempts = attemptsByRecipientId.get(recipient.id) ?? [];
        const latestAttempt =
          [...attempts].sort(compareLatestAttempt)[0] ?? null;
        return {
          campaignRecipientId: recipient.id,
          profileId: recipient.profile_id,
          originalEligibilityState: recipient.original_eligibility_state,
          originalTier: recipient.original_tier,
          currentDeliveryState: recipient.latest_delivery_state,
          originalExclusionReason: recipient.original_exclusion_reason,
          attemptCount: attempts.length,
          latestAttemptNumber: latestAttempt?.attempt_number ?? null,
          latestAttemptType: latestAttempt?.attempt_type ?? null,
          latestAttemptOutcome: latestAttempt?.outcome ?? null,
          latestAttemptAt: latestAttempt?.attempted_at ?? null,
          providerMessageId: latestAttempt?.provider_message_id ?? null,
          retryable: isRetryable(recipient.latest_delivery_state),
          retryBlockedReason: retryBlockedReason(
            recipient.latest_delivery_state,
          ),
        };
      })
    : [];
  const totalRows = tracked ? input.totalRecipientRows : 0;
  return {
    campaignId: input.campaign.id,
    campaignType: input.campaign.campaign_type,
    bulletinMonth: input.campaign.bulletin_month,
    campaignStatus: input.campaign.status,
    startedAt: input.campaign.started_at,
    completedAt: input.campaign.completed_at,
    provider: input.campaign.provider,
    tracked,
    legacy: !tracked,
    ...input.recipientCounts,
    hasActiveRecoveryRun: tracked && input.activeRecoveryRunCount > 0,
    latestRecoveryRunStatus: input.recoveryRuns[0]?.status ?? null,
    legacyReason: tracked
      ? null
      : "Recipient-level tracking is unavailable for this legacy campaign. Automated recovery is not eligible.",
    recipients,
    pagination: {
      ...input.pagination,
      totalRows,
      totalPages:
        totalRows === 0 ? 0 : Math.ceil(totalRows / input.pagination.pageSize),
    },
    recoveryRuns: input.recoveryRuns.map(mapRecoveryRun),
  };
}
