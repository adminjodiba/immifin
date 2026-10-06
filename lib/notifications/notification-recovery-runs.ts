import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  NotificationCampaignRecipient,
  NotificationDeliveryAttempt,
  NotificationRecoveryRecipientClaimResult,
  NotificationRecoveryRun,
  NotificationRecoveryRunClaimResult,
  NotificationRecoveryRunCompleteResult,
} from "@/lib/supabase/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function mapRecipient(row: Record<string, unknown>): NotificationCampaignRecipient {
  return row as NotificationCampaignRecipient;
}

function mapAttempt(row: Record<string, unknown>): NotificationDeliveryAttempt {
  return row as NotificationDeliveryAttempt;
}

function mapRecoveryRun(row: Record<string, unknown>): NotificationRecoveryRun {
  return row as NotificationRecoveryRun;
}

const recoveryRunClaimOutcomes = new Set<NotificationRecoveryRunClaimResult["outcome"]>([
  "claimed",
  "idempotent",
  "campaign_not_found",
  "campaign_not_recoverable",
  "legacy_campaign",
  "no_retryable_recipients",
  "active_recovery_exists",
]);

const recipientClaimOutcomes = new Set<NotificationRecoveryRecipientClaimResult["outcome"]>([
  "claimed",
  "recovery_run_not_found",
  "recovery_run_not_active",
  "recipient_not_in_campaign",
  "already_provider_accepted",
  "already_claimed",
  "not_retryable",
  "already_finalized_for_recovery",
]);

const completionOutcomes = new Set<NotificationRecoveryRunCompleteResult["outcome"]>([
  "completed",
  "recovery_run_not_found",
  "already_completed",
  "attempts_still_claimed",
]);

/** Server-only persistence boundary for manual failed-recipient recovery. */
export async function createOrClaimNotificationRecoveryRun(input: {
  campaignId: string;
  idempotencyKey: string;
  actorProfileId: string | null;
  actorClerkUserId: string;
  actorEmail: string;
}): Promise<NotificationRecoveryRunClaimResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("create_or_claim_notification_recovery_run", {
    p_campaign_id: input.campaignId,
    p_idempotency_key: input.idempotencyKey,
    p_actor_profile_id: input.actorProfileId,
    p_actor_clerk_user_id: input.actorClerkUserId,
    p_actor_email: input.actorEmail,
  });

  if (error) {
    throw new Error(`Failed to create or claim notification recovery run: ${error.message}`);
  }
  if (!isRecord(data) || !recoveryRunClaimOutcomes.has(data.outcome as NotificationRecoveryRunClaimResult["outcome"])) {
    throw new Error("Notification recovery run claim returned an invalid payload.");
  }

  return {
    outcome: data.outcome as NotificationRecoveryRunClaimResult["outcome"],
    recovery_run: isRecord(data.recovery_run) ? mapRecoveryRun(data.recovery_run) : undefined,
  };
}

/** Lists only the two explicitly retryable persisted states; caller supplies no recipient selection. */
export async function listRetryableNotificationCampaignRecipients(
  campaignId: string,
): Promise<NotificationCampaignRecipient[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_campaign_recipients")
    .select("*")
    .eq("campaign_id", campaignId)
    .in("latest_delivery_state", ["failed_before_provider", "failed_provider"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load retryable notification recipients: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRecipient(row as Record<string, unknown>));
}

export async function countRetryableNotificationCampaignRecipients(campaignId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("notification_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .in("latest_delivery_state", ["failed_before_provider", "failed_provider"]);

  if (error) {
    throw new Error(`Failed to count retryable notification recipients: ${error.message}`);
  }

  return count ?? 0;
}

export async function claimNotificationRecoveryRecipientAttempt(input: {
  recoveryRunId: string;
  campaignRecipientId: string;
  provider: string;
  tierAtAttempt: "pro" | "power";
}): Promise<NotificationRecoveryRecipientClaimResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("claim_notification_recovery_recipient_attempt", {
    p_recovery_run_id: input.recoveryRunId,
    p_campaign_recipient_id: input.campaignRecipientId,
    p_provider: input.provider,
    p_tier_at_attempt: input.tierAtAttempt,
  });

  if (error) {
    throw new Error(`Failed to claim notification recovery attempt: ${error.message}`);
  }
  if (!isRecord(data) || !recipientClaimOutcomes.has(data.outcome as NotificationRecoveryRecipientClaimResult["outcome"])) {
    throw new Error("Notification recovery attempt claim returned an invalid payload.");
  }

  const attempt = isRecord(data.attempt) ? mapAttempt(data.attempt) : undefined;
  if (
    data.outcome === "claimed" &&
    (!attempt ||
      attempt.attempt_type !== "retry" ||
      attempt.recovery_run_id !== input.recoveryRunId ||
      attempt.outcome !== "claimed" ||
      !attempt.provider_submission_key)
  ) {
    throw new Error("Notification recovery attempt claim returned invalid attempt evidence.");
  }

  return {
    outcome: data.outcome as NotificationRecoveryRecipientClaimResult["outcome"],
    attempt,
    recipient: isRecord(data.recipient) ? mapRecipient(data.recipient) : undefined,
    recovery_run: isRecord(data.recovery_run) ? mapRecoveryRun(data.recovery_run) : undefined,
  };
}

export async function completeNotificationRecoveryRun(
  recoveryRunId: string,
): Promise<NotificationRecoveryRunCompleteResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("complete_notification_recovery_run", {
    p_recovery_run_id: recoveryRunId,
  });

  if (error) {
    throw new Error(`Failed to complete notification recovery run: ${error.message}`);
  }
  if (!isRecord(data) || !completionOutcomes.has(data.outcome as NotificationRecoveryRunCompleteResult["outcome"])) {
    throw new Error("Notification recovery completion returned an invalid payload.");
  }

  return {
    outcome: data.outcome as NotificationRecoveryRunCompleteResult["outcome"],
    claimed_attempt_count:
      typeof data.claimed_attempt_count === "number" ? data.claimed_attempt_count : undefined,
    recovery_run: isRecord(data.recovery_run) ? mapRecoveryRun(data.recovery_run) : undefined,
  };
}