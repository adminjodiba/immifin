/**
 * OpenAI SDK → IntelligenceProviderError mapping (S8-IIP-006).
 *
 * Safe messages only — never include API keys, prompts, questions, or response bodies.
 */

import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
} from "openai";
import {
  INTELLIGENCE_PROVIDER_ERROR,
  IntelligenceProviderError,
} from "@/lib/intelligence/providers/provider.errors";

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function getErrorName(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }
  const name = (error as { name?: unknown }).name;
  if (typeof name === "string" && name !== "Error") {
    return name;
  }
  const ctorName = (error as { constructor?: { name?: unknown } }).constructor
    ?.name;
  return typeof ctorName === "string" ? ctorName : undefined;
}

/**
 * Map an OpenAI SDK / unknown failure into a structured provider error.
 *
 * Uses `instanceof` when available, with status/name fallbacks for ESM/CJS interop.
 */
export function mapOpenAIErrorToProviderError(error: unknown): IntelligenceProviderError {
  if (error instanceof IntelligenceProviderError) {
    return error;
  }

  const status = getErrorStatus(error);
  const name = getErrorName(error);

  if (
    error instanceof AuthenticationError ||
    name === "AuthenticationError" ||
    status === 401
  ) {
    return new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.AUTHENTICATION_FAILED,
      "OpenAI authentication failed",
    );
  }

  if (
    error instanceof PermissionDeniedError ||
    name === "PermissionDeniedError" ||
    status === 403
  ) {
    return new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.PERMISSION_DENIED,
      "OpenAI permission denied",
    );
  }

  if (
    error instanceof RateLimitError ||
    name === "RateLimitError" ||
    status === 429
  ) {
    return new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.RATE_LIMITED,
      "OpenAI rate limit exceeded",
    );
  }

  if (
    error instanceof APIConnectionTimeoutError ||
    name === "APIConnectionTimeoutError"
  ) {
    return new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.TIMEOUT,
      "OpenAI request timed out",
    );
  }

  if (
    (error instanceof APIConnectionError || name === "APIConnectionError") &&
    name !== "APIConnectionTimeoutError"
  ) {
    return new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.CONNECTION_FAILED,
      "OpenAI connection failed",
    );
  }

  if (
    error instanceof BadRequestError ||
    name === "BadRequestError" ||
    status === 400
  ) {
    return new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.INVALID_REQUEST,
      "OpenAI rejected the request as invalid",
    );
  }

  if (
    error instanceof InternalServerError ||
    name === "InternalServerError" ||
    (status !== undefined && status >= 500)
  ) {
    return new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.UNAVAILABLE,
      "OpenAI service is unavailable",
    );
  }

  if (error instanceof APIError || name === "APIError") {
    return new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.PROVIDER_FAILURE,
      "OpenAI provider request failed",
    );
  }

  return new IntelligenceProviderError(
    INTELLIGENCE_PROVIDER_ERROR.PROVIDER_FAILURE,
    "OpenAI provider request failed",
  );
}

/**
 * Detect a safety / refusal style OpenAI response without exposing content.
 */
export function detectOpenAIContentRefusal(result: {
  status?: string | null;
  output_text?: string | null;
  output?: unknown;
  error?: { message?: string | null; code?: string | null } | null;
}): boolean {
  if (result.error?.code === "content_filter") {
    return true;
  }

  if (!Array.isArray(result.output)) {
    return false;
  }

  for (const item of result.output) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const record = item as { type?: string; content?: unknown };
    if (record.type === "refusal") {
      return true;
    }
    if (!Array.isArray(record.content)) {
      continue;
    }
    for (const part of record.content) {
      if (
        part &&
        typeof part === "object" &&
        (part as { type?: string }).type === "refusal"
      ) {
        return true;
      }
    }
  }

  return false;
}
