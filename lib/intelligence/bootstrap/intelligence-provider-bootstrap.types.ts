/**
 * Controlled Intelligence Provider bootstrap types (S8-IIP-007).
 */

import type { CreateOpenAIProviderOptions } from "@/lib/intelligence/providers/openai/openai-provider.types";
import type { IntelligenceProvider } from "@/lib/intelligence/providers/provider.interface";
import type { IntelligenceProviderRegistry } from "@/lib/intelligence/providers/provider-registry.types";

export type CreateBootstrappedIntelligenceProviderRegistryOptions = {
  /**
   * Optional existing registry. When omitted, a fresh empty registry is created
   * via `createIntelligenceProviderRegistry()` (explicit instance — not a singleton).
   */
  registry?: IntelligenceProviderRegistry;
  /** Injected OpenAI provider (tests). Skips lazy construction. */
  openaiProvider?: IntelligenceProvider;
  /** Factory used for lazy OpenAI construction. Defaults to `createOpenAIProvider`. */
  createOpenAIProvider?: (
    options?: CreateOpenAIProviderOptions,
  ) => IntelligenceProvider;
  /** Options forwarded to the OpenAI factory on first use. */
  openaiOptions?: CreateOpenAIProviderOptions;
  /** When true, do not register OpenAI (tests / partial bootstrap). */
  skipOpenAI?: boolean;
};
