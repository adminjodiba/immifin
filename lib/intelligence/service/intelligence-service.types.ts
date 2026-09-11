/**
 * Intelligence Service contracts (S8-IIP-007).
 *
 * Identity/auth is resolved by the approved request builder
 * (`prepareIntelligenceRequest` → `buildIntelligenceContext` → `requireUser`).
 * This service does not accept Clerk sessions, HTTP requests, or API keys.
 */

import type { IntelligencePromptPayload } from "@/lib/intelligence/prompt/intelligence-prompt-payload.types";
import type { IntelligenceProviderId } from "@/lib/intelligence/providers/provider.capabilities";
import type { IntelligenceProviderRegistry } from "@/lib/intelligence/providers/provider-registry.types";
import type { ResolveIntelligenceProviderInput } from "@/lib/intelligence/providers/provider-resolver";
import type { IntelligenceProvider } from "@/lib/intelligence/providers/provider.interface";
import type { IntelligenceRequest } from "@/lib/intelligence/request/intelligence-request.types";

/**
 * Internal service input.
 * Provider selection is explicit — Version 1 does not default to OpenAI.
 */
export type ExecuteIntelligenceRequestInput = {
  question: string;
  providerId: IntelligenceProviderId;
};

/** Safe provider metadata returned on completed results. */
export type IntelligenceServiceSafeProviderMetadata = {
  providerName: string;
  responseVersion: string;
  createdAt: string;
};

export type IntelligenceServiceCompletedResult = {
  status: "completed";
  requestId: string;
  contextVersion: string;
  providerId: IntelligenceProviderId;
  outputText: string;
  metadata: IntelligenceServiceSafeProviderMetadata;
};

export type IntelligenceServiceNeedsProfileResult = {
  status: "needs_profile_information";
  requestId: string;
  blockingReasons: string[];
  warnings: string[];
};

export type IntelligenceServiceResult =
  | IntelligenceServiceCompletedResult
  | IntelligenceServiceNeedsProfileResult;

/**
 * Injectable dependencies for deterministic verification.
 * Production defaults are wired in `service/server.ts`.
 */
export type IntelligenceServiceDependencies = {
  prepareRequest: (question: unknown) => Promise<IntelligenceRequest>;
  buildPromptPayload: (request: IntelligenceRequest) => IntelligencePromptPayload;
  providerRegistry: IntelligenceProviderRegistry;
  resolveProvider: (input: ResolveIntelligenceProviderInput) => IntelligenceProvider;
};
