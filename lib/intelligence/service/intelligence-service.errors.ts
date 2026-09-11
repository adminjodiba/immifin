/**
 * Intelligence Service structured errors (S8-IIP-007).
 *
 * Operational provider/context/request errors from prior stories are preserved
 * and rethrown — not rewritten into generic results.
 */

export const INTELLIGENCE_SERVICE_ERROR = {
  INVALID_INPUT: "INTELLIGENCE_SERVICE_INVALID_INPUT",
} as const;

export type IntelligenceServiceErrorCode =
  (typeof INTELLIGENCE_SERVICE_ERROR)[keyof typeof INTELLIGENCE_SERVICE_ERROR];

export class IntelligenceServiceError extends Error {
  readonly code: IntelligenceServiceErrorCode;

  constructor(code: IntelligenceServiceErrorCode, message: string) {
    super(message);
    this.name = "IntelligenceServiceError";
    this.code = code;
  }
}

export function isIntelligenceServiceError(
  error: unknown,
): error is IntelligenceServiceError {
  return error instanceof IntelligenceServiceError;
}
