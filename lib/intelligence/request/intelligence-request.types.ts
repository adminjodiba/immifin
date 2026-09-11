/**
 * IMMIFIN Intelligence Request Envelope — Version 1 contract types.
 *
 * Stable input contract for future Immigration Intelligence Engine operations.
 * No AI decisions, prompts, persistence, or provider calls.
 */

import type { IntelligenceContext } from "@/lib/intelligence/context/intelligence-context.types";
import type { INTELLIGENCE_REQUEST_ERROR } from "@/lib/intelligence/request/intelligence-request.constants";

export type IntelligenceRequestReadinessStatus =
  | "ready"
  | "needs_profile_information";

export type IntelligenceRequestInput = {
  /** Original validated question (trimmed outer whitespace only). */
  question: string;
};

export type IntelligenceRequestReadiness = {
  status: IntelligenceRequestReadinessStatus;
  /** Blocking reasons derived from Intelligence Context missing required fields. */
  blockingReasons: string[];
  /** Non-blocking warnings carried forward from Intelligence Context. */
  warnings: string[];
};

/**
 * Version 1 Intelligence Request Envelope.
 * Consumes the approved Intelligence Context type without remapping its fields.
 */
export type IntelligenceRequest = {
  requestVersion: string;
  /** Diagnostic metadata only — crypto.randomUUID(); not persisted. */
  requestId: string;
  /** UTC ISO-8601 timestamp. */
  createdAt: string;
  input: IntelligenceRequestInput;
  context: IntelligenceContext;
  readiness: IntelligenceRequestReadiness;
};

/** Pure assembly inputs for tests / composition. */
export type IntelligenceRequestSources = {
  question: string;
  context: IntelligenceContext;
  /** Injectable for deterministic tests. */
  requestId?: string;
  /** Injectable for deterministic tests; defaults to `new Date().toISOString()`. */
  createdAt?: string;
};

export type IntelligenceRequestErrorCode =
  (typeof INTELLIGENCE_REQUEST_ERROR)[keyof typeof INTELLIGENCE_REQUEST_ERROR];

export class IntelligenceRequestError extends Error {
  readonly code: IntelligenceRequestErrorCode;

  constructor(code: IntelligenceRequestErrorCode, message: string) {
    super(message);
    this.name = "IntelligenceRequestError";
    this.code = code;
  }
}

export function isIntelligenceRequestError(
  error: unknown,
): error is IntelligenceRequestError {
  return error instanceof IntelligenceRequestError;
}
