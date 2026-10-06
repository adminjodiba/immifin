import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  recoverFailedMonthlyUpdateRecipients,
  type FailedRecipientRecoveryDependencies,
} from "./monthly-update-failed-recipient-recovery";
import { NOTIFICATION_PREFERENCES_KEY } from "@/lib/account/notificationPreferences";
import type {
  NotificationCampaignRecipient,
  NotificationDeliveryAttempt,
  NotificationRecoveryRun,
  ProfileWithRelations,
} from "@/lib/supabase/types";

const CAMPAIGN_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const RECOVERY_RUN_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ORIGINAL_PROVIDER_KEY = "immifin-notification-attempt:original-attempt";

function profile(overrides: Partial<ProfileWithRelations> = {}): ProfileWithRelations {
  return {
    profile: {
      id: "profile-1", clerk_user_id: "clerk-1", email: "current@example.com", role: "user", plan: "pro",
      display_name: null, avatar_url: null, phone_number: null, status: "active", role_updated_at: null,
      role_updated_by_clerk_user_id: null, last_seen_at: null, last_login_at: null, clerk_synced_at: null,
      created_at: "2026-10-06T00:00:00.000Z", updated_at: "2026-10-06T00:00:00.000Z",
    },
    subscription: {
      id: "subscription-1", profile_id: "profile-1", plan: "pro", status: "active", stripe_customer_id: null,
      stripe_subscription_id: null, stripe_price_id: null, billing_interval: "month", stripe_status: "active",
      cancel_at_period_end: false, canceled_at: null, current_period_start: null, current_period_end: null,
      last_synchronized_at: null, created_at: "2026-10-06T00:00:00.000Z", updated_at: "2026-10-06T00:00:00.000Z",
    },
    immigrationProfile: {
      id: "immigration-1", profile_id: "profile-1", default_category: "EB2", default_country: "India",
      default_bulletin_type: "final_action", priority_date: "2020-01-01", green_card_issue_date: null,
      married_to_us_citizen: false, preferences: {}, created_at: "2026-10-06T00:00:00.000Z",
      updated_at: "2026-10-06T00:00:00.000Z",
    },
    ...overrides,
  };
}

function recipient(id: string, state: NotificationCampaignRecipient["latest_delivery_state"]): NotificationCampaignRecipient {
  return {
    id, campaign_id: CAMPAIGN_ID, profile_id: `profile-${id}`, original_tier: "pro", original_eligibility_state: "eligible",
    original_exclusion_reason: null, original_evaluated_at: "2026-10-06T00:00:00.000Z", latest_delivery_state: state,
    latest_attempt_id: null, accepted_at: null, last_failure_code: null, last_failure_at: null,
    created_at: "2026-10-06T00:00:00.000Z", updated_at: "2026-10-06T00:00:00.000Z",
  };
}

function recoveryRun(overrides: Partial<NotificationRecoveryRun> = {}): NotificationRecoveryRun {
  return {
    id: RECOVERY_RUN_ID, campaign_id: CAMPAIGN_ID, status: "completed", idempotency_key: "request-key",
    actor_profile_id: "actor", actor_clerk_user_id: "admin", actor_email: "admin@example.com",
    requested_at: "2026-10-06T00:00:00.000Z", processing_started_at: "2026-10-06T00:00:00.000Z",
    completed_at: "2026-10-06T00:00:00.000Z", attempted_recipient_count: 1, provider_accepted_count: 1,
    failed_before_provider_count: 0, failed_provider_count: 0, skipped_ineligible_count: 0, submission_unknown_count: 0,
    created_at: "2026-10-06T00:00:00.000Z", updated_at: "2026-10-06T00:00:00.000Z", ...overrides,
  };
}

function retryAttempt(campaignRecipientId: string): NotificationDeliveryAttempt {
  return {
    id: `attempt-${campaignRecipientId}`, campaign_recipient_id: campaignRecipientId, recovery_run_id: RECOVERY_RUN_ID,
    attempt_number: 2, attempt_type: "retry", outcome: "claimed", failure_stage: null, reason_code: null,
    reason_detail: null, provider: "resend", provider_message_id: null,
    provider_submission_key: `db-owned-key-${campaignRecipientId}`, tier_at_attempt: "pro",
    attempted_at: "2026-10-06T00:00:00.000Z", completed_at: null, created_at: "2026-10-06T00:00:00.000Z",
  };
}

