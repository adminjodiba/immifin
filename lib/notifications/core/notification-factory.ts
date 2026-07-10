/**
 * Server-only composition root for the Notification Platform.
 * Sole place that instantiates provider adapters and wires them into NotificationService.
 *
 * Note: `notification-registry.ts` is not yet implemented. This factory builds an
 * immutable per-call registry satisfying `NotificationProviderRegistry` until that
 * module lands — without introducing global mutable provider state.
 */

import { getNotificationConfig } from "./notification-config";
import {
  NOTIFICATION_ERROR_CODES,
  NotificationError,
} from "./notification-errors";
import {
  createNotificationService as createNotificationServiceWithRegistry,
  type NotificationProviderRegistry,
  type NotificationService,
} from "./notification-service";
import { ResendEmailProvider } from "../providers/resend-provider";
import type { EmailProvider } from "../providers/email-provider";
import {
  NOTIFICATION_PROVIDERS,
  type NotificationProvider,
} from "../types/provider-types";

function createImmutableEmailRegistry(
  providers: ReadonlyMap<NotificationProvider, EmailProvider>
): NotificationProviderRegistry {
  return {
    resolveEmailProvider(provider) {
      return providers.get(provider) ?? null;
    },
  };
}

/**
 * Assemble Resend → registry → NotificationService for the active email provider.
 * Creates fresh instances per call (request-safe; no shared mutable registry).
 */
export function createNotificationService(): NotificationService {
  const config = getNotificationConfig();

  if (config.activeEmailProvider !== NOTIFICATION_PROVIDERS.RESEND) {
    throw new NotificationError(
      NOTIFICATION_ERROR_CODES.NOTIFICATION_PROVIDER_UNAVAILABLE,
      "Configured email provider is not supported"
    );
  }

  const resendProvider = new ResendEmailProvider();
  const providers = new Map<NotificationProvider, EmailProvider>([
    [NOTIFICATION_PROVIDERS.RESEND, resendProvider],
  ]);
  const registry = createImmutableEmailRegistry(providers);

  return createNotificationServiceWithRegistry(registry);
}
