/**
 * Centralized Notification Platform configuration (server-only).
 * Identity and provider selection — never includes API keys or other secrets.
 */

import {
  NOTIFICATION_PROVIDERS,
  type NotificationProvider,
} from "../types/provider-types";

export type NotificationConfig = {
  brandName: string;
  defaultFromName: string;
  defaultFromEmail: string;
  defaultReplyToEmail: string;
  activeEmailProvider: NotificationProvider;
};

const DEFAULT_BRAND_NAME = "IMMIFIN";
const DEFAULT_FROM_NAME = "IMMIFIN";
const DEFAULT_FROM_EMAIL = "updates@notifications.immifin.com";
const DEFAULT_REPLY_TO_EMAIL = "support@immifin.com";

/**
 * Reads Phase 1 sender identity from existing RESEND_* env vars.
 * Does not load or return RESEND_API_KEY / RESEND_WEBHOOK_SECRET.
 */
export function getNotificationConfig(): NotificationConfig {
  return {
    brandName: DEFAULT_BRAND_NAME,
    defaultFromName:
      process.env.RESEND_FROM_NAME?.trim() || DEFAULT_FROM_NAME,
    defaultFromEmail:
      process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL,
    defaultReplyToEmail:
      process.env.RESEND_REPLY_TO?.trim() || DEFAULT_REPLY_TO_EMAIL,
    activeEmailProvider: NOTIFICATION_PROVIDERS.RESEND,
  };
}