function dependencies(input: {
  runOutcome?: Parameters<FailedRecipientRecoveryDependencies["createOrClaimRun"]>[0] extends never ? never : "claimed" | "idempotent" | "legacy_campaign" | "no_retryable_recipients" | "active_recovery_exists";
  recipients?: NotificationCampaignRecipient[];
  currentProfile?: ProfileWithRelations | null;
  claimOutcome?: "claimed" | "not_retryable";
  providerResult?: Awaited<ReturnType<FailedRecipientRecoveryDependencies["send"]>>;
} = {}) {
  const calls: string[] = [];
  const sends: Parameters<FailedRecipientRecoveryDependencies["send"]>[0][] = [];
  const finalizations: Parameters<FailedRecipientRecoveryDependencies["finalizeAttempt"]>[0][] = [];
  const selected = input.recipients ?? [recipient("a", "failed_provider")];
  const run = recoveryRun();
  const deps: FailedRecipientRecoveryDependencies = {
    createOrClaimRun: async () => {
      const outcome = input.runOutcome ?? "claimed";
      return outcome === "claimed" ? { outcome, recovery_run: run } : { outcome, recovery_run: outcome === "idempotent" || outcome === "active_recovery_exists" ? run : undefined };
    },
    listRetryableRecipients: async () => {
      calls.push("list");
      return selected.filter((item) => item.latest_delivery_state === "failed_before_provider" || item.latest_delivery_state === "failed_provider");
    },
    claimAttempt: async ({ campaignRecipientId }) => {
      calls.push(`claim:${campaignRecipientId}`);
      return input.claimOutcome === "not_retryable"
        ? { outcome: "not_retryable" }
        : { outcome: "claimed", attempt: retryAttempt(campaignRecipientId), recipient: selected.find((item) => item.id === campaignRecipientId) };
    },
    loadProfileWithRelations: async (profileId) => {
      calls.push(`load:${profileId}`);
      const current = input.currentProfile ?? profile();
      return current ? { ...current, profile: { ...current.profile, id: profileId } } : null;
    },
    finalizeAttempt: async (finalization) => { finalizations.push(finalization); calls.push(`finalize:${finalization.outcome}`); },
    prepare: async (current) => {
      calls.push("prepare");
      return { source: { identity: current.profile.email } as never, preview: { subject: `Fresh for ${current.profile.email}` } as never };
    },
    render: async (prepared) => {
      calls.push("render");
      return { subject: prepared.preview.subject, html: "<p>fresh</p>", text: "fresh" };
    },
    send: async (sendInput) => {
      calls.push("send"); sends.push(sendInput);
      return input.providerResult ?? { success: true, provider: "resend", providerMessageId: "provider-message-1" };
    },
    completeRun: async () => {
      calls.push("complete");
      const accepted = finalizations.filter((item) => item.outcome === "provider_accepted").length;
      const failedBefore = finalizations.filter((item) => item.outcome === "failed_before_provider").length;
      const failedProvider = finalizations.filter((item) => item.outcome === "failed_provider").length;
      const skipped = finalizations.filter((item) => item.outcome === "skipped_ineligible").length;
      const unknown = finalizations.filter((item) => item.outcome === "submission_unknown").length;
      return { outcome: "completed", recovery_run: recoveryRun({ attempted_recipient_count: finalizations.length, provider_accepted_count: accepted, failed_before_provider_count: failedBefore, failed_provider_count: failedProvider, skipped_ineligible_count: skipped, submission_unknown_count: unknown, status: failedBefore || failedProvider || unknown ? "completed_with_failures" : "completed" }) };
    },
    countRetryableRecipients: async () => finalizations.filter((item) => item.outcome === "failed_before_provider" || item.outcome === "failed_provider").length,
  };
  return { deps, calls, sends, finalizations };
}

async function recover(deps: FailedRecipientRecoveryDependencies, key = "request-key") {
  return recoverFailedMonthlyUpdateRecipients({
    campaignId: CAMPAIGN_ID, idempotencyKey: key, actorProfileId: "actor", actorClerkUserId: "admin", actorEmail: "admin@example.com", dependencies: deps,
  });
}

