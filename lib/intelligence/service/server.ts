/**
 * Server-only Intelligence Service entry (S8-IIP-007).
 *
 * Wires approved production dependencies. Do not import from Client Components.
 * Does not expose an API route or Server Action.
 */

import "server-only";

import { createBootstrappedIntelligenceProviderRegistry } from "@/lib/intelligence/bootstrap/create-bootstrapped-intelligence-provider-registry";
import { buildIntelligencePromptPayload } from "@/lib/intelligence/prompt/build-intelligence-prompt-payload";
import { resolveIntelligenceProvider } from "@/lib/intelligence/providers/provider-resolver";
import { prepareIntelligenceRequest } from "@/lib/intelligence/request/prepare-intelligence-request";
import { executeIntelligenceRequest as executeIntelligenceRequestWithDeps } from "@/lib/intelligence/service/execute-intelligence-request";
import type {
  ExecuteIntelligenceRequestInput,
  IntelligenceServiceDependencies,
  IntelligenceServiceResult,
} from "@/lib/intelligence/service/intelligence-service.types";

/**
 * Default production dependencies.
 * Creates an explicit bootstrapped registry per call (no process singleton).
 */
export function createDefaultIntelligenceServiceDependencies(): IntelligenceServiceDependencies {
  return {
    prepareRequest: prepareIntelligenceRequest,
    buildPromptPayload: buildIntelligencePromptPayload,
    providerRegistry: createBootstrappedIntelligenceProviderRegistry(),
    resolveProvider: resolveIntelligenceProvider,
  };
}

/**
 * Server-side Intelligence Service entry using production defaults.
 */
export async function executeIntelligenceRequest(
  input: ExecuteIntelligenceRequestInput,
  deps: IntelligenceServiceDependencies = createDefaultIntelligenceServiceDependencies(),
): Promise<IntelligenceServiceResult> {
  return executeIntelligenceRequestWithDeps(input, deps);
}

export type {
  ExecuteIntelligenceRequestInput,
  IntelligenceServiceDependencies,
  IntelligenceServiceResult,
} from "@/lib/intelligence/service/intelligence-service.types";
