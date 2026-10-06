import {
  isMonthlyUpdateAssemblyError,
  type MonthlyUpdateAssemblyErrorCode,
  type MonthlyImmigrationUpdatePrepared,
} from "@/lib/notifications/build-monthly-immigration-report-dashboard-source";
import { evaluateMonthlyUpdateSummaryEligibility } from "@/lib/notifications/monthly-update-audience";
import type { EmailProviderSendResult } from "@/lib/notifications/providers/email-provider";
import type {
  NotificationCampaignRecipient,
  NotificationDeliveryAttempt,
  NotificationRecoveryRecipientClaimResult,
  NotificationRecoveryRun,
  NotificationRecoveryRunClaimResult,
  NotificationRecoveryRunCompleteResult,
  ProfileWithRelations,
} from "@/lib/supabase/types";

export type FailedRecipientRecoveryTerminalOutcome =
  | "provider_accepted"
  | "failed_before_provider"
  | "failed_provider"
  | "skipped_ineligible"
  | "submission_unknown"
  | "not_claimed";

export type FailedRecipientRecoveryDependencies = {
  createOrClaimRun(input: {
    campaignId: string;
    idempotencyKey: string;
    actorProfileId: string | null;
    actorClerkUserId: string;
    actorEmail: string;
  }): Promise<NotificationRecoveryRunClaimResult>;
  listRetryableRecipients(campaignId: string): Promise<NotificationCampaignRecipient[]>;
  claimAttempt(input: {
    recoveryRunId: string;
    campaignRecipientId: string;
    provider: string;
    tierAtAttempt: "pro" | "power";
  }): Promise<NotificationRecoveryRecipientClaimResult>;
  loadProfileWithRelations(profileId: string): Promise<ProfileWithRelations | null>;
  finalizeAttempt(input: {
    deliveryAttemptId: string;
    outcome: Exclude<FailedRecipientRecoveryTerminalOutcome, "not_claimed">;
    failureStage?: string | null;
    reasonCode?: string | null;
    reasonDetail?: string | null;
    provider?: string | null;
    providerMessageId?: string | null;
  }): Promise<void>;
  prepare(profile: ProfileWithRelations): Promise<MonthlyImmigrationUpdatePrepared>;
  render(prepared: MonthlyImmigrationUpdatePrepared): Promise<{ subject: string; html: string; text: string }>;
  send(input: {
    to: string;
    subject: string;
    html: string;
    text: string;
    idempotencyKey: string;
  }): Promise<EmailProviderSendResult>;
  completeRun(recoveryRunId: string): Promise<NotificationRecoveryRunCompleteResult>;
  countRetryableRecipients(campaignId: string): Promise<number>;
};

export type FailedRecipientRecoveryResult = {
  outcome:
    | "completed"
    | "idempotent"
    | "legacy_campaign"
    | "no_retryable_failures"
    | "active_recovery_conflict"
    | "campaign_not_found"
    | "campaign_not_recoverable";
  recoveryRunId: string | null;
  campaignId: string;
  status: NotificationRecoveryRun["status"] | null;
  targetedCount: number;
  providerAcceptedCount: number;
  failedCount: number;
  skippedIneligibleCount: number;
  submissionUnknownCount: number;
  remainingRetryableFailureCount: number | null;
};

function safeErrorDetail(error: unknown): string | null {
  return error instanceof Error && error.message.trim() ? error.message.trim().slice(0, 300) : null;
}