describe("failed-recipient Monthly Update recovery", () => {
  it("refuses legacy/no-failure campaigns and blocks an active second recovery without selecting or sending", async () => {
    for (const outcome of ["legacy_campaign", "no_retryable_recipients", "active_recovery_exists"] as const) {
      const test = dependencies({ runOutcome: outcome });
      const result = await recover(test.deps);
      assert.equal(test.calls.includes("list"), false);
      assert.equal(test.calls.includes("send"), false);
      assert.equal(result.outcome, outcome === "no_retryable_recipients" ? "no_retryable_failures" : outcome === "active_recovery_exists" ? "active_recovery_conflict" : "legacy_campaign");
    }
  });

  it("selects only explicit failures and never sends accepted, unknown, skipped, excluded, pending, or in-progress recipients", async () => {
    const test = dependencies({ recipients: [
      recipient("before", "failed_before_provider"), recipient("provider", "failed_provider"), recipient("accepted", "provider_accepted"),
      recipient("unknown", "submission_unknown"), recipient("skipped", "skipped_ineligible"), recipient("excluded", "audience_excluded"),
      recipient("pending", "eligible_pending"), recipient("progress", "attempt_in_progress"),
    ] });
    await recover(test.deps);
    assert.deepEqual(test.sends.map((send) => send.idempotencyKey), ["db-owned-key-before", "db-owned-key-provider"]);
    assert.equal(
      test.calls.some(
        (call) =>
          call.startsWith("claim:") &&
          (call.includes("accepted") || call.includes("unknown") || call.includes("skipped") || call.includes("excluded") || call.includes("pending") || call.includes("progress")),
      ),
      false,
    );
  });

  it("claims before provider use, never sends after a refused claim, and uses the DB-owned retry key with current email/content", async () => {
    const success = dependencies();
    await recover(success.deps);
    assert.ok(success.calls.indexOf("claim:a") < success.calls.indexOf("send"));
    assert.equal(success.sends[0].to, "current@example.com");
    assert.equal(success.sends[0].subject, "Fresh for current@example.com");
    assert.equal(success.sends[0].idempotencyKey, "db-owned-key-a");
    assert.notEqual(success.sends[0].idempotencyKey, ORIGINAL_PROVIDER_KEY);

    const refused = dependencies({ claimOutcome: "not_retryable" });
    await recover(refused.deps);
    assert.equal(refused.calls.includes("send"), false);
  });

  it("rechecks current eligibility and skips Free, opted-out, and inactive recipients without provider calls", async () => {
    const disabledPrefs = { [NOTIFICATION_PREFERENCES_KEY]: { emailAlerts: false, visaBulletinUpdates: true } };
    const visaDisabledPrefs = { [NOTIFICATION_PREFERENCES_KEY]: { emailAlerts: true, visaBulletinUpdates: false } };
    const cases = [
      profile({ subscription: { ...profile().subscription!, plan: "free" } }),
      profile({ immigrationProfile: { ...profile().immigrationProfile!, preferences: disabledPrefs } }),
      profile({ immigrationProfile: { ...profile().immigrationProfile!, preferences: visaDisabledPrefs } }),
      profile({ profile: { ...profile().profile, status: "suspended" } }),
    ];
    for (const currentProfile of cases) {
      const test = dependencies({ currentProfile });
      await recover(test.deps);
      assert.equal(test.calls.includes("send"), false);
      assert.equal(test.finalizations[0].outcome, "skipped_ineligible");
    }
  });

  it("maps provider accepted, explicit provider failure, pre-provider failure, and uncertain submission conservatively", async () => {
    const cases = [
      [{ success: true, provider: "resend", providerMessageId: "message-1" }, "provider_accepted"],
      [{ success: false, provider: "resend", providerMessageId: null, errorMessage: "rejected" }, "failed_provider"],
      [{ success: false, provider: "resend", providerMessageId: null, errorCode: "NOTIFICATION_INVALID_INPUT" }, "failed_before_provider"],
      [{ success: false, provider: "resend", providerMessageId: null, submissionUncertain: true }, "submission_unknown"],
    ] as const;
    for (const [providerResult, expected] of cases) {
      const test = dependencies({ providerResult });
      await recover(test.deps);
      assert.equal(test.finalizations[0].outcome, expected);
    }
  });

  it("returns an idempotent existing recovery result without resend and completes counts from final persisted evidence", async () => {
    const replay = dependencies({ runOutcome: "idempotent" });
    const replayResult = await recover(replay.deps);
    assert.equal(replayResult.outcome, "idempotent");
    assert.equal(replay.calls.includes("send"), false);

    const evidence = dependencies({ providerResult: { success: false, provider: "resend", providerMessageId: null, errorMessage: "rejected" } });
    const result = await recover(evidence.deps, "new-key");
    assert.equal(result.targetedCount, 1);
    assert.equal(result.failedCount, 1);
    assert.equal(result.remainingRetryableFailureCount, 1);
  });

  it("covers partial recovery semantics: accepted A becomes ineligible for later selection while failed B remains retryable", async () => {
    const a = recipient("A", "failed_provider");
    const b = recipient("B", "failed_provider");
    const first = dependencies({ recipients: [a, b] });
    let sends = 0;
    first.deps.send = async (input) => {
      first.sends.push(input); sends += 1;
      return sends === 1
        ? { success: true, provider: "resend", providerMessageId: "accepted-A" }
        : { success: false, provider: "resend", providerMessageId: null, errorMessage: "failed-B" };
    };
    await recover(first.deps, "run-1");
    const later = dependencies({ recipients: [recipient("B", "failed_provider"), recipient("C", "provider_accepted")] });
    await recover(later.deps, "run-2");
    assert.deepEqual(first.sends.map((input) => input.idempotencyKey), ["db-owned-key-A", "db-owned-key-B"]);
    assert.deepEqual(later.sends.map((input) => input.idempotencyKey), ["db-owned-key-B"]);
  });
});

