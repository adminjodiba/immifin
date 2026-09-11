/**
 * Map Intelligence API error envelopes to safe client UI categories (S8-IIP-009).
 * Does not log question/answer content.
 */

import type {
  IntelligenceAskClientError,
  IntelligenceAskClientErrorKind,
} from "@/lib/intelligence/client/intelligence-ask.types";

const MESSAGES: Record<IntelligenceAskClientErrorKind, string> = {
  unauthenticated: "Your session has expired. Sign in again to continue.",
  capability_required: "IMMIFIN Intelligence is available on the Power plan.",
  beta_not_eligible:
    "IMMIFIN Intelligence is currently available only to invited Power members.",
  validation: "Please check your question and try again.",
  rate_limited: "Too many requests. Please wait a moment and try again.",
  profile_required: "Complete a few profile details before asking again.",
  unavailable: "Intelligence is temporarily unavailable. Please try again later.",
  timeout: "The request timed out. Please try again.",
  not_configured: "Intelligence is not available in this environment right now.",
  generic: "Something went wrong. Please try again.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mapIntelligenceAskHttpError(
  status: number,
  body: unknown,
): IntelligenceAskClientError {
  const errorObj = isRecord(body) && isRecord(body.error) ? body.error : null;
  const code = typeof errorObj?.code === "string" ? errorObj.code : undefined;
  const requestId =
    typeof errorObj?.requestId === "string" ? errorObj.requestId : undefined;

  let errorKind: IntelligenceAskClientErrorKind = "generic";

  if (status === 401 || code === "INTELLIGENCE_API_UNAUTHENTICATED") {
    errorKind = "unauthenticated";
  } else if (code === "INTELLIGENCE_BETA_NOT_ELIGIBLE") {
    errorKind = "beta_not_eligible";
  } else if (status === 403 || code === "AI_CAPABILITY_REQUIRED") {
    errorKind = "capability_required";
  } else if (
    status === 400 ||
    status === 413 ||
    code === "INTELLIGENCE_API_INVALID_REQUEST" ||
    code === "INTELLIGENCE_API_INVALID_JSON" ||
    code === "INTELLIGENCE_API_INVALID_CONTENT_TYPE" ||
    code === "INTELLIGENCE_API_BODY_TOO_LARGE"
  ) {
    errorKind = "validation";
  } else if (
    status === 429 ||
    code === "INTELLIGENCE_ABUSE_LIMIT_EXCEEDED" ||
    code === "INTELLIGENCE_PROVIDER_RATE_LIMITED"
  ) {
    errorKind = "rate_limited";
  } else if (status === 422) {
    errorKind = "profile_required";
  } else if (status === 504 || code === "INTELLIGENCE_PROVIDER_TIMEOUT") {
    errorKind = "timeout";
  } else if (code === "INTELLIGENCE_PROVIDER_NOT_CONFIGURED") {
    errorKind = "not_configured";
  } else if (
    status === 503 ||
    status === 502 ||
    code === "INTELLIGENCE_PROVIDER_UNAVAILABLE" ||
    code === "INTELLIGENCE_PROVIDER_NOT_FOUND" ||
    code === "INTELLIGENCE_PROVIDER_FAILURE" ||
    code === "INTELLIGENCE_PROVIDER_AUTHENTICATION_FAILED" ||
    code === "INTELLIGENCE_EXECUTION_DISABLED"
  ) {
    errorKind = "unavailable";
  }

  return {
    kind: "error",
    errorKind,
    message: MESSAGES[errorKind],
    requestId,
    code,
  };
}

export function mapIntelligenceAskNetworkError(): IntelligenceAskClientError {
  return {
    kind: "error",
    errorKind: "unavailable",
    message: MESSAGES.unavailable,
  };
}
