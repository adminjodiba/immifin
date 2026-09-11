/**
 * IMMIFIN Intelligence Provider — provider-neutral interface (S8-IIP-004).
 *
 * Contract between the Immigration Intelligence Engine and any future LLM adapter.
 * Implementations (OpenAI, Anthropic, Gemini, Azure OpenAI, internal, …) are out of scope.
 */

import type {
  IntelligenceProviderCapability,
  IntelligenceProviderId,
  IntelligenceProviderName,
} from "@/lib/intelligence/providers/provider.capabilities";
import type {
  IntelligenceProviderGenerateRequest,
  IntelligenceProviderResponse,
} from "@/lib/intelligence/providers/provider.types";

/**
 * Every future AI provider adapter must implement this interface.
 *
 * Must not know: auth, databases, Stripe, subscriptions, Clerk, Visa Bulletin,
 * UI, HTTP routes, or API handlers. It receives a Prompt Payload and returns
 * a provider-neutral response (or throws `IntelligenceProviderError`).
 */
export interface IntelligenceProvider {
  readonly id: IntelligenceProviderId;
  readonly name: IntelligenceProviderName;
  readonly capabilities: readonly IntelligenceProviderCapability[];

  /**
   * Produce a text response from an Intelligence Prompt Payload.
   * Async to match future network-backed adapters; no I/O in this story.
   */
  generate(
    request: IntelligenceProviderGenerateRequest,
  ): Promise<IntelligenceProviderResponse>;
}
