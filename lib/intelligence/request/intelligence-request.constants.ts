/**
 * IMMIFIN Intelligence Request Envelope — version and validation constants.
 * Keep version / limits centralized; do not duplicate across files.
 */

/** Intelligence Request Envelope contract version (S8-IIP-002). */
export const INTELLIGENCE_REQUEST_VERSION = "1.0.0";

/** Maximum allowed question length after trimming (characters). */
export const INTELLIGENCE_QUESTION_MAX_LENGTH = 2000;

/** Structured question-validation error codes. */
export const INTELLIGENCE_REQUEST_ERROR = {
  QUESTION_INVALID_TYPE: "INTELLIGENCE_REQUEST_QUESTION_INVALID_TYPE",
  QUESTION_EMPTY: "INTELLIGENCE_REQUEST_QUESTION_EMPTY",
  QUESTION_TOO_LONG: "INTELLIGENCE_REQUEST_QUESTION_TOO_LONG",
} as const;
