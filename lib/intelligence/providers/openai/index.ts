/**
 * OpenAI provider adapter exports (S8-IIP-006).
 *
 * Application server modules should prefer:
 *   `@/lib/intelligence/providers/server`
 */

export {
  OPENAI_API_KEY_ENV,
  OPENAI_MODEL_ENV,
  resolveOpenAIProviderConfig,
  validateOpenAIProviderConfig,
} from "@/lib/intelligence/providers/openai/openai-provider.config";
export {
  detectOpenAIContentRefusal,
  mapOpenAIErrorToProviderError,
} from "@/lib/intelligence/providers/openai/openai-provider.errors";
export {
  mapPromptPayloadToOpenAIInput,
  mapPromptPayloadToOpenAIInstructions,
  mapPromptPayloadToOpenAIResponsesRequest,
} from "@/lib/intelligence/providers/openai/openai-provider.mapper";
export { createOpenAIProvider } from "@/lib/intelligence/providers/openai/openai-provider";
export type {
  CreateOpenAIProviderOptions,
  OpenAICompatibleClient,
  OpenAIProviderConfig,
  OpenAIResponsesCreateParams,
  OpenAIResponsesCreateResult,
} from "@/lib/intelligence/providers/openai/openai-provider.types";
