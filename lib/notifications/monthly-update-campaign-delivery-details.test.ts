import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildMonthlyUpdateCampaignDeliveryDetails } from "./monthly-update-campaign-delivery-details-model";
import {
  parseDeliveryDetailsPagination,
  parseDeliveryDetailsStatusFilter,
} from "./monthly-update-campaign-delivery-details-model";
import type {
  NotificationCampaignRecipient,
  NotificationDeliveryAttempt,
  NotificationRecoveryRun,
} from "@/lib/supabase/types";
import type { NotificationCampaignRecord } from "./monthly-update-campaigns";

const CAMPAIGN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function campaign(): NotificationCampaignRecord {
  return {
    id: CAMPAIGN_ID,
    campaign_type: "monthly_immigration_update",
    bulletin_month: "2026-11",
    status: "completed_with_failures",
    pro_count: 2,
    power_count: 1,
    total_recipients: 3,
    success_count: 1,
    failure_count: 2,
    skipped_count: 0,
    provider: "resend",
    actor_profile_id: "actor",
    actor_clerk_user_id: "clerk",
    actor_email: "admin@example.com",
    started_at: "2026-10-06T00:00:00.000Z",
    completed_at: "2026-10-06T00:03:00.000Z",
    created_at: "2026-10-06T00:00:00.000Z",
    updated_at: "2026-10-06T00:03:00.000Z",
  };
}

function recipient(
  id: string,
  profileId: string,
  state: NotificationCampaignRecipient["latest_delivery_state"],
  eligibility: NotificationCampaignRecipient["original_eligibility_state"] = "eligible",
): NotificationCampaignRecipient {
  return {
    id,
    campaign_id: CAMPAIGN_ID,
    profile_id: profileId,
    original_tier: eligibility === "eligible" ? "pro" : null,
    original_eligibility_state: eligibility,
    original_exclusion_reason:
      eligibility === "excluded" ? "inactive_profile" : null,
    original_evaluated_at: "2026-10-06T00:00:00.000Z",
    latest_delivery_state: state,
    latest_attempt_id: null,
    accepted_at: null,
    last_failure_code: null,
    last_failure_at: null,
    created_at: "2026-10-06T00:00:00.000Z",
    updated_at: "2026-10-06T00:00:00.000Z",
  };
}

function attempt(
  overrides: Partial<NotificationDeliveryAttempt> &
    Pick<NotificationDeliveryAttempt, "id" | "campaign_recipient_id">,
): NotificationDeliveryAttempt {
  const { id, campaign_recipient_id, ...rest } = overrides;
  return {
    id,
    campaign_recipient_id,
    recovery_run_id: null,
    attempt_number: 1,
    attempt_type: "original",
    outcome: "failed_provider",
    failure_stage: "provider",
    reason_code: "provider_rejected",
    reason_detail: "raw diagnostic must never leave this repository",
    provider: "resend",
    provider_message_id: "provider-message",
    provider_submission_key: "internal-provider-key",
    tier_at_attempt: "pro",
    attempted_at: "2026-10-06T00:01:00.000Z",
    completed_at: "2026-10-06T00:01:01.000Z",
    created_at: "2026-10-06T00:01:00.000Z",
    ...rest,
  };
}

function recoveryRun(): NotificationRecoveryRun {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    campaign_id: CAMPAIGN_ID,
    status: "completed_with_failures",
    idempotency_key: "internal-recovery-key",
    actor_profile_id: "actor",
    actor_clerk_user_id: "clerk",
    actor_email: "admin@example.com",
    requested_at: "2026-10-06T01:00:00.000Z",
    processing_started_at: "2026-10-06T01:00:01.000Z",
    completed_at: "2026-10-06T01:01:00.000Z",
    attempted_recipient_count: 2,
    provider_accepted_count: 1,
    failed_before_provider_count: 1,
    failed_provider_count: 0,
    skipped_ineligible_count: 0,
    submission_unknown_count: 0,
    created_at: "2026-10-06T01:00:00.000Z",
    updated_at: "2026-10-06T01:01:00.000Z",
  };
}

