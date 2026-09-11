/**
 * Pure Intelligence Request Envelope assembly (no I/O, not server-gated).
 * Used by the server preparer and by deterministic verification scripts.
 */

import type { IntelligenceRequest } from "@/lib/intelligence/request/intelligence-request.types";
import type { IntelligenceRequestSources } from "@/lib/intelligence/request/intelligence-request.types";
import { INTELLIGENCE_REQUEST_VERSION } from "@/lib/intelligence/request/intelligence-request.constants";
import {
  deriveIntelligenceRequestReadiness,
  validateIntelligenceQuestion,
  validateIntelligenceRequest,
} from "@/lib/intelligence/request/intelligence-request.validation";

function createRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Pure / deterministic assembly from a validated question and Intelligence Context.
 * Does not mutate the context object.
 */
export function assembleIntelligenceRequest(
  sources: IntelligenceRequestSources,
): IntelligenceRequest {
  const question = validateIntelligenceQuestion(sources.question);
  const readiness = deriveIntelligenceRequestReadiness(sources.context);

  const request: IntelligenceRequest = {
    requestVersion: INTELLIGENCE_REQUEST_VERSION,
    requestId: sources.requestId ?? createRequestId(),
    createdAt: sources.createdAt ?? new Date().toISOString(),
    input: {
      question,
    },
    context: sources.context,
    readiness,
  };

  validateIntelligenceRequest(request);
  return request;
}
