import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  sendOriginalMonthlyUpdateRecipient,
  type OriginalMonthlySendDependencies,
} from "./monthly-update-original-send";
import { ResendEmailProvider } from "./providers/resend-provider";
import { NOTIFICATION_PREFERENCES_KEY } from "@/lib/account/notificationPreferences";
import type {
  NotificationCampaignRecipient,
  NotificationDeliveryAttempt,
  ProfileWithRelations,
} from "@/lib/supabase/types";

const ATTEMPT_ID = "11111111-1111-4111-8111-111111111111";
const PROVIDER_KEY = `immifin-notification-attempt:${ATTEMPT_ID}`;

function profile(overrides: Partial<ProfileWithRelations> = {}): ProfileWithRelations {
  const immigrationProfile = {
    id: "immigration-1",
    profile_id: "profile-1",
    default_category: "EB2",
    default_country: "India",
    default_bulletin_type: "final_action",
    priority_date: "2020-01-01",
    green_card_issue_date: null,
    married_to_us_citizen: false,
    preferences: {},
    created_at: "2026-10-06T00:00:00.000Z",
    updated_at: "2026-10-06T00:00:00.000Z",
  };
  return {
    profile: {
      id: "profile-1",
      clerk_user_id: "clerk-1",
      email: "current@example.com",
      role: "user",
      plan: "pro",
      display_name: null,
      avatar_url: null,
      phone_number: null,
      status: "active",
      role_updated_at: null,
      role_updated_by_clerk_user_id: null,
      last_seen_at: null,
      last_login_at: null,
      clerk_synced_at: null,
      created_at: "2026-10-06T00:00:00.000Z",
      updated_at: "2026-10-06T00:00:00.000Z",
    },
    subscription: {
      id: "subscription-1",
      profile_id: "profile-1",
      plan: "pro",
      status: "active",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_price_id: null,
      billing_interval: "month",
      stripe_status: "active",
      cancel_at_period_end: false,
      canceled_at: null,
      current_period_start: null,
      current_period_end: null,
      last_synchronized_at: null,
      created_at: "2026-10-06T00:00:00.000Z",
      updated_at: "2026-10-06T00:00:00.000Z",
    },
    immigrationProfile,
    ...overrides,
  };
}

const recipient: NotificationCampaignRecipient = {
  id: "recipient-1",
  campaign_id: "campaign-1",
  profile_id: "profile-1",
  original_tier: "pro",
  original_eligibility_state: "eligible",
  original_exclusion_reason: null,
  original_evaluated_at: "2026-10-06T00:00:00.000Z",
  latest_delivery_state: "eligible_pending",
  latest_attempt_id: null,
  accepted_at: null,
  last_failure_code: null,
  last_failure_at: null,
  created_at: "2026-10-06T00:00:00.000Z",
  updated_at: "2026-10-06T00:00:00.000Z",
};

function attempt(): NotificationDeliveryAttempt {
  return {
    id: ATTEMPT_ID,
    campaign_recipient_id: recipient.id,
    recovery_run_id: null,
    attempt_number: 1,
    attempt_type: "original",
    outcome: "claimed",
    failure_stage: null,
    reason_code: null,
    reason_detail: null,
    provider: "resend",
    provider_message_id: null,
    provider_submission_key: PROVIDER_KEY,
    tier_at_attempt: "pro",
    attempted_at: "2026-10-06T00:00:00.000Z",
    completed_at: null,
    created_at: "2026-10-06T00:00:00.000Z",
  };
}

function dependencies(overrides: Partial<OriginalMonthlySendDependencies> = {}) {
  const calls: string[] = [];
  const finalizations: Parameters<OriginalMonthlySendDependencies["finalizeAttempt"]>[0][] = [];
  const sends: Parameters<OriginalMonthlySendDependencies["send"]>[0][] = [];
  const deps: OriginalMonthlySendDependencies = {
    loadProfileWithRelations: async () => profile(),
    claimAttempt: async () => {
      calls.push("claim");
      return { outcome: "claimed", attempt: attempt(), recipient };
    },
    finalizeAttempt: async (input) => {
      calls.push(`finalize:${input.outcome}`);
      finalizations.push(input);
    },
    prepare: async () => ({ source: {} as never, preview: {} as never }),
    render: async () => ({ subject: "Subject", html: "<p>HTML</p>", text: "Text" }),
    send: async (input) => {
      calls.push("send");
      sends.push(input);
      return { success: true, provider: "resend", providerMessageId: "resend-message-1" };
    },
    ...overrides,
  };
  return { deps, calls, finalizations, sends };
}

