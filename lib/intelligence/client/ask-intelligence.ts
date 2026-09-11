/**
 * Browser client for POST /api/intelligence/ask (S8-IIP-009).
 *
 * Does not import server-only Intelligence Service or provider SDK.
 * Does not log question or answer content.
 */

import {
  INTELLIGENCE_ASK_CLIENT_PROVIDER_ID,
  INTELLIGENCE_ASK_ENDPOINT,
  type IntelligenceAskClientResult,
} from "@/lib/intelligence/client/intelligence-ask.types";
import {
  mapIntelligenceAskHttpError,
  mapIntelligenceAskNetworkError,
} from "@/lib/intelligence/client/map-intelligence-ask-error";

export type AskIntelligenceInput = {
  question: string;
  signal?: AbortSignal;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Submit one Intelligence question through the authenticated API.
 * Provider id is fixed for Version 1 — no client model/provider selection.
 */
export async function askIntelligence(
  input: AskIntelligenceInput,
): Promise<IntelligenceAskClientResult> {
  let response: Response;

  try {
    response = await fetch(INTELLIGENCE_ASK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: input.signal,
      body: JSON.stringify({
        question: input.question,
        providerId: INTELLIGENCE_ASK_CLIENT_PROVIDER_ID,
      }),
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    return mapIntelligenceAskNetworkError();
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    return mapIntelligenceAskHttpError(response.status, body);
  }

  if (!isRecord(body)) {
    return mapIntelligenceAskHttpError(500, null);
  }

  if (body.status === "needs_profile_information") {
    return {
      kind: "needs_profile_information",
      requestId: typeof body.requestId === "string" ? body.requestId : "",
      blockingReasons: Array.isArray(body.blockingReasons)
        ? body.blockingReasons.filter((item): item is string => typeof item === "string")
        : [],
      warnings: Array.isArray(body.warnings)
        ? body.warnings.filter((item): item is string => typeof item === "string")
        : [],
    };
  }

  if (body.ok === true && body.status === "completed") {
    return {
      kind: "completed",
      requestId: typeof body.requestId === "string" ? body.requestId : "",
      providerId: typeof body.providerId === "string" ? body.providerId : "",
      answer: typeof body.answer === "string" ? body.answer : "",
      warnings: Array.isArray(body.warnings)
        ? body.warnings.filter((item): item is string => typeof item === "string")
        : [],
    };
  }

  return mapIntelligenceAskHttpError(response.status, body);
}
