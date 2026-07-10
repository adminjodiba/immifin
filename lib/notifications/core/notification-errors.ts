/**
 * Typed errors for the IMMIFIN Notification Platform.
 * Safe messages only — never attach secrets, headers, full bodies, or raw provider payloads.
 */

export const NOTIFICATION_ERROR_CODES = {
  NOTIFICATION_CONFIG_ERROR: "NOTIFICATION_CONFIG_ERROR",
  NOTIFICATION_PROVIDER_UNAVAILABLE: "NOTIFICATION_PROVIDER_UNAVAILABLE",
  NOTIFICATION_PROVIDER_ERROR: "NOTIFICATION_PROVIDER_ERROR",
  NOTIFICATION_UNSUPPORTED_CHANNEL: "NOTIFICATION_UNSUPPORTED_CHANNEL",
  NOTIFICATION_INVALID_INPUT: "NOTIFICATION_INVALID_INPUT",
} as const;

export type NotificationErrorCode =
  (typeof NOTIFICATION_ERROR_CODES)[keyof typeof NOTIFICATION_ERROR_CODES];

type NotificationErrorOptions = {
  cause?: unknown;
};

/**
 * Domain error for notification configuration, validation, and provider failures.
 * Follows the project’s lightweight Error-subclass pattern (see AuthError).
 */
export class NotificationError extends Error {
  readonly code: NotificationErrorCode;
  readonly cause?: unknown;

  constructor(
    code: NotificationErrorCode,
    message: string,
    options?: NotificationErrorOptions
  ) {
    super(message);
    this.name = "NotificationError";
    this.code = code;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function isNotificationError(error: unknown): error is NotificationError {
  return error instanceof NotificationError;
}
