/**
 * IMMIFIN Intelligence Prompt Payload public exports (S8-IIP-003).
 *
 * Provider-neutral formatter. Import only from server modules.
 * Production path:
 *   prepareIntelligenceRequest(question) → buildIntelligencePromptPayload(request)
 */

export {
  buildIntelligencePromptPayload,
  type BuildIntelligencePromptPayloadOptions,
} from "@/lib/intelligence/prompt/build-intelligence-prompt-payload";
export {
  INTELLIGENCE_PROMPT_INSTRUCTION_ROLE,
  INTELLIGENCE_PROMPT_PAYLOAD_VERSION,
  INTELLIGENCE_PROMPT_PRINCIPLES,
  INTELLIGENCE_PROMPT_PROHIBITED_BEHAVIORS,
} from "@/lib/intelligence/prompt/intelligence-prompt-payload.constants";
export type {
  IntelligencePromptInstructions,
  IntelligencePromptPayload,
  IntelligencePromptPayloadMetadata,
  IntelligencePromptUserContext,
} from "@/lib/intelligence/prompt/intelligence-prompt-payload.types";
export { validateIntelligencePromptPayload } from "@/lib/intelligence/prompt/intelligence-prompt-payload.validation";
