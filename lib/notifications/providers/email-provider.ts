/**
 * Provider-agnostic email send contract for the IMMIFIN Notification Platform.
 * Adapters implement this interface; business code must not call providers directly.
 */

import type { NotificationProvider } from "../types/provider-types";

/** Normalized outbound email payload accepted by any email provider adapter. */
export type EmailProviderSendRequest = {
  from: string;
  to: string | readonly string[];
  replyTo?: string | readonly string[];
  subject: string;
  html: string;
  text: string;
  tags?: ReadonlyArray<{
    name: string;
    value: string;
  }>;
  attachments?: ReadonlyArray<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
  /** Stable provider-specific duplicate-submission key for an immutable attempt. */
  idempotencyKey?: string;
};

/** Normalized result returned by every email provider adapter. */
export type EmailProviderSendResult = {
  success: boolean;
  provider: NotificationProvider;
  providerMessageId: string | null;
  errorCode?: string;
  errorMessage?: string;
  /** True only when the adapter cannot prove whether submission occurred. */
  submissionUncertain?: boolean;
};

/**
 * Contract every email provider adapter must implement.
 * Independent of any third-party SDK.
 */
export interface EmailProvider {
  send(request: EmailProviderSendRequest): Promise<EmailProviderSendResult>;
}
