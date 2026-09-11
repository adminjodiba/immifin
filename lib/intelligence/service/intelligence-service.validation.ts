/**
 * Intelligence Service input validation (S8-IIP-007).
 */

import type { IntelligenceProviderId } from "@/lib/intelligence/providers/provider.capabilities";
import {
  INTELLIGENCE_SERVICE_ERROR,
  IntelligenceServiceError,
} from "@/lib/intelligence/service/intelligence-service.errors";
import type { ExecuteIntelligenceRequestInput } from "@/lib/intelligence/service/intelligence-service.types";

export function validateExecuteIntelligenceRequestInput(
  input: unknown,
): ExecuteIntelligenceRequestInput {
  if (input === null || typeof input !== "object") {
    throw new IntelligenceServiceError(
      INTELLIGENCE_SERVICE_ERROR.INVALID_INPUT,
      "Intelligence service input must be an object",
    );
  }

  const record = input as Record<string, unknown>;

  if (typeof record.question !== "string") {
    throw new IntelligenceServiceError(
      INTELLIGENCE_SERVICE_ERROR.INVALID_INPUT,
      "Intelligence service requires a question string",
    );
  }

  if (typeof record.providerId !== "string" || record.providerId.trim().length === 0) {
    throw new IntelligenceServiceError(
      INTELLIGENCE_SERVICE_ERROR.INVALID_INPUT,
      "Intelligence service requires an explicit providerId",
    );
  }

  return {
    question: record.question,
    providerId: record.providerId.trim() as IntelligenceProviderId,
  };
}
