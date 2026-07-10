/**
 * Notification provider identifiers for the IMMIFIN Notification Platform.
 * Provider keys only — no adapters, SDKs, or send logic.
 * Sprint 6 implements Resend; other providers are future placeholders.
 */

export const NOTIFICATION_PROVIDERS = {
  RESEND: "resend",
  TWILIO: "twilio",
  AMAZON_SES: "amazon_ses",
  SENDGRID: "sendgrid",
  POSTMARK: "postmark",
} as const;

export type NotificationProvider =
  (typeof NOTIFICATION_PROVIDERS)[keyof typeof NOTIFICATION_PROVIDERS];
