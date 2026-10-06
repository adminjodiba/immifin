import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  NotificationCampaignRecipient,
  NotificationDeliveryAttempt,
  NotificationDeliveryAttemptOutcome,
  NotificationOriginalRecipientClaimResult,
} from "@/lib/supabase/types";

export type { NotificationOriginalRecipientClaimResult } from "@/lib/supabase/types";
type NotificationOriginalRecipientClaimOutcome =
  NotificationOriginalRecipientClaimResult["outcome"];

function mapAttempt(row: Record<string, unknown>): NotificationDeliveryAttempt {
  return row as NotificationDeliveryAttempt;
}

function mapRecipient(row: Record<string, unknown>): NotificationCampaignRecipient {
  return row as NotificationCampaignRecipient;
}

function isClaimOutcome(value: unknown): value is NotificationOriginalRecipientClaimOutcome {
  return [
    "claimed",
    "recipient_not_found",
    "not_originally_eligible",
    "already_claimed",
    "already_provider_accepted",
    "already_finalized",
  ].includes(value as NotificationOriginalRecipientClaimOutcome);
}

export function providerSubmissionKeyFromAttemptId(attemptId: string): string {
  return `immifin-notification-attempt:${attemptId}`;
}

/** Atomic original attempt claim. The database locks the recipient and creates
 * the immutable attempt before this function returns a sendable claim. */
export async function claimOriginalNotificationDeliveryAttempt(input: {
  campaignRecipientId: string;
  provider: string;
  tierAtAttempt: "pro" | "power";
}): Promise<NotificationOriginalRecipientClaimResult> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc(
    "claim_notification_original_recipient_attempt",
    {
      p_campaign_recipient_id: input.campaignRecipientId,
      p_provider: input.provider,
      p_tier_at_attempt: input.tierAtAttempt,
    },
  );

  if (error) {
    throw new Error(`Failed to claim original notification attempt: ${error.message}`);
  }
  if (!data || typeof data !== "object") {
    throw new Error("Original notification attempt claim returned an invalid payload.");
  }

  const payload = data as {
    outcome?: unknown;
    attempt?: Record<string, unknown>;
    recipient?: Record<string, unknown>;
  };
  if (!isClaimOutcome(payload.outcome)) {
    throw new Error("Original notification attempt claim returned an invalid outcome.");
  }

  const attempt = payload.attempt ? mapAttempt(payload.attempt) : undefined;
  if (
    payload.outcome === "claimed" &&
    (!attempt ||
      attempt.attempt_type !== "original" ||
      attempt.recovery_run_id !== null ||
      attempt.outcome !== "claimed" ||
      attempt.provider_submission_key !== providerSubmissionKeyFromAttemptId(attempt.id))
  ) {
    throw new Error("Original notification attempt claim returned invalid attempt evidence.");
  }

  return {
    outcome: payload.outcome,
    attempt,
    recipient: payload.recipient ? mapRecipient(payload.recipient) : undefined,
  };
}

export async function finalizeNotificationDeliveryAttempt(input: {
  deliveryAttemptId: string;
  outcome: Exclude<NotificationDeliveryAttemptOutcome, "claimed">;
  failureStage?: string | null;
  reasonCode?: string | null;
  reasonDetail?: string | null;
  provider?: string | null;
  providerMessageId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("finalize_notification_delivery_attempt", {
    p_delivery_attempt_id: input.deliveryAttemptId,
    p_outcome: input.outcome,
    p_failure_stage: input.failureStage ?? null,
    p_reason_code: input.reasonCode ?? null,
    p_reason_detail: input.reasonDetail ?? null,
    p_provider: input.provider ?? null,
    p_provider_message_id: input.providerMessageId ?? null,
  });

  if (error) {
    throw new Error(`Failed to finalize notification attempt: ${error.message}`);
  }
  if (!data || typeof data !== "object" || (data as { outcome?: unknown }).outcome !== "finalized") {
    throw new Error("Notification attempt finalization did not complete.");
  }
}