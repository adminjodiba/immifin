import {
  isMonthlyUpdateAssemblyError,
  type MonthlyUpdateAssemblyErrorCode,
  type MonthlyImmigrationUpdatePrepared,
} from "@/lib/notifications/build-monthly-immigration-report-dashboard-source";
import {
  evaluateMonthlyUpdateSummaryEligibility,
  type MonthlyUpdateAudienceCandidate,
} from "@/lib/notifications/monthly-update-audience";
import type { EmailProviderSendResult } from "@/lib/notifications/providers/email-provider";
import type {
  NotificationCampaignRecipient,
  NotificationDeliveryAttempt,
  NotificationOriginalRecipientClaimResult,
  ProfileWithRelations,
} from "@/lib/supabase/types";

export type OriginalMonthlySendTerminalOutcome =
  | "provider_accepted"
  | "failed_before_provider"
  | "failed_provider"
  | "skipped_ineligible"
  | "submission_unknown"
  | "not_claimed";

export type OriginalMonthlySendDependencies = {
  loadProfileWithRelations(profileId: string): Promise<ProfileWithRelations | null>;
  claimAttempt(input: {
    campaignRecipientId: string;
    provider: string;
    tierAtAttempt: "pro" | "power";
  }): Promise<NotificationOriginalRecipientClaimResult>;
  finalizeAttempt(input: {
    deliveryAttemptId: string;
    outcome: Exclude<OriginalMonthlySendTerminalOutcome, "not_claimed">;
    failureStage?: string | null;
    reasonCode?: string | null;
    reasonDetail?: string | null;
    provider?: string | null;
    providerMessageId?: string | null;
  }): Promise<void>;
  prepare(profile: ProfileWithRelations): Promise<MonthlyImmigrationUpdatePrepared>;
  render(prepared: MonthlyImmigrationUpdatePrepared): Promise<{
    subject: string;
    html: string;
    text: string;
  }>;
  send(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
    idempotencyKey: string;
  }): Promise<EmailProviderSendResult>;
};

function normalizedEligibilityReason(
  profile: ProfileWithRelations | null,
): string {
  if (!profile) {
    return "inactive_profile";
  }
  const eligibility = evaluateMonthlyUpdateSummaryEligibility(profile);
  if (eligibility.kind === "skip") {
    return eligibility.reason === "unsupported_profile" && profile.profile.status !== "active"
      ? "inactive_profile"
      : eligibility.reason;
  }
  return "unsupported_profile";
}

function assemblyReasonCode(error: unknown): string {
  if (!isMonthlyUpdateAssemblyError(error)) {
    return "assembly_failed";
  }

  const codes: Record<MonthlyUpdateAssemblyErrorCode, string> = {
    MONTHLY_UPDATE_USER_NOT_FOUND: "inactive_profile",
    MONTHLY_UPDATE_PROFILE_INACTIVE: "inactive_profile",
    MONTHLY_UPDATE_IMMIGRATION_PROFILE_MISSING: "missing_immigration_profile",
    MONTHLY_UPDATE_IMMIGRATION_PROFILE_INCOMPLETE: "missing_required_data",
    MONTHLY_UPDATE_UNSUPPORTED_JOURNEY: "unsupported_profile",
    MONTHLY_UPDATE_BULLETIN_MONTH_UNAVAILABLE: "bulletin_month_unavailable",
  };
  return codes[error.code];
}

function safeErrorDetail(error: unknown): string | null {
  return error instanceof Error && error.message.trim() ? error.message.trim().slice(0, 300) : null;
}

function isDefinitelyPreProviderFailure(result: EmailProviderSendResult): boolean {
  return result.errorCode === "NOTIFICATION_CONFIG_ERROR" || result.errorCode === "NOTIFICATION_INVALID_INPUT";
}

/**
 * Handles one persisted originally-eligible profile. It reloads current data,
 * creates an immutable original attempt before any provider call, and records a
 * terminal evidence state. A claim refusal is intentionally a no-send result.
 */
export async function sendOriginalMonthlyUpdateRecipient(input: {
  campaignRecipient: NotificationCampaignRecipient;
  candidate: MonthlyUpdateAudienceCandidate;
  dependencies: OriginalMonthlySendDependencies;
}): Promise<OriginalMonthlySendTerminalOutcome> {
  const current = await input.dependencies.loadProfileWithRelations(
    input.campaignRecipient.profile_id,
  );
  const currentEligibility = current
    ? evaluateMonthlyUpdateSummaryEligibility(current)
    : { kind: "skip" as const, reason: "unsupported_profile" as const };
  const tierAtAttempt =
    currentEligibility.kind === "eligible"
      ? currentEligibility.tier
      : input.candidate.tier;
  const claim = await input.dependencies.claimAttempt({
    campaignRecipientId: input.campaignRecipient.id,
    provider: "resend",
    tierAtAttempt,
  });

  if (claim.outcome !== "claimed" || !claim.attempt) {
    return "not_claimed";
  }

  const attempt: NotificationDeliveryAttempt = claim.attempt;
  if (!current || currentEligibility.kind === "skip") {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "skipped_ineligible",
      failureStage: "eligibility",
      reasonCode: normalizedEligibilityReason(current),
    });
    return "skipped_ineligible";
  }

  let prepared: MonthlyImmigrationUpdatePrepared;
  try {
    prepared = await input.dependencies.prepare(current);
  } catch (error) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "failed_before_provider",
      failureStage: "assembly",
      reasonCode: assemblyReasonCode(error),
      reasonDetail: safeErrorDetail(error),
    });
    return "failed_before_provider";
  }

  let rendered: { subject: string; html: string; text: string };
  try {
    rendered = await input.dependencies.render(prepared);
  } catch (error) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "failed_before_provider",
      failureStage: "render",
      reasonCode: "render_failed",
      reasonDetail: safeErrorDetail(error),
    });
    return "failed_before_provider";
  }

  const idempotencyKey = attempt.provider_submission_key;
  if (!idempotencyKey) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "failed_before_provider",
      failureStage: "configuration",
      reasonCode: "notification_config_error",
    });
    return "failed_before_provider";
  }

  let result: EmailProviderSendResult;
  try {
    result = await input.dependencies.send({
      to: current.profile.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey,
    });
  } catch (error) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "submission_unknown",
      failureStage: "provider_submission",
      reasonCode: "provider_timeout_or_unknown",
      reasonDetail: safeErrorDetail(error),
      provider: "resend",
    });
    return "submission_unknown";
  }

  if (result.success) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "provider_accepted",
      provider: result.provider,
      providerMessageId: result.providerMessageId,
    });
    return "provider_accepted";
  }

  if (result.submissionUncertain) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "submission_unknown",
      failureStage: "provider_submission",
      reasonCode: "provider_timeout_or_unknown",
      reasonDetail: result.errorMessage ?? null,
      provider: result.provider,
    });
    return "submission_unknown";
  }

  if (isDefinitelyPreProviderFailure(result)) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "failed_before_provider",
      failureStage: "notification",
      reasonCode:
        result.errorCode === "NOTIFICATION_INVALID_INPUT"
          ? "notification_invalid_input"
          : "notification_config_error",
      reasonDetail: result.errorMessage ?? null,
      provider: result.provider,
    });
    return "failed_before_provider";
  }

  await input.dependencies.finalizeAttempt({
    deliveryAttemptId: attempt.id,
    outcome: "failed_provider",
    failureStage: "provider",
    reasonCode: "provider_rejected",
    reasonDetail: result.errorMessage ?? null,
    provider: result.provider,
  });
  return "failed_provider";
}