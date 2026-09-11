/**
 * IMMIFIN Intelligence Prompt Payload builder (S8-IIP-003).
 *
 * Deterministic formatting boundary:
 *   IntelligenceRequest
 *   → IntelligencePromptPayload
 *   → future provider adapter
 *
 * No I/O, no auth, no DB, no model calls, no persistence, no logging.
 * Consumes the approved S8-IIP-002 request contract only.
 */

import type { IntelligenceRequest } from "@/lib/intelligence/request/intelligence-request.types";
import {
  INTELLIGENCE_PROMPT_INSTRUCTION_ROLE,
  INTELLIGENCE_PROMPT_PAYLOAD_VERSION,
  INTELLIGENCE_PROMPT_PRINCIPLES,
  INTELLIGENCE_PROMPT_PROHIBITED_BEHAVIORS,
} from "@/lib/intelligence/prompt/intelligence-prompt-payload.constants";
import type { IntelligencePromptPayload } from "@/lib/intelligence/prompt/intelligence-prompt-payload.types";
import { validateIntelligencePromptPayload } from "@/lib/intelligence/prompt/intelligence-prompt-payload.validation";

export type BuildIntelligencePromptPayloadOptions = {
  /** Injectable for deterministic tests; defaults to `new Date().toISOString()`. */
  createdAt?: string;
};

/**
 * Build a Version 1 provider-neutral prompt payload from an Intelligence Request.
 *
 * - Preserves requestId and validated question exactly
 * - Copies approved context slices without inventing facts
 * - Derives readiness from request readiness (no second completeness authority)
 * - Uses static centralized instruction constants
 *
 * Call only from server-side code after `prepareIntelligenceRequest()` (or
 * test assembly). Do not import from Client Components.
 */
export function buildIntelligencePromptPayload(
  request: IntelligenceRequest,
  options?: BuildIntelligencePromptPayloadOptions,
): IntelligencePromptPayload {
  const payload: IntelligencePromptPayload = {
    payloadVersion: INTELLIGENCE_PROMPT_PAYLOAD_VERSION,
    requestId: request.requestId,
    createdAt: options?.createdAt ?? new Date().toISOString(),
    instructions: {
      role: INTELLIGENCE_PROMPT_INSTRUCTION_ROLE,
      principles: [...INTELLIGENCE_PROMPT_PRINCIPLES],
      prohibitedBehaviors: [...INTELLIGENCE_PROMPT_PROHIBITED_BEHAVIORS],
    },
    userContext: {
      contextVersion: request.context.contextVersion,
      journey: request.context.journey,
      immigration: request.context.immigration,
      greenCard: request.context.greenCard,
      visaBulletin: request.context.visaBulletin,
      subscription: request.context.subscription,
      readiness: request.context.readiness,
    },
    userQuestion: request.input.question,
    readiness: {
      status: request.readiness.status,
      blockingReasons: [...request.readiness.blockingReasons],
      warnings: [...request.readiness.warnings],
    },
    metadata: {
      requestVersion: request.requestVersion,
      contextVersion: request.context.contextVersion,
      contextGeneratedAt: request.context.generatedAt,
      requestCreatedAt: request.createdAt,
    },
  };

  validateIntelligencePromptPayload(payload);
  return payload;
}
