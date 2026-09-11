/**
 * Intelligence API request validation (S8-IIP-008).
 *
 * Reuses S8-IIP-002 question validation. Rejects unexpected body fields.
 * Does not rewrite or silently truncate questions.
 */

import {
  INTELLIGENCE_API_MAX_BODY_BYTES,
  INTELLIGENCE_API_QUESTION_MAX_LENGTH,
} from "@/lib/intelligence/api/intelligence-api.constants";
import {
  INTELLIGENCE_API_ERROR,
  IntelligenceApiError,
} from "@/lib/intelligence/api/intelligence-api.errors";
import type { IntelligenceAskApiRequest } from "@/lib/intelligence/api/intelligence-api.types";
import {
  INTELLIGENCE_PROVIDER_IDS,
  type IntelligenceProviderId,
  type KnownIntelligenceProviderId,
} from "@/lib/intelligence/providers/provider.capabilities";
import { validateIntelligenceQuestion } from "@/lib/intelligence/request/intelligence-request.validation";
import { IntelligenceRequestError } from "@/lib/intelligence/request/intelligence-request.types";

const APPROVED_PROVIDER_IDS = new Set<string>(
  Object.values(INTELLIGENCE_PROVIDER_IDS) as KnownIntelligenceProviderId[],
);

const ALLOWED_BODY_KEYS = new Set(["question", "providerId"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function assertIntelligenceAskContentType(request: Request, requestId?: string): void {
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.toLowerCase().includes("application/json")) {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.INVALID_CONTENT_TYPE,
      "Content-Type must be application/json.",
      400,
      requestId,
    );
  }
}

export async function readIntelligenceAskJsonBody(
  request: Request,
  requestId?: string,
): Promise<unknown> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > INTELLIGENCE_API_MAX_BODY_BYTES) {
      throw new IntelligenceApiError(
        INTELLIGENCE_API_ERROR.BODY_TOO_LARGE,
        "Request body is too large.",
        413,
        requestId,
      );
    }
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.INVALID_JSON,
      "Request body must be valid JSON.",
      400,
      requestId,
    );
  }

  if (raw.length > INTELLIGENCE_API_MAX_BODY_BYTES) {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.BODY_TOO_LARGE,
      "Request body is too large.",
      413,
      requestId,
    );
  }

  if (!raw.trim()) {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.INVALID_REQUEST,
      "Request body is required.",
      400,
      requestId,
    );
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.INVALID_JSON,
      "Request body must be valid JSON.",
      400,
      requestId,
    );
  }
}

/**
 * Validate API body. Rejects unexpected fields. Trims question via S8-IIP-002.
 */
export function validateIntelligenceAskRequest(
  body: unknown,
  requestId?: string,
): IntelligenceAskApiRequest {
  if (!isPlainObject(body)) {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.INVALID_REQUEST,
      "Request body must be a JSON object.",
      400,
      requestId,
    );
  }

  for (const key of Object.keys(body)) {
    if (!ALLOWED_BODY_KEYS.has(key)) {
      throw new IntelligenceApiError(
        INTELLIGENCE_API_ERROR.INVALID_REQUEST,
        "Request contains unsupported fields.",
        400,
        requestId,
      );
    }
  }

  if (!("question" in body)) {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.INVALID_REQUEST,
      "question is required.",
      400,
      requestId,
    );
  }

  if (!("providerId" in body)) {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.INVALID_REQUEST,
      "providerId is required.",
      400,
      requestId,
    );
  }

  if (typeof body.providerId !== "string" || body.providerId.trim().length === 0) {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.INVALID_REQUEST,
      "providerId must be a non-empty string.",
      400,
      requestId,
    );
  }

  const providerId = body.providerId.trim();
  if (!APPROVED_PROVIDER_IDS.has(providerId)) {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.INVALID_REQUEST,
      "providerId is not an approved provider.",
      400,
      requestId,
    );
  }

  try {
    const question = validateIntelligenceQuestion(body.question);
    return {
      question,
      providerId: providerId as IntelligenceProviderId,
    };
  } catch (error: unknown) {
    if (error instanceof IntelligenceRequestError) {
      throw new IntelligenceApiError(
        INTELLIGENCE_API_ERROR.INVALID_REQUEST,
        error.message,
        400,
        requestId,
      );
    }
    throw error;
  }
}

export { INTELLIGENCE_API_QUESTION_MAX_LENGTH };
