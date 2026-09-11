/**
 * IMMIFIN Intelligence Request Envelope public exports (S8-IIP-002).
 *
 * Safe barrel: types, constants, pure assembly, validation.
 * Import the server preparer from:
 *   `@/lib/intelligence/request/prepare-intelligence-request`
 * Do not import the preparer from Client Components.
 */

export { assembleIntelligenceRequest } from "@/lib/intelligence/request/assemble-intelligence-request";
export {
  INTELLIGENCE_QUESTION_MAX_LENGTH,
  INTELLIGENCE_REQUEST_ERROR,
  INTELLIGENCE_REQUEST_VERSION,
} from "@/lib/intelligence/request/intelligence-request.constants";
export {
  IntelligenceRequestError,
  isIntelligenceRequestError,
  type IntelligenceRequest,
  type IntelligenceRequestErrorCode,
  type IntelligenceRequestInput,
  type IntelligenceRequestReadiness,
  type IntelligenceRequestReadinessStatus,
  type IntelligenceRequestSources,
} from "@/lib/intelligence/request/intelligence-request.types";
export {
  deriveIntelligenceRequestReadiness,
  validateIntelligenceQuestion,
  validateIntelligenceRequest,
} from "@/lib/intelligence/request/intelligence-request.validation";