function normalizedEligibilityReason(profile: ProfileWithRelations | null): string {
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

function isDefinitelyPreProviderFailure(result: EmailProviderSendResult): boolean {
  return result.errorCode === "NOTIFICATION_CONFIG_ERROR" || result.errorCode === "NOTIFICATION_INVALID_INPUT";
}

function resultFromRun(input: {
  outcome: FailedRecipientRecoveryResult["outcome"];
  campaignId: string;
  run?: NotificationRecoveryRun;
  remainingRetryableFailureCount?: number | null;
}): FailedRecipientRecoveryResult {
  const run = input.run;
  return {
    outcome: input.outcome,
    recoveryRunId: run?.id ?? null,
    campaignId: input.campaignId,
    status: run?.status ?? null,
    targetedCount: run?.attempted_recipient_count ?? 0,
    providerAcceptedCount: run?.provider_accepted_count ?? 0,
    failedCount: (run?.failed_before_provider_count ?? 0) + (run?.failed_provider_count ?? 0),
    skippedIneligibleCount: run?.skipped_ineligible_count ?? 0,
    submissionUnknownCount: run?.submission_unknown_count ?? 0,
    remainingRetryableFailureCount: input.remainingRetryableFailureCount ?? null,
  };
}

/** Processes one server-selected recipient only after the database atomically claims its retry attempt. */
export async function recoverFailedMonthlyUpdateRecipient(input: {
  recoveryRunId: string;
  campaignRecipient: NotificationCampaignRecipient;
  dependencies: Pick<
    FailedRecipientRecoveryDependencies,
    "claimAttempt" | "loadProfileWithRelations" | "finalizeAttempt" | "prepare" | "render" | "send"
  >;
}): Promise<FailedRecipientRecoveryTerminalOutcome> {
  const tier = input.campaignRecipient.original_tier;
  if (tier !== "pro" && tier !== "power") {
    return "not_claimed";
  }

  const claim = await input.dependencies.claimAttempt({
    recoveryRunId: input.recoveryRunId,
    campaignRecipientId: input.campaignRecipient.id,
    provider: "resend",
    tierAtAttempt: tier,
  });
  if (claim.outcome !== "claimed" || !claim.attempt) {
    return "not_claimed";
  }

  const attempt: NotificationDeliveryAttempt = claim.attempt;
  let current: ProfileWithRelations | null;
  try {
    current = await input.dependencies.loadProfileWithRelations(input.campaignRecipient.profile_id);
  } catch (error) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "failed_before_provider",
      failureStage: "profile_reload",
      reasonCode: "profile_reload_failed",
      reasonDetail: safeErrorDetail(error),
    });
    return "failed_before_provider";
  }

  if (!current || evaluateMonthlyUpdateSummaryEligibility(current).kind === "skip") {
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

  let providerResult: EmailProviderSendResult;
  try {
    providerResult = await input.dependencies.send({
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

  if (providerResult.success) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "provider_accepted",
      provider: providerResult.provider,
      providerMessageId: providerResult.providerMessageId,
    });
    return "provider_accepted";
  }
  if (providerResult.submissionUncertain) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "submission_unknown",
      failureStage: "provider_submission",
      reasonCode: "provider_timeout_or_unknown",
      reasonDetail: providerResult.errorMessage ?? null,
      provider: providerResult.provider,
    });
    return "submission_unknown";
  }
  if (isDefinitelyPreProviderFailure(providerResult)) {
    await input.dependencies.finalizeAttempt({
      deliveryAttemptId: attempt.id,
      outcome: "failed_before_provider",
      failureStage: "notification",
      reasonCode:
        providerResult.errorCode === "NOTIFICATION_INVALID_INPUT"
          ? "notification_invalid_input"
          : "notification_config_error",
      reasonDetail: providerResult.errorMessage ?? null,
      provider: providerResult.provider,
    });
    return "failed_before_provider";
  }

  await input.dependencies.finalizeAttempt({
    deliveryAttemptId: attempt.id,
    outcome: "failed_provider",
    failureStage: "provider",
    reasonCode: "provider_rejected",
    reasonDetail: providerResult.errorMessage ?? null,
    provider: providerResult.provider,
  });
  return "failed_provider";
}

/** Manual recovery orchestration. Recipient selection and outcome evidence are entirely server/database owned. */
export async function recoverFailedMonthlyUpdateRecipients(input: {
  campaignId: string;
  idempotencyKey: string;
  actorProfileId: string | null;
  actorClerkUserId: string;
  actorEmail: string;
  dependencies: FailedRecipientRecoveryDependencies;
}): Promise<FailedRecipientRecoveryResult> {
  const runClaim = await input.dependencies.createOrClaimRun({
    campaignId: input.campaignId,
    idempotencyKey: input.idempotencyKey,
    actorProfileId: input.actorProfileId,
    actorClerkUserId: input.actorClerkUserId,
    actorEmail: input.actorEmail,
  });

  if (runClaim.outcome === "idempotent") {
    return resultFromRun({ outcome: "idempotent", campaignId: input.campaignId, run: runClaim.recovery_run });
  }
  if (runClaim.outcome === "legacy_campaign") {
    return resultFromRun({ outcome: "legacy_campaign", campaignId: input.campaignId });
  }
  if (runClaim.outcome === "no_retryable_recipients") {
    return resultFromRun({ outcome: "no_retryable_failures", campaignId: input.campaignId, remainingRetryableFailureCount: 0 });
  }
  if (runClaim.outcome === "active_recovery_exists") {
    return resultFromRun({ outcome: "active_recovery_conflict", campaignId: input.campaignId, run: runClaim.recovery_run });
  }
  if (runClaim.outcome === "campaign_not_found") {
    return resultFromRun({ outcome: "campaign_not_found", campaignId: input.campaignId });
  }
  if (runClaim.outcome === "campaign_not_recoverable") {
    return resultFromRun({ outcome: "campaign_not_recoverable", campaignId: input.campaignId });
  }
  if (runClaim.outcome !== "claimed" || !runClaim.recovery_run) {
    throw new Error("Notification recovery run claim did not return a usable recovery run.");
  }

  const candidates = await input.dependencies.listRetryableRecipients(input.campaignId);
  for (const campaignRecipient of candidates) {
    await recoverFailedMonthlyUpdateRecipient({
      recoveryRunId: runClaim.recovery_run.id,
      campaignRecipient,
      dependencies: input.dependencies,
    });
  }

  const completion = await input.dependencies.completeRun(runClaim.recovery_run.id);
  if ((completion.outcome !== "completed" && completion.outcome !== "already_completed") || !completion.recovery_run) {
    throw new Error("Notification recovery run could not be completed from persisted attempt evidence.");
  }
  const remainingRetryableFailureCount = await input.dependencies.countRetryableRecipients(input.campaignId);
  return resultFromRun({
    outcome: "completed",
    campaignId: input.campaignId,
    run: completion.recovery_run,
    remainingRetryableFailureCount,
  });
}
