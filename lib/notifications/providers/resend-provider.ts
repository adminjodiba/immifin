/**
 * Resend email provider adapter.
 * Only this module may import the Resend SDK or call the Resend API.
 */

import { Resend } from "resend";

import { getNotificationConfig } from "../core/notification-config";
import {
  NOTIFICATION_ERROR_CODES,
  NotificationError,
} from "../core/notification-errors";
import { NOTIFICATION_PROVIDERS } from "../types/provider-types";
import type {
  EmailProvider,
  EmailProviderSendRequest,
  EmailProviderSendResult,
} from "./email-provider";

function toAddressList(
  value: string | readonly string[] | undefined
): string | string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "string" ? value : [...value];
}

function safeProviderErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 200);
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message.trim();
    if (message) {
      return message.slice(0, 200);
    }
  }
  return "Email provider request failed";
}

function failureResult(
  errorCode: (typeof NOTIFICATION_ERROR_CODES)[keyof typeof NOTIFICATION_ERROR_CODES],
  errorMessage: string
): EmailProviderSendResult {
  return {
    success: false,
    provider: NOTIFICATION_PROVIDERS.RESEND,
    providerMessageId: null,
    errorCode,
    errorMessage,
  };
}

/**
 * Thin Resend transport implementing the provider-neutral EmailProvider contract.
 * Does not send email unless `send()` is explicitly invoked by the Notification Service.
 */
export class ResendEmailProvider implements EmailProvider {
  private client: Resend | null = null;
  private readonly apiKeyOverride: string | undefined;

  constructor(apiKey?: string) {
    this.apiKeyOverride = apiKey?.trim() || undefined;
  }

  /**
   * API key is Resend-specific and intentionally excluded from NotificationConfig
   * (see S6-EMAIL-001A.5). Resolved here only — never logged or returned.
   * Active provider selection still comes from getNotificationConfig().
   */
  private resolveApiKey(): string {
    const config = getNotificationConfig();
    if (config.activeEmailProvider !== NOTIFICATION_PROVIDERS.RESEND) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_PROVIDER_UNAVAILABLE,
        "Active email provider is not Resend"
      );
    }

    const apiKey =
      this.apiKeyOverride || process.env.RESEND_API_KEY?.trim() || "";
    if (!apiKey) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_CONFIG_ERROR,
        "Resend API key is not configured"
      );
    }

    return apiKey;
  }

  private getClient(): Resend {
    if (!this.client) {
      this.client = new Resend(this.resolveApiKey());
    }
    return this.client;
  }

  async send(
    request: EmailProviderSendRequest
  ): Promise<EmailProviderSendResult> {
    if (!request.from?.trim() || !request.subject?.trim()) {
      return failureResult(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_INVALID_INPUT,
        "Email from and subject are required"
      );
    }

    const to = toAddressList(request.to);
    if (
      to === undefined ||
      (typeof to === "string" ? !to.trim() : to.length === 0)
    ) {
      return failureResult(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_INVALID_INPUT,
        "Email recipient is required"
      );
    }

    let client: Resend;
    try {
      client = this.getClient();
    } catch (error) {
      if (error instanceof NotificationError) {
        return failureResult(error.code, error.message);
      }
      return failureResult(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_CONFIG_ERROR,
        "Email provider configuration failed"
      );
    }

    try {
      const { data, error } = await client.emails.send({
        from: request.from,
        to,
        replyTo: toAddressList(request.replyTo),
        subject: request.subject,
        html: request.html,
        text: request.text,
        tags: request.tags ? [...request.tags] : undefined,
        attachments: request.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        })),
      });

      if (error) {
        return failureResult(
          NOTIFICATION_ERROR_CODES.NOTIFICATION_PROVIDER_ERROR,
          safeProviderErrorMessage(error)
        );
      }

      return {
        success: true,
        provider: NOTIFICATION_PROVIDERS.RESEND,
        providerMessageId: data?.id ?? null,
      };
    } catch {
      return failureResult(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_PROVIDER_ERROR,
        "Email provider request failed"
      );
    }
  }
}
