/**
 * Authenticated Intelligence API structured errors (S8-IIP-008).
 */

export const INTELLIGENCE_API_ERROR = {
  INVALID_JSON: "INTELLIGENCE_API_INVALID_JSON",
  INVALID_CONTENT_TYPE: "INTELLIGENCE_API_INVALID_CONTENT_TYPE",
  BODY_TOO_LARGE: "INTELLIGENCE_API_BODY_TOO_LARGE",
  INVALID_REQUEST: "INTELLIGENCE_API_INVALID_REQUEST",
  UNAUTHENTICATED: "INTELLIGENCE_API_UNAUTHENTICATED",
  AI_CAPABILITY_REQUIRED: "AI_CAPABILITY_REQUIRED",
  /** Authenticated Power user is not invited to the controlled beta. */
  BETA_NOT_ELIGIBLE: "INTELLIGENCE_BETA_NOT_ELIGIBLE",
  ORIGIN_REJECTED: "INTELLIGENCE_API_ORIGIN_REJECTED",
  ABUSE_LIMIT_EXCEEDED: "INTELLIGENCE_ABUSE_LIMIT_EXCEEDED",
  /** Server kill switch disabled Intelligence execution. */
  EXECUTION_DISABLED: "INTELLIGENCE_EXECUTION_DISABLED",
  PROVIDER_NOT_FOUND: "INTELLIGENCE_PROVIDER_NOT_FOUND",
  PROVIDER_NOT_CONFIGURED: "INTELLIGENCE_PROVIDER_NOT_CONFIGURED",
  PROVIDER_AUTHENTICATION_FAILED: "INTELLIGENCE_PROVIDER_AUTHENTICATION_FAILED",
  PROVIDER_RATE_LIMITED: "INTELLIGENCE_PROVIDER_RATE_LIMITED",
  PROVIDER_TIMEOUT: "INTELLIGENCE_PROVIDER_TIMEOUT",
  PROVIDER_UNAVAILABLE: "INTELLIGENCE_PROVIDER_UNAVAILABLE",
  PROVIDER_FAILURE: "INTELLIGENCE_PROVIDER_FAILURE",
  INTERNAL_ERROR: "INTELLIGENCE_API_INTERNAL_ERROR",
} as const;

export type IntelligenceApiErrorCode =
  (typeof INTELLIGENCE_API_ERROR)[keyof typeof INTELLIGENCE_API_ERROR];

export class IntelligenceApiError extends Error {
  readonly code: IntelligenceApiErrorCode;
  readonly status: number;
  readonly requestId: string | undefined;

  constructor(
    code: IntelligenceApiErrorCode,
    message: string,
    status: number,
    requestId?: string,
  ) {
    super(message);
    this.name = "IntelligenceApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function isIntelligenceApiError(error: unknown): error is IntelligenceApiError {
  return error instanceof IntelligenceApiError;
}
