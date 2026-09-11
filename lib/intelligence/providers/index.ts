/**
 * IMMIFIN Intelligence Provider public exports (S8-IIP-004 / S8-IIP-005 / S8-IIP-006).
 *
 * Contracts + registry/resolver + OpenAI adapter factory.
 * No automatic registration, no Intelligence Service, no API/UI.
 *
 * Application server modules should prefer:
 *   `@/lib/intelligence/providers/server`
 * (`import "server-only"`).
 *
 * Future path:
 *   buildIntelligencePromptPayload(request)
 *   → resolveIntelligenceProvider({ registry, providerId })
 *   → provider.generate({ payload })
 */

export type { IntelligenceProvider } from "@/lib/intelligence/providers/provider.interface";
export {
  INTELLIGENCE_PROVIDER_CAPABILITY,
  INTELLIGENCE_PROVIDER_IDS,
  INTELLIGENCE_PROVIDER_INTERFACE_VERSION,
  type IntelligenceProviderCapability,
  type IntelligenceProviderId,
  type IntelligenceProviderName,
  type KnownIntelligenceProviderId,
} from "@/lib/intelligence/providers/provider.capabilities";
export {
  INTELLIGENCE_PROVIDER_ERROR,
  IntelligenceProviderError,
  isIntelligenceProviderError,
  type IntelligenceProviderErrorCode,
} from "@/lib/intelligence/providers/provider.errors";
export type {
  IntelligenceProviderGenerateRequest,
  IntelligenceProviderResponse,
} from "@/lib/intelligence/providers/provider.types";
export { createIntelligenceProviderRegistry } from "@/lib/intelligence/providers/provider-registry";
export type {
  IntelligenceProviderMetadata,
  IntelligenceProviderRegistry,
} from "@/lib/intelligence/providers/provider-registry.types";
export {
  resolveIntelligenceProvider,
  type ResolveIntelligenceProviderInput,
} from "@/lib/intelligence/providers/provider-resolver";
export {
  OPENAI_API_KEY_ENV,
  OPENAI_MODEL_ENV,
  createOpenAIProvider,
  mapOpenAIErrorToProviderError,
  mapPromptPayloadToOpenAIResponsesRequest,
  resolveOpenAIProviderConfig,
  validateOpenAIProviderConfig,
} from "@/lib/intelligence/providers/openai";
export type {
  CreateOpenAIProviderOptions,
  OpenAICompatibleClient,
  OpenAIProviderConfig,
} from "@/lib/intelligence/providers/openai";

