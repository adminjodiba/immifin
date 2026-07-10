/**
 * Provider-independent Notification Service — orchestration entry point.
 * Resolves delivery through an injected registry; never imports provider SDKs.
 */

import {
  getNotificationConfig,
  type NotificationConfig,
} from "./notification-config";
import {
  NOTIFICATION_ERROR_CODES,
  NotificationError,
} from "./notification-errors";
import {
  NOTIFICATION_CHANNELS,
  type NotificationChannel,
} from "../types/notification-types";
import type { NotificationProvider } from "../types/provider-types";
import type {
  EmailProvider,
  EmailProviderSendRequest,
  EmailProviderSendResult,
} from "../providers/email-provider";

/**
 * Registry contract used for DI.
 * Implemented by `notification-registry` (composition root); not instantiated here.
 */
export type NotificationProviderRegistry = {
  resolveEmailProvider(
    provider: NotificationProvider
  ): EmailProvider | null | undefined;
};

/** Normalized email notification request accepted by the Notification Service. */
export type EmailNotificationRequest = {
  to: string | readonly string[];
  subject: string;
  html?: string;
  text?: string;
  /** Explicit From override (e.g. `Name <email@domain>`). */
  from?: string;
  /** Explicit Reply-To override; omit to use config default. */
  replyTo?: string | readonly string[];
  tags?: EmailProviderSendRequest["tags"];
  /** Only `email` is supported in this phase. Defaults to email. */
  channel?: NotificationChannel;
};

function hasRecipient(to: string | readonly string[]): boolean {
  if (typeof to === "string") {
    return to.trim().length > 0;
  }
  return to.some((address) => address.trim().length > 0);
}

function formatDefaultFrom(config: NotificationConfig): string {
  const name = config.defaultFromName.trim();
  const email = config.defaultFromEmail.trim();
  if (name) {
    return `${name} <${email}>`;
  }
  return email;
}

export class NotificationService {
  constructor(
    private readonly registry: NotificationProviderRegistry,
    private readonly readConfig: () => NotificationConfig = getNotificationConfig
  ) {}

  /**
   * Orchestrate a single email send through the configured EmailProvider.
   * Throws NotificationError for invalid input, unsupported channel, or missing provider.
   */
  async sendEmail(
    request: EmailNotificationRequest
  ): Promise<EmailProviderSendResult> {
    const channel = request.channel ?? NOTIFICATION_CHANNELS.EMAIL;
    if (channel !== NOTIFICATION_CHANNELS.EMAIL) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_UNSUPPORTED_CHANNEL,
        "Only the email channel is supported"
      );
    }

    if (!hasRecipient(request.to)) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_INVALID_INPUT,
        "Email recipient is required"
      );
    }

    if (!request.subject?.trim()) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_INVALID_INPUT,
        "Email subject is required"
      );
    }

    const html = request.html?.trim() ?? "";
    const text = request.text?.trim() ?? "";
    if (!html && !text) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_INVALID_INPUT,
        "Email content requires HTML or plain text"
      );
    }

    const config = this.readConfig();
    const from = request.from?.trim() || formatDefaultFrom(config);
    const replyTo =
      request.replyTo !== undefined
        ? request.replyTo
        : config.defaultReplyToEmail;

    const provider = this.registry.resolveEmailProvider(
      config.activeEmailProvider
    );
    if (!provider) {
      throw new NotificationError(
        NOTIFICATION_ERROR_CODES.NOTIFICATION_PROVIDER_UNAVAILABLE,
        "Configured email provider is unavailable"
      );
    }

    const providerRequest: EmailProviderSendRequest = {
      from,
      to: request.to,
      replyTo,
      subject: request.subject.trim(),
      html,
      text,
      tags: request.tags,
    };

    return provider.send(providerRequest);
  }
}

export function createNotificationService(
  registry: NotificationProviderRegistry
): NotificationService {
  return new NotificationService(registry);
}
