/**
 * IMMIFIN Intelligence Provider — structured error contract (S8-IIP-004).
 *
 * Codes are for future adapter implementations. This module does not call providers.
 */

/** Structured provider error codes. */
export const INTELLIGENCE_PROVIDER_ERROR = {
  INVALID_REQUEST: "INTELLIGENCE_PROVIDER_INVALID_REQUEST",
  UNSUPPORTED_CAPABILITY: "INTELLIGENCE_PROVIDER_UNSUPPORTED_CAPABILITY",
  NOT_CONFIGURED: "INTELLIGENCE_PROVIDER_NOT_CONFIGURED",
  PROVIDER_FAILURE: "INTELLIGENCE_PROVIDER_FAILURE",
  TIMEOUT: "INTELLIGENCE_PROVIDER_TIMEOUT",
  /** Registry: provider object or identifier failed validation. */
  INVALID_REGISTRATION: "INTELLIGENCE_PROVIDER_INVALID_REGISTRATION",
  /** Registry: provider id already registered (no silent replace). */
  DUPLICATE_REGISTRATION: "INTELLIGENCE_PROVIDER_DUPLICATE_REGISTRATION",
  /** Registry / resolver: provider id is not registered. */
  NOT_FOUND: "INTELLIGENCE_PROVIDER_NOT_FOUND",
  /** Adapter: authentication rejected by the vendor. */
  AUTHENTICATION_FAILED: "INTELLIGENCE_PROVIDER_AUTHENTICATION_FAILED",
  /** Adapter: permission / authorization rejected by the vendor. */
  PERMISSION_DENIED: "INTELLIGENCE_PROVIDER_PERMISSION_DENIED",
  /** Adapter: vendor rate limit. */
  RATE_LIMITED: "INTELLIGENCE_PROVIDER_RATE_LIMITED",
  /** Adapter: network / connection failure. */
  CONNECTION_FAILED: "INTELLIGENCE_PROVIDER_CONNECTION_FAILED",
  /** Adapter: vendor unavailable or server error. */
  UNAVAILABLE: "INTELLIGENCE_PROVIDER_UNAVAILABLE",
  /** Adapter: model refused / safety-restricted content. */
  CONTENT_REFUSED: "INTELLIGENCE_PROVIDER_CONTENT_REFUSED",
  /** Adapter: completed response contained no usable text. */
  EMPTY_RESPONSE: "INTELLIGENCE_PROVIDER_EMPTY_RESPONSE",
} as const;

export type IntelligenceProviderErrorCode =
  (typeof INTELLIGENCE_PROVIDER_ERROR)[keyof typeof INTELLIGENCE_PROVIDER_ERROR];

export class IntelligenceProviderError extends Error {
  readonly code: IntelligenceProviderErrorCode;

  constructor(code: IntelligenceProviderErrorCode, message: string) {
    super(message);
    this.name = "IntelligenceProviderError";
    this.code = code;
  }
}

export function isIntelligenceProviderError(
  error: unknown,
): error is IntelligenceProviderError {
  return error instanceof IntelligenceProviderError;
}
