/**
 * OpenAI provider configuration (S8-IIP-006).
 *
 * Server-side env-backed config only. Never logs or returns the API key.
 */

import {
  INTELLIGENCE_PROVIDER_ERROR,
  IntelligenceProviderError,
} from "@/lib/intelligence/providers/provider.errors";
import type {
  CreateOpenAIProviderOptions,
  OpenAIProviderConfig,
} from "@/lib/intelligence/providers/openai/openai-provider.types";

export const OPENAI_API_KEY_ENV = "OPENAI_API_KEY";
export const OPENAI_MODEL_ENV = "OPENAI_MODEL";

function readTrimmed(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validate explicit apiKey + model values.
 * Never includes secret values in error messages.
 */
export function validateOpenAIProviderConfig(input: {
  apiKey: unknown;
  model: unknown;
}): OpenAIProviderConfig {
  const apiKey = readTrimmed(input.apiKey);
  const model = readTrimmed(input.model);

  if (!apiKey) {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED,
      "OpenAI API key is not configured",
    );
  }

  if (!model) {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED,
      "OpenAI model is not configured",
    );
  }

  return { apiKey, model };
}

/**
 * Resolve OpenAI config from explicit options and/or environment variables.
 * Does not construct an SDK client and does not make network requests.
 */
export function resolveOpenAIProviderConfig(
  options: CreateOpenAIProviderOptions = {},
): OpenAIProviderConfig {
  const env = options.env ?? process.env;
  const apiKey =
    readTrimmed(options.apiKey) ?? readTrimmed(env[OPENAI_API_KEY_ENV]);
  const model =
    readTrimmed(options.model) ?? readTrimmed(env[OPENAI_MODEL_ENV]);

  return validateOpenAIProviderConfig({ apiKey, model });
}