describe("original Monthly Immigration Update recipient evidence", () => {
  it("claims an original attempt before provider submission, uses the current email, and persists provider acceptance", async () => {
    const { deps, calls, finalizations, sends } = dependencies();
    const outcome = await sendOriginalMonthlyUpdateRecipient({
      campaignRecipient: recipient,
      candidate: { profileWithRelations: profile(), tier: "pro" },
      dependencies: deps,
    });

    assert.equal(outcome, "provider_accepted");
    assert.deepEqual(calls, ["claim", "send", "finalize:provider_accepted"]);
    assert.equal(sends[0].to, "current@example.com");
    assert.equal(sends[0].idempotencyKey, PROVIDER_KEY);
    assert.equal(PROVIDER_KEY.includes(recipient.profile_id), false);
    assert.equal(PROVIDER_KEY.length >= 1 && PROVIDER_KEY.length <= 256, true);
    assert.deepEqual(finalizations[0], {
      deliveryAttemptId: ATTEMPT_ID,
      outcome: "provider_accepted",
      provider: "resend",
      providerMessageId: "resend-message-1",
    });
  });

  it("does not call the provider after a changed Free entitlement", async () => {
    const free = profile({
      profile: { ...profile().profile, plan: "free" },
      subscription: { ...profile().subscription!, plan: "free", status: "inactive" },
    });
    const { deps, calls, finalizations } = dependencies({
      loadProfileWithRelations: async () => free,
    });
    const outcome = await sendOriginalMonthlyUpdateRecipient({
      campaignRecipient: recipient,
      candidate: { profileWithRelations: profile(), tier: "pro" },
      dependencies: deps,
    });
    assert.equal(outcome, "skipped_ineligible");
    assert.deepEqual(calls, ["claim", "finalize:skipped_ineligible"]);
    assert.equal(finalizations[0].reasonCode, "free_plan");
  });

  for (const [label, preferences, reasonCode] of [
    ["email alerts", { [NOTIFICATION_PREFERENCES_KEY]: { emailAlerts: false, visaBulletinUpdates: true } }, "email_alerts_disabled"],
    ["Visa Bulletin updates", { [NOTIFICATION_PREFERENCES_KEY]: { emailAlerts: true, visaBulletinUpdates: false } }, "visa_bulletin_updates_disabled"],
  ] as const) {
    it(`does not call the provider after ${label} is disabled`, async () => {
      const changed = profile({
        immigrationProfile: { ...profile().immigrationProfile!, preferences },
      });
      const { deps, calls, finalizations } = dependencies({
        loadProfileWithRelations: async () => changed,
      });
      const outcome = await sendOriginalMonthlyUpdateRecipient({
        campaignRecipient: recipient,
        candidate: { profileWithRelations: profile(), tier: "pro" },
        dependencies: deps,
      });
      assert.equal(outcome, "skipped_ineligible");
      assert.deepEqual(calls, ["claim", "finalize:skipped_ineligible"]);
      assert.equal(finalizations[0].reasonCode, reasonCode);
    });
  }

  it("records assembly/render failures before the provider", async () => {
    const assembly = dependencies({ prepare: async () => { throw new Error("assembly unavailable"); } });
    const assemblyOutcome = await sendOriginalMonthlyUpdateRecipient({
      campaignRecipient: recipient,
      candidate: { profileWithRelations: profile(), tier: "pro" },
      dependencies: assembly.deps,
    });
    assert.equal(assemblyOutcome, "failed_before_provider");
    assert.deepEqual(assembly.calls, ["claim", "finalize:failed_before_provider"]);
    assert.equal(assembly.finalizations[0].reasonCode, "assembly_failed");

    const render = dependencies({ render: async () => { throw new Error("render unavailable"); } });
    const renderOutcome = await sendOriginalMonthlyUpdateRecipient({
      campaignRecipient: recipient,
      candidate: { profileWithRelations: profile(), tier: "pro" },
      dependencies: render.deps,
    });
    assert.equal(renderOutcome, "failed_before_provider");
    assert.equal(render.finalizations[0].reasonCode, "render_failed");
  });

  it("maps explicit provider failure and uncertain submission distinctly", async () => {
    const explicit = dependencies({
      send: async () => ({
        success: false,
        provider: "resend",
        providerMessageId: null,
        errorCode: "NOTIFICATION_PROVIDER_ERROR",
        errorMessage: "provider rejected",
      }),
    });
    assert.equal(
      await sendOriginalMonthlyUpdateRecipient({
        campaignRecipient: recipient,
        candidate: { profileWithRelations: profile(), tier: "pro" },
        dependencies: explicit.deps,
      }),
      "failed_provider",
    );
    assert.equal(explicit.finalizations[0].reasonCode, "provider_rejected");

    const unknown = dependencies({ send: async () => { throw new Error("network lost"); } });
    assert.equal(
      await sendOriginalMonthlyUpdateRecipient({
        campaignRecipient: recipient,
        candidate: { profileWithRelations: profile(), tier: "pro" },
        dependencies: unknown.deps,
      }),
      "submission_unknown",
    );
    assert.equal(unknown.finalizations[0].reasonCode, "provider_timeout_or_unknown");
  });

  it("does not submit a duplicate when atomic original claim refuses it", async () => {
    const { deps, calls } = dependencies({
      claimAttempt: async () => ({
        outcome: "already_provider_accepted",
        attempt: attempt(),
        recipient,
      }),
    });
    assert.equal(
      await sendOriginalMonthlyUpdateRecipient({
        campaignRecipient: recipient,
        candidate: { profileWithRelations: profile(), tier: "pro" },
        dependencies: deps,
      }),
      "not_claimed",
    );
    assert.deepEqual(calls, []);
  });
});