function details(
  input: Partial<
    Parameters<typeof buildMonthlyUpdateCampaignDeliveryDetails>[0]
  > = {},
) {
  return buildMonthlyUpdateCampaignDeliveryDetails({
    campaign: campaign(),
    pagination: { page: 1, pageSize: 50 },
    trackedRecipientCount: 7,
    totalRecipientRows: 7,
    recipientCounts: {
      originalEligibleCount: 6,
      originalExcludedCount: 1,
      providerAcceptedCount: 1,
      failedBeforeProviderCount: 1,
      failedProviderCount: 1,
      submissionUnknownCount: 1,
      skippedIneligibleCount: 1,
      retryableFailedCount: 2,
    },
    recipients: [
      recipient("r-accepted", "profile-a", "provider_accepted"),
      recipient("r-before", "profile-b", "failed_before_provider"),
      recipient("r-failed", "profile-c", "failed_provider"),
      recipient("r-unknown", "profile-d", "submission_unknown"),
      recipient("r-skipped", "profile-e", "skipped_ineligible"),
      recipient("r-excluded", "profile-f", "audience_excluded", "excluded"),
    ],
    attempts: [
      attempt({
        id: "a-old",
        campaign_recipient_id: "r-failed",
        attempt_number: 1,
        attempted_at: "2026-10-06T00:01:00.000Z",
      }),
      attempt({
        id: "a-new",
        campaign_recipient_id: "r-failed",
        attempt_number: 2,
        attempt_type: "retry",
        outcome: "failed_provider",
        attempted_at: "2026-10-06T00:02:00.000Z",
      }),
    ],
    recoveryRuns: [recoveryRun()],
    activeRecoveryRunCount: 0,
    ...input,
  });
}

describe("Monthly Update campaign delivery details read model", () => {
  it("uses persisted recipient/attempt evidence, explicit failure retryability, and safe recovery history", () => {
    const result = details();
    assert.equal(result.tracked, true);
    assert.equal(result.legacy, false);
    assert.equal(result.providerAcceptedCount, 1);
    assert.equal(result.failedBeforeProviderCount, 1);
    assert.equal(result.failedProviderCount, 1);
    assert.equal(result.submissionUnknownCount, 1);
    assert.equal(result.skippedIneligibleCount, 1);
    assert.equal(result.originalExcludedCount, 1);
    assert.equal(result.retryableFailedCount, 2);
    assert.deepEqual(
      result.recipients.map((row) => [
        row.currentDeliveryState,
        row.retryable,
        row.retryBlockedReason,
      ]),
      [
        ["provider_accepted", false, "provider_accepted"],
        ["failed_before_provider", true, null],
        ["failed_provider", true, null],
        ["submission_unknown", false, "submission_unknown"],
        ["skipped_ineligible", false, "skipped_ineligible"],
        ["audience_excluded", false, "audience_excluded"],
      ],
    );
    const failed = result.recipients.find(
      (row) => row.campaignRecipientId === "r-failed",
    )!;
    assert.equal(failed.attemptCount, 2);
    assert.equal(failed.latestAttemptNumber, 2);
    assert.equal(failed.latestAttemptType, "retry");
    assert.equal(result.recoveryRuns[0].failedCount, 1);
    assert.equal(result.latestRecoveryRunStatus, "completed_with_failures");
    assert.doesNotMatch(
      JSON.stringify(result),
      /internal-provider-key|internal-recovery-key|raw diagnostic|admin@example\.com/,
    );
  });

  it("returns generic legacy information without fabricated recipient evidence or recovery eligibility", () => {
    const result = details({
      trackedRecipientCount: 0,
      totalRecipientRows: 0,
      recipients: [],
      attempts: [],
      recoveryRuns: [],
      activeRecoveryRunCount: 0,
      recipientCounts: {
        originalEligibleCount: 0,
        originalExcludedCount: 0,
        providerAcceptedCount: 0,
        failedBeforeProviderCount: 0,
        failedProviderCount: 0,
        submissionUnknownCount: 0,
        skippedIneligibleCount: 0,
        retryableFailedCount: 0,
      },
    });
    assert.equal(result.legacy, true);
    assert.equal(result.tracked, false);
    assert.equal(result.hasActiveRecoveryRun, false);
    assert.equal(result.retryableFailedCount, 0);
    assert.deepEqual(result.recipients, []);
    assert.match(result.legacyReason ?? "", /legacy campaign/);
  });

  it("enforces default, maximum, and valid pagination inputs", () => {
    assert.deepEqual(
      parseDeliveryDetailsPagination({ page: null, pageSize: null }),
      { page: 1, pageSize: 50 },
    );
    assert.deepEqual(
      parseDeliveryDetailsPagination({ page: "2", pageSize: "100" }),
      { page: 2, pageSize: 100 },
    );
    assert.equal(
      parseDeliveryDetailsPagination({ page: "0", pageSize: "50" }),
      null,
    );
    assert.equal(
      parseDeliveryDetailsPagination({ page: "1", pageSize: "101" }),
      null,
    );
    assert.equal(
      parseDeliveryDetailsPagination({ page: "one", pageSize: "50" }),
      null,
    );
  });

  it("accepts only the four supported campaign-wide latest-status filters", () => {
    assert.equal(parseDeliveryDetailsStatusFilter(null), null);
    assert.equal(parseDeliveryDetailsStatusFilter(""), null);
    assert.equal(parseDeliveryDetailsStatusFilter("provider_accepted"), "provider_accepted");
    assert.equal(parseDeliveryDetailsStatusFilter("failed"), "failed");
    assert.equal(parseDeliveryDetailsStatusFilter("skipped"), "skipped");
    assert.equal(parseDeliveryDetailsStatusFilter("submission_unknown"), "submission_unknown");
    assert.equal(parseDeliveryDetailsStatusFilter("failed_provider"), undefined);
  });
});

