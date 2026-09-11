/**
 * IMMIFIN Intelligence Provider Resolver (S8-IIP-005).
 *
 * Lookup boundary only — delegates to an explicit registry instance.
 * No alternate-provider selection, default provider, env inspection, routing, or provider execution.
 *
 * Prefer importing from `@/lib/intelligence/providers/server` in application
 * server modules so `server-only` protects the client boundary.
 */

import type { IntelligenceProviderId } from "@/lib/intelligence/providers/provider.capabilities";
import {
  INTELLIGENCE_PROVIDER_ERROR,
  IntelligenceProviderError,
} from "@/lib/intelligence/providers/provider.errors";
import type { IntelligenceProvider } from "@/lib/intelligence/providers/provider.interface";
import type { IntelligenceProviderRegistry } from "@/lib/intelligence/providers/provider-registry.types";

export type ResolveIntelligenceProviderInput = {
  registry: IntelligenceProviderRegistry;
  providerId: IntelligenceProviderId;
};

/**
 * Resolve a registered provider by authoritative id.
 * Propagates registry structured errors (including NOT_FOUND).
 */
export function resolveIntelligenceProvider(
  input: ResolveIntelligenceProviderInput,
): IntelligenceProvider {
  if (input === null || typeof input !== "object" || !input.registry) {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.INVALID_REQUEST,
      "Provider resolver requires a registry and providerId",
    );
  }

  return input.registry.resolve(input.providerId);
}
