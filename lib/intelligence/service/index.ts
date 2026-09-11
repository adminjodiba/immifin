/**
 * Intelligence Service public exports (S8-IIP-007).
 *
 * Core orchestration is dependency-injected for tests.
 * Application server modules should prefer:
 *   `@/lib/intelligence/service/server`
 */

export { executeIntelligenceRequest } from "@/lib/intelligence/service/execute-intelligence-request";
export {
  INTELLIGENCE_SERVICE_ERROR,
  IntelligenceServiceError,
  isIntelligenceServiceError,
  type IntelligenceServiceErrorCode,
} from "@/lib/intelligence/service/intelligence-service.errors";
export type {
  ExecuteIntelligenceRequestInput,
  IntelligenceServiceCompletedResult,
  IntelligenceServiceDependencies,
  IntelligenceServiceNeedsProfileResult,
  IntelligenceServiceResult,
  IntelligenceServiceSafeProviderMetadata,
} from "@/lib/intelligence/service/intelligence-service.types";
export { validateExecuteIntelligenceRequestInput } from "@/lib/intelligence/service/intelligence-service.validation";
