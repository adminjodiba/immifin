/**
 * IMMIFIN Intelligence Request Envelope — question and contract validation.
 *
 * Deterministic only. Does not rewrite, classify, or interpret questions.
 * Does not log rejected question text.
 */

import type { IntelligenceContext } from "@/lib/intelligence/context/intelligence-context.types";
import { isUtcIso8601Timestamp } from "@/lib/intelligence/context/intelligence-context.validation";
import {
  INTELLIGENCE_QUESTION_MAX_LENGTH,
  INTELLIGENCE_REQUEST_ERROR,
  INTELLIGENCE_REQUEST_VERSION,
} from "@/lib/intelligence/request/intelligence-request.constants";
import type {
  IntelligenceRequest,
  IntelligenceRequestReadiness,
  IntelligenceRequestReadinessStatus,
} from "@/lib/intelligence/request/intelligence-request.types";
import { IntelligenceRequestError } from "@/lib/intelligence/request/intelligence-request.types";

const READINESS_STATUSES: readonly IntelligenceRequestReadinessStatus[] = [
  "ready",
  "needs_profile_information",
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Intelligence Request validation failed: ${message}`);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown, path: string): asserts value is string[] {
  assert(Array.isArray(value), `${path} must be an array`);
  assert(
    value.every((entry) => typeof entry === "string"),
    `${path} must contain only strings`,
  );
}

/**
 * Validate and normalize a user question.
 * Trims outer whitespace only — does not rewrite wording.
 */
export function validateIntelligenceQuestion(question: unknown): string {
  if (typeof question !== "string") {
    throw new IntelligenceRequestError(
      INTELLIGENCE_REQUEST_ERROR.QUESTION_INVALID_TYPE,
      "Intelligence question must be a string.",
    );
  }

  const trimmed = question.trim();

  if (!trimmed) {
    throw new IntelligenceRequestError(
      INTELLIGENCE_REQUEST_ERROR.QUESTION_EMPTY,
      "Intelligence question must not be empty.",
    );
  }

  if (trimmed.length > INTELLIGENCE_QUESTION_MAX_LENGTH) {
    throw new IntelligenceRequestError(
      INTELLIGENCE_REQUEST_ERROR.QUESTION_TOO_LONG,
      `Intelligence question must be at most ${INTELLIGENCE_QUESTION_MAX_LENGTH} characters.`,
    );
  }

  return trimmed;
}

/**
 * Derive request readiness from Intelligence Context readiness.
 * Does not create a second profile-completeness authority.
 */
export function deriveIntelligenceRequestReadiness(
  context: IntelligenceContext,
): IntelligenceRequestReadiness {
  if (context.readiness.usable) {
    return {
      status: "ready",
      blockingReasons: [],
      warnings: [...context.readiness.warnings],
    };
  }

  return {
    status: "needs_profile_information",
    blockingReasons: [...context.readiness.missingRequiredFields],
    warnings: [...context.readiness.warnings],
  };
}

/**
 * Validates the assembled request envelope contract shape.
 */
export function validateIntelligenceRequest(
  request: IntelligenceRequest,
): IntelligenceRequestReadiness {
  assert(isPlainObject(request), "request must be an object");
  assert(
    request.requestVersion === INTELLIGENCE_REQUEST_VERSION,
    `requestVersion must be ${INTELLIGENCE_REQUEST_VERSION}`,
  );
  assert(typeof request.requestId === "string" && request.requestId.length > 0, "requestId required");
  assert(typeof request.createdAt === "string", "createdAt must be a string");
  assert(
    isUtcIso8601Timestamp(request.createdAt),
    "createdAt must be a valid UTC ISO-8601 timestamp",
  );

  assert(isPlainObject(request.input), "input must be an object");
  assert(typeof request.input.question === "string", "input.question must be a string");
  assert(request.input.question.length > 0, "input.question must not be empty");
  assert(
    request.input.question.length <= INTELLIGENCE_QUESTION_MAX_LENGTH,
    "input.question exceeds maximum length",
  );
  assert(
    request.input.question === request.input.question.trim(),
    "input.question must already be trimmed",
  );

  assert(isPlainObject(request.context), "context must be an object");
  assert(
    typeof request.context.contextVersion === "string",
    "context.contextVersion must be a string",
  );
  assert(isPlainObject(request.context.readiness), "context.readiness must be an object");

  assert(isPlainObject(request.readiness), "readiness must be an object");
  assert(
    READINESS_STATUSES.includes(request.readiness.status),
    "readiness.status is invalid",
  );
  assertStringArray(request.readiness.blockingReasons, "readiness.blockingReasons");
  assertStringArray(request.readiness.warnings, "readiness.warnings");

  if (request.context.readiness.usable) {
    assert(request.readiness.status === "ready", "usable context must yield ready request");
    assert(
      request.readiness.blockingReasons.length === 0,
      "ready request must not include blocking reasons",
    );
  } else {
    assert(
      request.readiness.status === "needs_profile_information",
      "incomplete context must yield needs_profile_information",
    );
    assert(
      request.readiness.blockingReasons.length > 0,
      "needs_profile_information must include blocking reasons",
    );
  }

  const prohibitedKeys = [
    "email",
    "phone",
    "phone_number",
    "stripe_customer_id",
    "stripe_subscription_id",
    "clerk_user_id",
    "sessionToken",
    "privateMetadata",
    "supabase",
  ] as const;

  for (const key of prohibitedKeys) {
    assert(!(key in request), `prohibited field present: ${key}`);
  }

  return request.readiness;
}
