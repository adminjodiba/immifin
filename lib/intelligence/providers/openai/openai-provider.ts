/**
 * OpenAI Intelligence Provider adapter (S8-IIP-006).
 *
 * Vendor translation boundary:
 *   IntelligencePromptPayload → Responses API → IntelligenceProviderResponse
 *
 * No auto-registration, no Intelligence Service, no API/UI, no retries, no streaming.
 * Prefer importing via `@/lib/intelligence/providers/server` in application code.
 */

import OpenAI from "openai";
import type { IntelligencePromptPayload } from "@/lib/intelligence/prompt/intelligence-prompt-payload.types";
import {
  INTELLIGENCE_PROVIDER_CAPABILITY,
  INTELLIGENCE_PROVIDER_IDS,
  INTELLIGENCE_PROVIDER_INTERFACE_VERSION,
} from "@/lib/intelligence/providers/provider.capabilities";
import {
  INTELLIGENCE_PROVIDER_ERROR,
  IntelligenceProviderError,
} from "@/lib/intelligence/providers/provider.errors";
import type { IntelligenceProvider } from "@/lib/intelligence/providers/provider.interface";
import type {
  IntelligenceProviderGenerateRequest,
  IntelligenceProviderResponse,
} from "@/lib/intelligence/providers/provider.types";
import { resolveOpenAIProviderConfig } from "@/lib/intelligence/providers/openai/openai-provider.config";
import {
  detectOpenAIContentRefusal,
  mapOpenAIErrorToProviderError,
} from "@/lib/intelligence/providers/openai/openai-provider.errors";
import { mapPromptPayloadToOpenAIResponsesRequest } from "@/lib/intelligence/providers/openai/openai-provider.mapper";
import type {
  CreateOpenAIProviderOptions,
  OpenAICompatibleClient,
  OpenAIResponsesCreateResult,
} from "@/lib/intelligence/providers/openai/openai-provider.types";

const OPENAI_PROVIDER_NAME = "OpenAI";

function assertPayloadReady(payload: IntelligencePromptPayload): void {
  if (payload.readiness.status === "ready") {
    return;
  }

  throw new IntelligenceProviderError(
    INTELLIGENCE_PROVIDER_ERROR.INVALID_REQUEST,
    "Prompt payload is not ready for provider execution",
  );
}

function normalizeOpenAIResponse(
  result: OpenAIResponsesCreateResult,
  payload: IntelligencePromptPayload,
): IntelligenceProviderResponse {
  if (detectOpenAIContentRefusal(result)) {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.CONTENT_REFUSED,
      "OpenAI refused to generate content for this request",
    );
  }

  const text = typeof result.output_text === "string" ? result.output_text.trim() : "";
  if (!text) {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.EMPTY_RESPONSE,
      "OpenAI returned an empty response",
    );
  }

  return {
    responseVersion: INTELLIGENCE_PROVIDER_INTERFACE_VERSION,
    providerId: INTELLIGENCE_PROVIDER_IDS.OPENAI,
    providerName: OPENAI_PROVIDER_NAME,
    requestId: payload.requestId,
    createdAt: new Date().toISOString(),
    output: { text },
  };
}

function createSdkClient(apiKey: string): OpenAICompatibleClient {
  return new OpenAI({ apiKey });
}

/**
 * Create an OpenAI provider implementing `IntelligenceProvider`.
 *
 * - Validates configuration immediately (explicit options and/or env).
 * - Does not execute network requests at construction or registration time.
 * - Lazily constructs the official SDK client on first `generate` unless injected.
 */
export function createOpenAIProvider(
  options: CreateOpenAIProviderOptions = {},
): IntelligenceProvider {
  const config = resolveOpenAIProviderConfig(options);
  let client: OpenAICompatibleClient | undefined = options.client;

  const getClient = (): OpenAICompatibleClient => {
    if (!client) {
      client = createSdkClient(config.apiKey);
    }
    return client;
  };

  return {
    id: INTELLIGENCE_PROVIDER_IDS.OPENAI,
    name: OPENAI_PROVIDER_NAME,
    capabilities: [INTELLIGENCE_PROVIDER_CAPABILITY.TEXT_GENERATION],

    async generate(
      request: IntelligenceProviderGenerateRequest,
    ): Promise<IntelligenceProviderResponse> {
      if (!request || typeof request !== "object" || !request.payload) {
        throw new IntelligenceProviderError(
          INTELLIGENCE_PROVIDER_ERROR.INVALID_REQUEST,
          "Provider generate requires a prompt payload",
        );
      }

      assertPayloadReady(request.payload);

      const body = mapPromptPayloadToOpenAIResponsesRequest(
        request.payload,
        config.model,
      );

      try {
        const result = await getClient().responses.create(body);
        return normalizeOpenAIResponse(result, request.payload);
      } catch (error) {
        throw mapOpenAIErrorToProviderError(error);
      }
    },
  };
}
