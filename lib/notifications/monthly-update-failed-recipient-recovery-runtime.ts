import "server-only";

import { renderMonthlyImmigrationReportEmail } from "@/emails/templates/monthly-immigration-report-email";
import { prepareMonthlyImmigrationUpdateForUser } from "@/lib/notifications/build-monthly-immigration-report-dashboard-source";
import { createNotificationService } from "@/lib/notifications/core/notification-factory";
import {
  recoverFailedMonthlyUpdateRecipients,
  type FailedRecipientRecoveryResult,
} from "@/lib/notifications/monthly-update-failed-recipient-recovery";
import { mapMonthlyImmigrationReportEmailProps } from "@/lib/notifications/mappers/map-monthly-immigration-report-email";
import { finalizeNotificationDeliveryAttempt } from "@/lib/notifications/notification-delivery-attempts";
import {
  claimNotificationRecoveryRecipientAttempt,
  completeNotificationRecoveryRun,
  countRetryableNotificationCampaignRecipients,
  createOrClaimNotificationRecoveryRun,
  listRetryableNotificationCampaignRecipients,
} from "@/lib/notifications/notification-recovery-runs";
import { getProfileWithRelationsById } from "@/lib/supabase/profiles";

/** Production composition root. The recovery orchestration itself remains fake-testable. */
export async function recoverFailedMonthlyUpdateRecipientsForAdmin(input: {
  campaignId: string;
  idempotencyKey: string;
  actorProfileId: string | null;
  actorClerkUserId: string;
  actorEmail: string;
}): Promise<FailedRecipientRecoveryResult> {
  return recoverFailedMonthlyUpdateRecipients({
    ...input,
    dependencies: {
      createOrClaimRun: createOrClaimNotificationRecoveryRun,
      listRetryableRecipients: listRetryableNotificationCampaignRecipients,
      claimAttempt: claimNotificationRecoveryRecipientAttempt,
      loadProfileWithRelations: getProfileWithRelationsById,
      finalizeAttempt: finalizeNotificationDeliveryAttempt,
      prepare: prepareMonthlyImmigrationUpdateForUser,
      render: async (prepared) =>
        renderMonthlyImmigrationReportEmail(mapMonthlyImmigrationReportEmailProps(prepared.source)),
      send: ({ to, subject, html, text, idempotencyKey }) =>
        createNotificationService().sendEmail({
          to,
          subject,
          html,
          text,
          idempotencyKey,
          tags: [
            { name: "template", value: "monthly-immigration-report" },
            { name: "send_mode", value: "failed_recipient_recovery" },
            { name: "campaign_id", value: input.campaignId },
          ],
        }),
      completeRun: completeNotificationRecoveryRun,
      countRetryableRecipients: countRetryableNotificationCampaignRecipients,
    },
  });
}