describe("failed-recipient recovery API and source guards", () => {
  it("strictly documents the Admin request contract and preserves unrelated paths", () => {
    const route = readFileSync("app/api/admin/notifications/monthly-immigration-updates/[campaignId]/retry-failed/route.ts", "utf8");
    const recovery = readFileSync("lib/notifications/monthly-update-failed-recipient-recovery.ts", "utf8");
    const runtime = readFileSync("lib/notifications/monthly-update-failed-recipient-recovery-runtime.ts", "utf8");
    const original = readFileSync("lib/notifications/monthly-update-original-send.ts", "utf8");
    const controlCenter = readFileSync("lib/notifications/monthly-update-control-center.ts", "utf8");
    const individual = readFileSync("app/api/admin/notifications/send-monthly-immigration-update/route.ts", "utf8");
    const migration = readFileSync("supabase/migrations/20261005120000_022_notification_recipient_delivery_tracking.sql", "utf8");
    assert.match(route, /requireAdmin\(\)/);
    assert.match(route, /authErrorResponse/);
    assert.match(route, /confirm !== true/);
    assert.match(route, /UUID_PATTERN/);
    assert.match(route, /MAX_IDEMPOTENCY_KEY_LENGTH = 200/);
    assert.doesNotMatch(route, /recipientIds|recipient_ids|emailAddresses|recipientStates/);
    assert.match(recovery, /attempt\.provider_submission_key/);
    assert.doesNotMatch(recovery, /providerSubmissionKeyFromAttemptId|immifin-notification-attempt:/);
    assert.match(recovery, /evaluateMonthlyUpdateSummaryEligibility/);
    assert.match(runtime, /prepareMonthlyImmigrationUpdateForUser/);
    assert.match(runtime, /renderMonthlyImmigrationReportEmail/);
    assert.match(original, /sendOriginalMonthlyUpdateRecipient/);
    assert.match(controlCenter, /claimOriginalNotificationDeliveryAttempt/);
    assert.match(individual, /send_mode", value: "single_user"/);
    assert.doesNotMatch(individual, /recoverFailedMonthlyUpdateRecipients/);
    assert.match(migration, /Historical campaigns are intentionally not backfilled/);
    assert.match(migration, /October 2026 is explicitly legacy|legacy_campaign/);
  });
});