describe("Monthly Update delivery-details Admin API source guards", () => {
  it("requires admin authorization, validates bounds, and preserves read-only operational boundaries", () => {
    const route = readFileSync(
      "app/api/admin/notifications/monthly-immigration-updates/[campaignId]/delivery-details/route.ts",
      "utf8",
    );
    const repository = readFileSync(
      "lib/notifications/monthly-update-campaign-delivery-details.ts",
      "utf8",
    );
    const retryRoute = readFileSync(
      "app/api/admin/notifications/monthly-immigration-updates/[campaignId]/retry-failed/route.ts",
      "utf8",
    );
    const individualRoute = readFileSync(
      "app/api/admin/notifications/send-monthly-immigration-update/route.ts",
      "utf8",
    );
    const campaignsMigration = readFileSync(
      "supabase/migrations/20260710140000_017_notification_campaigns.sql",
      "utf8",
    );
    assert.match(route, /export async function GET/);
    assert.match(route, /requireAdmin\(\)/);
    assert.match(route, /authErrorResponse/);
    assert.match(route, /UUID_PATTERN/);
    assert.match(route, /parseDeliveryDetailsPagination/);
    assert.match(route, /parseDeliveryDetailsStatusFilter/);
    assert.match(route, /searchParams\.get\("status"\)/);
    assert.match(repository, /\.range\(from, to\)/);
    assert.match(repository, /DELIVERY_STATE_FILTERS/);
    assert.match(repository, /applyDeliveryStatusFilter\(recipientQuery, input\.statusFilter\)/);
    assert.match(repository, /\.order\("latest_delivery_state"/);
    assert.match(repository, /\.order\("profile_id"/);
    assert.match(repository, /\.in\("campaign_recipient_id", recipientIds\)/);
    assert.doesNotMatch(repository, /\.from\("profiles"\)/);
    assert.doesNotMatch(repository, /provider_submission_key:/);
    assert.doesNotMatch(repository, /idempotency_key:/);
    assert.doesNotMatch(repository, /reason_detail:/);
    assert.doesNotMatch(repository, /\bemail:/);
    assert.match(retryRoute, /confirm !== true/);
    assert.match(individualRoute, /send_mode", value: "single_user"/);
    assert.match(
      campaignsMigration,
      /notification_campaigns_completed_bulletin_uidx/,
    );
    assert.match(
      campaignsMigration,
      /notification_campaigns_sending_bulletin_uidx/,
    );
  });
});