describe("Resend idempotency adapter boundary", () => {
  it("passes the stable provider key as the Resend SDK second argument", async () => {
    const calls: unknown[][] = [];
    const provider = new ResendEmailProvider("test-key");
    (provider as unknown as { client: unknown }).client = {
      emails: {
        send: async (...args: unknown[]) => {
          calls.push(args);
          return { data: { id: "resend-message-1" }, error: null };
        },
      },
    };
    const result = await provider.send({
      from: "IMMIFIN <updates@example.com>",
      to: "current@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
      idempotencyKey: PROVIDER_KEY,
    });
    assert.equal(result.success, true);
    assert.deepEqual(calls[0][1], { idempotencyKey: PROVIDER_KEY });
  });
});

describe("tracking source guards", () => {
  it("persists both audience states without email identity and keeps locked paths unchanged", () => {
    const recipientRepository = readFileSync("lib/notifications/notification-campaign-recipients.ts", "utf8");
    const control = readFileSync("lib/notifications/monthly-update-control-center.ts", "utf8");
    const individual = readFileSync("app/api/admin/notifications/send-monthly-immigration-update/route.ts", "utf8");
    const campaignsMigration = readFileSync("supabase/migrations/20260710140000_017_notification_campaigns.sql", "utf8");
    const trackingMigration = readFileSync("supabase/migrations/20261005120000_022_notification_recipient_delivery_tracking.sql", "utf8");
    assert.match(recipientRepository, /original_eligibility_state: eligibility\.kind === "eligible" \? "eligible" : "excluded"/);
    assert.match(recipientRepository, /latest_delivery_state:\s*eligibility\.kind === "eligible" \? "eligible_pending" : "audience_excluded"/);
    assert.doesNotMatch(recipientRepository, /\bemail:/);
    assert.match(control, /persistOriginalMonthlyUpdateAudience/);
    assert.match(individual, /send_mode", value: "single_user"/);
    assert.doesNotMatch(individual, /persistOriginalMonthlyUpdateAudience|claimOriginalNotificationDeliveryAttempt/);
    assert.match(campaignsMigration, /notification_campaigns_completed_bulletin_uidx/);
    assert.match(campaignsMigration, /notification_campaigns_sending_bulletin_uidx/);
    assert.match(trackingMigration, /Historical campaigns are intentionally not backfilled/);
    assert.doesNotMatch(control, /Delivered/);
  });
});