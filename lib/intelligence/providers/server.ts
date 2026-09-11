/**
 * Server-only entry for Intelligence providers (S8-IIP-005 / S8-IIP-006).
 *
 * Application server modules should import from this path.
 * Do not import from Client Components.
 *
 * Does not auto-register providers and does not execute OpenAI requests on import.
 */

import "server-only";

export { createIntelligenceProviderRegistry } from "@/lib/intelligence/providers/provider-registry";
export { resolveIntelligenceProvider } from "@/lib/intelligence/providers/provider-resolver";
export type { ResolveIntelligenceProviderInput } from "@/lib/intelligence/providers/provider-resolver";
export type {
  IntelligenceProviderMetadata,
  IntelligenceProviderRegistry,
} from "@/lib/intelligence/providers/provider-registry.types";
export {
  OPENAI_API_KEY_ENV,
  OPENAI_MODEL_ENV,
  createOpenAIProvider,
  resolveOpenAIProviderConfig,
  validateOpenAIProviderConfig,
} from "@/lib/intelligence/providers/openai";
export type {
  CreateOpenAIProviderOptions,
  OpenAICompatibleClient,
  OpenAIProviderConfig,
} from "@/lib/intelligence/providers/openai";
