/**
 * IMMIFIN Intelligence Provider Registry — Version 1 contracts (S8-IIP-005).
 *
 * In-memory registry surface only. No SDKs, env, network, or persistence.
 */

import type {
  IntelligenceProviderCapability,
  IntelligenceProviderId,
  IntelligenceProviderName,
} from "@/lib/intelligence/providers/provider.capabilities";
import type { IntelligenceProvider } from "@/lib/intelligence/providers/provider.interface";

/**
 * Safe provider metadata for listing / diagnostics.
 * Must not include secrets, clients, SDK objects, or internal maps.
 */
export type IntelligenceProviderMetadata = {
  id: IntelligenceProviderId;
  name: IntelligenceProviderName;
  capabilities: readonly IntelligenceProviderCapability[];
};

/**
 * Explicit in-memory provider registry instance.
 * Create via `createIntelligenceProviderRegistry()` — not a process singleton.
 */
export type IntelligenceProviderRegistry = {
  /** Register a provider. Rejects duplicates; never calls the provider. */
  register(provider: IntelligenceProvider): void;
  /** Resolve by authoritative provider id. Throws NOT_FOUND when missing. */
  resolve(providerId: IntelligenceProviderId): IntelligenceProvider;
  /** Deterministic membership check; does not mutate state. */
  has(providerId: IntelligenceProviderId): boolean;
  /** Safe metadata, sorted by provider id ascending. */
  list(): IntelligenceProviderMetadata[];
  /** Registered provider count (tests / diagnostics). */
  size(): number;
};
