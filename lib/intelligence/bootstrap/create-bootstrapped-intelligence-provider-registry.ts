/**
 * Controlled provider bootstrap (S8-IIP-007).
 *
 * Explicit factory — not import-time mutation, not a process singleton.
 * Registers OpenAI by authoritative id with lazy construction so missing
 * OPENAI_* config does not fail module import or unrelated application startup.
 *
 * Prefer importing via `@/lib/intelligence/bootstrap/server` in application code.
 */

import { createOpenAIProvider } from "@/lib/intelligence/providers/openai/openai-provider";
import type { CreateOpenAIProviderOptions } from "@/lib/intelligence/providers/openai/openai-provider.types";
import {
  INTELLIGENCE_PROVIDER_CAPABILITY,
  INTELLIGENCE_PROVIDER_IDS,
} from "@/lib/intelligence/providers/provider.capabilities";
import type { IntelligenceProvider } from "@/lib/intelligence/providers/provider.interface";
import { createIntelligenceProviderRegistry } from "@/lib/intelligence/providers/provider-registry";
import type { IntelligenceProviderRegistry } from "@/lib/intelligence/providers/provider-registry.types";
import type { CreateBootstrappedIntelligenceProviderRegistryOptions } from "@/lib/intelligence/bootstrap/intelligence-provider-bootstrap.types";
import type {
  IntelligenceProviderGenerateRequest,
  IntelligenceProviderResponse,
} from "@/lib/intelligence/providers/provider.types";

/**
 * Lazy OpenAI provider: registers the `openai` id without reading secrets or
 * constructing the SDK until the first `generate()` call.
 */
function createLazyOpenAIProvider(
  factory: (options?: CreateOpenAIProviderOptions) => IntelligenceProvider,
  openaiOptions?: CreateOpenAIProviderOptions,
): IntelligenceProvider {
  let inner: IntelligenceProvider | undefined;

  return {
    id: INTELLIGENCE_PROVIDER_IDS.OPENAI,
    name: "OpenAI",
    capabilities: [INTELLIGENCE_PROVIDER_CAPABILITY.TEXT_GENERATION],
    async generate(
      request: IntelligenceProviderGenerateRequest,
    ): Promise<IntelligenceProviderResponse> {
      if (!inner) {
        inner = factory(openaiOptions);
      }
      return inner.generate(request);
    },
  };
}

/**
 * Create a registry with OpenAI registered explicitly (idempotent for that id).
 *
 * - Zero network calls
 * - Zero OpenAI SDK construction unless an injected provider is supplied
 * - Duplicate OpenAI registration is skipped (does not replace)
 * - Missing env config surfaces as `NOT_CONFIGURED` on first OpenAI execution
 */
export function createBootstrappedIntelligenceProviderRegistry(
  options: CreateBootstrappedIntelligenceProviderRegistryOptions = {},
): IntelligenceProviderRegistry {
  const registry = options.registry ?? createIntelligenceProviderRegistry();

  if (options.skipOpenAI) {
    return registry;
  }

  if (registry.has(INTELLIGENCE_PROVIDER_IDS.OPENAI)) {
    return registry;
  }

  if (options.openaiProvider) {
    registry.register(options.openaiProvider);
    return registry;
  }

  const factory = options.createOpenAIProvider ?? createOpenAIProvider;
  registry.register(createLazyOpenAIProvider(factory, options.openaiOptions));
  return registry;
}
