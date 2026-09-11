/**
 * IMMIFIN Intelligence Provider Registry (S8-IIP-005).
 *
 * Explicit in-memory instance — not a global singleton.
 * Register / resolve only; does not execute providers, read env, or persist.
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
import type {
  IntelligenceProviderMetadata,
  IntelligenceProviderRegistry,
} from "@/lib/intelligence/providers/provider-registry.types";

function assertValidProviderId(providerId: unknown): asserts providerId is IntelligenceProviderId {
  if (typeof providerId !== "string" || providerId.trim().length === 0) {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.INVALID_REGISTRATION,
      "Provider id must be a non-empty string",
    );
  }
}

function assertValidProvider(provider: unknown): asserts provider is IntelligenceProvider {
  if (provider === null || typeof provider !== "object") {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.INVALID_REGISTRATION,
      "Provider must be an object implementing IntelligenceProvider",
    );
  }

  const candidate = provider as Partial<IntelligenceProvider>;
  assertValidProviderId(candidate.id);

  if (typeof candidate.name !== "string" || candidate.name.trim().length === 0) {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.INVALID_REGISTRATION,
      "Provider name must be a non-empty string",
    );
  }

  if (!Array.isArray(candidate.capabilities)) {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.INVALID_REGISTRATION,
      "Provider capabilities must be an array",
    );
  }

  if (typeof candidate.generate !== "function") {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.INVALID_REGISTRATION,
      "Provider must implement generate()",
    );
  }
}

function toMetadata(provider: IntelligenceProvider): IntelligenceProviderMetadata {
  return {
    id: provider.id,
    name: provider.name,
    capabilities: [...provider.capabilities],
  };
}

/**
 * Create an empty, mutable in-memory provider registry.
 *
 * Ownership model: explicit instance passed to future services / resolvers.
 * Test isolation: create a fresh registry per test — no shared global state.
 */
export function createIntelligenceProviderRegistry(): IntelligenceProviderRegistry {
  const providers = new Map<string, IntelligenceProvider>();

  return {
    register(provider: IntelligenceProvider): void {
      assertValidProvider(provider);

      if (providers.has(provider.id)) {
        throw new IntelligenceProviderError(
          INTELLIGENCE_PROVIDER_ERROR.DUPLICATE_REGISTRATION,
          "Provider id is already registered",
        );
      }

      providers.set(provider.id, provider);
    },

    resolve(providerId: IntelligenceProviderId): IntelligenceProvider {
      assertValidProviderId(providerId);

      const provider = providers.get(providerId);
      if (!provider) {
        throw new IntelligenceProviderError(
          INTELLIGENCE_PROVIDER_ERROR.NOT_FOUND,
          "Provider is not registered",
        );
      }

      return provider;
    },

    has(providerId: IntelligenceProviderId): boolean {
      if (typeof providerId !== "string" || providerId.trim().length === 0) {
        return false;
      }
      return providers.has(providerId);
    },

    list(): IntelligenceProviderMetadata[] {
      return [...providers.values()]
        .map(toMetadata)
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    },

    size(): number {
      return providers.size;
    },
  };
}
