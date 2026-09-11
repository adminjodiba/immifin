/**
 * Intelligence API HTTP response helpers (S8-IIP-008).
 */

import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { INTELLIGENCE_API_CACHE_CONTROL } from "@/lib/intelligence/api/intelligence-api.constants";
import {
  INTELLIGENCE_API_ERROR,
  IntelligenceApiError,
  isIntelligenceApiError,
} from "@/lib/intelligence/api/intelligence-api.errors";
import type {
  IntelligenceAskCompletedResponse,
  IntelligenceAskErrorBody,
  IntelligenceAskNeedsProfileResponse,
} from "@/lib/intelligence/api/intelligence-api.types";
import {
  INTELLIGENCE_PROVIDER_ERROR,
  isIntelligenceProviderError,
} from "@/lib/intelligence/providers/provider.errors";
import { isIntelligenceRequestError } from "@/lib/intelligence/request/intelligence-request.types";
import {
  isIntelligenceServiceError,
} from "@/lib/intelligence/service/intelligence-service.errors";
import type { IntelligenceServiceResult } from "@/lib/intelligence/service/intelligence-service.types";
import { isIntelligenceContextError } from "@/lib/intelligence/context/intelligence-context.types";

function privateJson(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": INTELLIGENCE_API_CACHE_CONTROL,
    },
  });
}

export function intelligenceAskErrorResponse(
  error: unknown,
  requestId?: string,
): NextResponse {
  if (isIntelligenceApiError(error)) {
    const body: IntelligenceAskErrorBody = {
      ok: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.requestId || requestId
          ? { requestId: error.requestId ?? requestId }
          : {}),
      },
    };
    return privateJson(body, error.status);
  }

  if (isAuthError(error)) {
    const code =
      error.status === 401
        ? INTELLIGENCE_API_ERROR.UNAUTHENTICATED
        : error.status === 403 && error.message.includes("Power")
          ? INTELLIGENCE_API_ERROR.AI_CAPABILITY_REQUIRED
          : INTELLIGENCE_API_ERROR.INTERNAL_ERROR;
    const status = error.status === 401 || error.status === 403 ? error.status : 500;
    const body: IntelligenceAskErrorBody = {
      ok: false,
      error: {
        code: status === 500 ? INTELLIGENCE_API_ERROR.INTERNAL_ERROR : code,
        message:
          status === 500
            ? "Unable to process the intelligence request."
            : error.message,
        ...(requestId ? { requestId } : {}),
      },
    };
    return privateJson(body, status === 500 ? 500 : error.status);
  }

  if (isIntelligenceRequestError(error) || isIntelligenceServiceError(error)) {
    const body: IntelligenceAskErrorBody = {
      ok: false,
      error: {
        code: INTELLIGENCE_API_ERROR.INVALID_REQUEST,
        message: "Invalid intelligence request.",
        ...(requestId ? { requestId } : {}),
      },
    };
    return privateJson(body, 400);
  }

  if (isIntelligenceProviderError(error)) {
    const mapped = mapProviderError(error.code, error.message, requestId);
    return privateJson(mapped.body, mapped.status);
  }

  if (isIntelligenceContextError(error)) {
    const body: IntelligenceAskErrorBody = {
      ok: false,
      error: {
        code: INTELLIGENCE_API_ERROR.INTERNAL_ERROR,
        message: "Unable to process the intelligence request.",
        ...(requestId ? { requestId } : {}),
      },
    };
    return privateJson(body, 500);
  }

  void error;
  const body: IntelligenceAskErrorBody = {
    ok: false,
    error: {
      code: INTELLIGENCE_API_ERROR.INTERNAL_ERROR,
      message: "Unable to process the intelligence request.",
      ...(requestId ? { requestId } : {}),
    },
  };
  return privateJson(body, 500);
}

function mapProviderError(
  code: string,
  _message: string,
  requestId?: string,
): { status: number; body: IntelligenceAskErrorBody } {
  const safe = (
    apiCode: string,
    status: number,
    message: string,
  ): { status: number; body: IntelligenceAskErrorBody } => ({
    status,
    body: {
      ok: false,
      error: {
        code: apiCode,
        message,
        ...(requestId ? { requestId } : {}),
      },
    },
  });

  switch (code) {
    case INTELLIGENCE_PROVIDER_ERROR.NOT_FOUND:
      return safe(
        INTELLIGENCE_API_ERROR.PROVIDER_NOT_FOUND,
        502,
        "The selected intelligence provider is unavailable.",
      );
    case INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED:
      return safe(
        INTELLIGENCE_API_ERROR.PROVIDER_NOT_CONFIGURED,
        503,
        "The intelligence provider is not configured.",
      );
    case INTELLIGENCE_PROVIDER_ERROR.AUTHENTICATION_FAILED:
    case INTELLIGENCE_PROVIDER_ERROR.PERMISSION_DENIED:
      return safe(
        INTELLIGENCE_API_ERROR.PROVIDER_AUTHENTICATION_FAILED,
        502,
        "The intelligence provider rejected authentication.",
      );
    case INTELLIGENCE_PROVIDER_ERROR.RATE_LIMITED:
      return safe(
        INTELLIGENCE_API_ERROR.PROVIDER_RATE_LIMITED,
        429,
        "The intelligence provider rate limit was exceeded.",
      );
    case INTELLIGENCE_PROVIDER_ERROR.TIMEOUT:
      return safe(
        INTELLIGENCE_API_ERROR.PROVIDER_TIMEOUT,
        504,
        "The intelligence provider timed out.",
      );
    case INTELLIGENCE_PROVIDER_ERROR.UNAVAILABLE:
    case INTELLIGENCE_PROVIDER_ERROR.CONNECTION_FAILED:
      return safe(
        INTELLIGENCE_API_ERROR.PROVIDER_UNAVAILABLE,
        503,
        "The intelligence provider is temporarily unavailable.",
      );
    default:
      return safe(
        INTELLIGENCE_API_ERROR.PROVIDER_FAILURE,
        502,
        "The intelligence provider failed to complete the request.",
      );
  }
}

export function intelligenceAskServiceResultResponse(
  result: IntelligenceServiceResult,
): NextResponse {
  if (result.status === "needs_profile_information") {
    const body: IntelligenceAskNeedsProfileResponse = {
      ok: false,
      status: "needs_profile_information",
      requestId: result.requestId,
      blockingReasons: [...result.blockingReasons],
      warnings: [...result.warnings],
    };
    return privateJson(body, 422);
  }

  const body: IntelligenceAskCompletedResponse = {
    ok: true,
    status: "completed",
    requestId: result.requestId,
    providerId: result.providerId,
    answer: result.outputText,
    warnings: [],
  };
  return privateJson(body, 200);
}
