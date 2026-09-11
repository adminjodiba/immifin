/**
 * IMMIFIN Intelligence Service orchestration (S8-IIP-007).
 *
 * Flow:
 *   validate input
 *   → prepareIntelligenceRequest (injected)
 *   → readiness short-circuit (no provider call)
 *   → buildIntelligencePromptPayload (injected)
 *   → resolve provider (explicit id)
 *   → provider.generate once
 *   → normalize result
 *
 * Does not call OpenAI SDK, query DB, apply subscriptions, retry, or fall back.
 * Prefer production entry: `@/lib/intelligence/service/server`.
 */

import type { IntelligenceProviderId } from "@/lib/intelligence/providers/provider.capabilities";
import type {
  ExecuteIntelligenceRequestInput,
  IntelligenceServiceDependencies,
  IntelligenceServiceResult,
} from "@/lib/intelligence/service/intelligence-service.types";
import { validateExecuteIntelligenceRequestInput } from "@/lib/intelligence/service/intelligence-service.validation";

/**
 * Execute one Intelligence request through approved Sprint 8 foundations.
 *
 * Dependencies are required so automated verification can inject fakes without
 * importing server-only builders.
 */
export async function executeIntelligenceRequest(
  input: ExecuteIntelligenceRequestInput | unknown,
  deps: IntelligenceServiceDependencies,
): Promise<IntelligenceServiceResult> {
  const validated = validateExecuteIntelligenceRequestInput(input);
  const providerId: IntelligenceProviderId = validated.providerId;

  const request = await deps.prepareRequest(validated.question);

  if (request.readiness.status === "needs_profile_information") {
    return {
      status: "needs_profile_information",
      requestId: request.requestId,
      blockingReasons: [...request.readiness.blockingReasons],
      warnings: [...request.readiness.warnings],
    };
  }

  const payload = deps.buildPromptPayload(request);

  const provider = deps.resolveProvider({
    registry: deps.providerRegistry,
    providerId,
  });

  const providerResponse = await provider.generate({ payload });

  return {
    status: "completed",
    requestId: request.requestId,
    contextVersion: request.context.contextVersion,
    providerId: providerResponse.providerId,
    outputText: providerResponse.output.text,
    metadata: {
      providerName: providerResponse.providerName,
      responseVersion: providerResponse.responseVersion,
      createdAt: providerResponse.createdAt,
    },
  };
}
