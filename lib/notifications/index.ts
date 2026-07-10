/**
 * Public module boundary for the IMMIFIN Notification Platform.
 * Business code should import from `@/lib/notifications` (this file).
 *
 * Provider adapters (e.g. Resend), secrets, and composition roots stay internal.
 */

export {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  type NotificationType,
  type NotificationChannel,
} from "./types/notification-types";

export {
  NOTIFICATION_PROVIDERS,
  type NotificationProvider,
} from "./types/provider-types";

export type {
  EmailProvider,
  EmailProviderSendRequest,
  EmailProviderSendResult,
} from "./providers/email-provider";

export {
  NotificationService,
  type EmailNotificationRequest,
  type NotificationProviderRegistry,
} from "./core/notification-service";

export { createNotificationService } from "./core/notification-factory";

export {
  NOTIFICATION_ERROR_CODES,
  NotificationError,
  isNotificationError,
  type NotificationErrorCode,
} from "./core/notification-errors";

export {
  mapMonthlyImmigrationReportEmailProps,
  mapMonthlyHighlight,
  mapGreenCardMonthlyHighlight,
  mapGreenCardAdvisorSummary,
  mapGreenCardJourneyStatusLabel,
  mapMovementTypeToEmailStatus,
  type MonthlyImmigrationReportDashboardSource,
  type EmploymentMonthlyImmigrationReportDashboardSource,
  type GreenCardMonthlyImmigrationReportDashboardSource,
  type VisaBulletinMovementSnapshot,
} from "./mappers/map-monthly-immigration-report-email";

export {
  prepareMonthlyImmigrationUpdateForUser,
  findVisaBulletinMovementForProfile,
  isMonthlyUpdateAssemblyError,
  MonthlyUpdateAssemblyError,
  MONTHLY_UPDATE_ASSEMBLY_ERROR,
  type MonthlyImmigrationUpdatePreviewSummary,
  type MonthlyImmigrationUpdatePrepared,
} from "./build-monthly-immigration-report-dashboard-source";

export {
  buildMonthlyUpdateAudienceSummary,
  sendMonthlyImmigrationUpdatesBulk,
  MONTHLY_UPDATE_BATCH_SIZE,
  MONTHLY_UPDATE_BATCH_DELAY_MS,
  MONTHLY_UPDATE_MAX_SYNC_RECIPIENTS,
  type MonthlyUpdateAudienceSummary,
  type MonthlyUpdateBulkSendResult,
} from "./monthly-update-control-center";
