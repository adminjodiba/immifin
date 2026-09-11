/**
 * Intelligence API public exports (S8-IIP-008).
 *
 * Safe for verify scripts. Application routes should import the handler and
 * wire `executeIntelligenceRequest` from `@/lib/intelligence/service/server`.
 */

export {
  INTELLIGENCE_API_CACHE_CONTROL,
  INTELLIGENCE_API_MAX_BODY_BYTES,
  INTELLIGENCE_API_QUESTION_MAX_LENGTH,
  INTELLIGENCE_ASK_ROUTE,
} from "@/lib/intelligence/api/intelligence-api.constants";
export {
  createAllowAllIntelligenceAbuseControl,
  createDenyingIntelligenceAbuseControl,
  type IntelligenceAbuseControl,
  type IntelligenceAbuseControlDecision,
  type IntelligenceAbuseControlInput,
} from "@/lib/intelligence/api/intelligence-api.abuse";
export {
  INTELLIGENCE_API_ERROR,
  IntelligenceApiError,
  isIntelligenceApiError,
  type IntelligenceApiErrorCode,
} from "@/lib/intelligence/api/intelligence-api.errors";
export {
  intelligenceAskErrorResponse,
  intelligenceAskServiceResultResponse,
} from "@/lib/intelligence/api/intelligence-api.http";
export {
  assertIntelligenceAskOrigin,
  getIntelligenceApiAllowedOrigins,
} from "@/lib/intelligence/api/intelligence-api.origin";
export type {
  IntelligenceAskApiRequest,
  IntelligenceAskCompletedResponse,
  IntelligenceAskErrorBody,
  IntelligenceAskHandlerDependencies,
  IntelligenceAskNeedsProfileResponse,
  IntelligenceAskSuccessBody,
} from "@/lib/intelligence/api/intelligence-api.types";
export {
  assertIntelligenceAskContentType,
  readIntelligenceAskJsonBody,
  validateIntelligenceAskRequest,
} from "@/lib/intelligence/api/intelligence-api.validation";
export {
  createDefaultIntelligenceAskHandlerDependencies,
  handleIntelligenceAsk,
} from "@/lib/intelligence/api/handle-intelligence-ask";
export {
  INTELLIGENCE_ENABLED_ENV,
  isIntelligenceExecutionEnabled,
} from "@/lib/intelligence/api/intelligence-execution-gate";
