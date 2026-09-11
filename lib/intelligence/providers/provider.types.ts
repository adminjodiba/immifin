/**
 * IMMIFIN Intelligence Provider — request / response contracts (S8-IIP-004).
 *
 * Provider-neutral. Consumes the S8-IIP-003 Prompt Payload only.
 * No vendor SDK shapes, auth, HTTP, or persistence.
 */

import type { IntelligencePromptPayload } from "@/lib/intelligence/prompt/intelligence-prompt-payload.types";
import type {
  IntelligenceProviderId,
  IntelligenceProviderName,
} from "@/lib/intelligence/providers/provider.capabilities";

/**
 * Input to `IntelligenceProvider.generate`.
 * Adapters must accept the approved Prompt Payload without remapping facts.
 */
export type IntelligenceProviderGenerateRequest = {
  payload: IntelligencePromptPayload;
};

/**
 * Version 1 provider-neutral text response.
 * No token counts, streaming chunks, or vendor-specific fields.
 */
export type IntelligenceProviderResponse = {
  /** Provider interface / response contract version. */
  responseVersion: string;
  providerId: IntelligenceProviderId;
  providerName: IntelligenceProviderName;
  /** Copied from `payload.requestId` for correlation (diagnostic only). */
  requestId: string;
  /** UTC ISO-8601 timestamp when the adapter produced the response. */
  createdAt: string;
  output: {
    text: string;
  };
};
