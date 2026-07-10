/**
 * Shared notification type definitions for the IMMIFIN Notification Platform.
 * Identifiers and channels only — no providers, templates, or send logic.
 */

export const NOTIFICATION_TYPES = {
  WELCOME_PRO: "WELCOME_PRO",
  WELCOME_POWER: "WELCOME_POWER",
  UPGRADE_PRO_TO_POWER: "UPGRADE_PRO_TO_POWER",
  DOWNGRADE_TO_FREE: "DOWNGRADE_TO_FREE",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
  MONTHLY_IMMIGRATION_REPORT: "MONTHLY_IMMIGRATION_REPORT",
  ADMIN_BULLETIN_REMINDER: "ADMIN_BULLETIN_REMINDER",
  SYSTEM_ALERT: "SYSTEM_ALERT",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_CHANNELS = {
  EMAIL: "email",
} as const;

export type NotificationChannel =
  (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];
