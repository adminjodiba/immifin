/**
 * IMMIFIN Intelligence Provider — Version 1 capability contract.
 *
 * Capabilities describe what a future adapter may declare.
 * This story does not implement any provider behavior.
 */

/** Provider interface contract version (S8-IIP-004). */
export const INTELLIGENCE_PROVIDER_INTERFACE_VERSION = "1.0.0";

/**
 * Reserved provider identifiers for future adapters.
 * Values are documentation / typing aids only — no adapters ship in S8-IIP-004.
 */
export const INTELLIGENCE_PROVIDER_IDS = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GEMINI: "gemini",
  AZURE_OPENAI: "azure_openai",
  INTERNAL: "internal",
} as const;

export type KnownIntelligenceProviderId =
  (typeof INTELLIGENCE_PROVIDER_IDS)[keyof typeof INTELLIGENCE_PROVIDER_IDS];

/**
 * Stable provider id string.
 * Known reserved ids are listed above; future providers may use additional strings.
 */
export type IntelligenceProviderId = KnownIntelligenceProviderId | (string & {});

/** Human-readable provider display name. */
export type IntelligenceProviderName = string;

/**
 * Version 1 capabilities.
 * Streaming, tool-use, embeddings, etc. are intentionally absent until approved.
 */
export const INTELLIGENCE_PROVIDER_CAPABILITY = {
  TEXT_GENERATION: "text_generation",
} as const;

export type IntelligenceProviderCapability =
  (typeof INTELLIGENCE_PROVIDER_CAPABILITY)[keyof typeof INTELLIGENCE_PROVIDER_CAPABILITY];
