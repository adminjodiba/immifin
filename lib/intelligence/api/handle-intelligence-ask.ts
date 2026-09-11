/**
 * Authenticated Intelligence Ask handler (S8-IIP-008 / S8-IIP-011).
 *
 * Flow:
 *   origin → authenticate → AI capability → beta eligibility → kill switch
 *   → validate body → abuse-control → executeIntelligenceRequest once → map response
 *
 * Does not call OpenAI SDK, build context/prompt, retry, or persist.
 * Prefer route entry: `app/api/intelligence/ask/route.ts`.
 */

import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { requireUser } from "@/lib/auth/requireUser";
import {
  INTELLIGENCE_ASK_ROUTE,
} from "@/lib/intelligence/api/intelligence-api.constants";
import {
  createAllowAllIntelligenceAbuseControl,
} from "@/lib/intelligence/api/intelligence-api.abuse";
import {
  INTELLIGENCE_API_ERROR,
  IntelligenceApiError,
} from "@/lib/intelligence/api/intelligence-api.errors";
import {
  intelligenceAskErrorResponse,
  intelligenceAskServiceResultResponse,
} from "@/lib/intelligence/api/intelligence-api.http";
import { assertIntelligenceAskOrigin } from "@/lib/intelligence/api/intelligence-api.origin";
import type { IntelligenceAskHandlerDependencies } from "@/lib/intelligence/api/intelligence-api.types";
import {
  assertIntelligenceAskContentType,
  readIntelligenceAskJsonBody,
  validateIntelligenceAskRequest,
} from "@/lib/intelligence/api/intelligence-api.validation";
import { isIntelligenceExecutionEnabled } from "@/lib/intelligence/api/intelligence-execution-gate";
import {
  resolveIntelligenceBetaEligibility,
} from "@/lib/intelligence/beta/intelligence-beta-eligibility";
import { CAPABILITY } from "@/lib/subscription/capabilities";
import { assertCapability } from "@/lib/subscription/assertCapability";
import type { ProfileWithRelations } from "@/lib/supabase/types";

function defaultAssertAiCapability(profileWithRelations: ProfileWithRelations): void {
  try {
    assertCapability(profileWithRelations, CAPABILITY.ai);
  } catch (error: unknown) {
    if (error instanceof AuthError && error.status === 403) {
      throw new IntelligenceApiError(
        INTELLIGENCE_API_ERROR.AI_CAPABILITY_REQUIRED,
        error.message,
        403,
      );
    }
    throw error;
  }
}

function defaultAssertBetaEligibility(profileWithRelations: ProfileWithRelations): void {
  const eligibility = resolveIntelligenceBetaEligibility(
    profileWithRelations.profile.clerk_user_id,
  );
  if (eligibility.eligible) {
    return;
  }
  throw new IntelligenceApiError(
    INTELLIGENCE_API_ERROR.BETA_NOT_ELIGIBLE,
    "IMMIFIN Intelligence is currently available only to invited Power members.",
    403,
  );
}

/**
 * Production dependencies. `executeIntelligenceRequest` is injected by the
 * server-only route so verify scripts can mock without importing server-only.
 */
export function createDefaultIntelligenceAskHandlerDependencies(
  executeIntelligenceRequest: IntelligenceAskHandlerDependencies["executeIntelligenceRequest"],
): IntelligenceAskHandlerDependencies {
  return {
    requireUser,
    assertAiCapability: defaultAssertAiCapability,
    assertBetaEligibility: defaultAssertBetaEligibility,
    abuseControl: createAllowAllIntelligenceAbuseControl(),
    executeIntelligenceRequest,
    requireOrigin: false,
  };
}

/**
 * Handle one authenticated Intelligence Ask POST.
 */
export async function handleIntelligenceAsk(
  request: Request,
  deps: IntelligenceAskHandlerDependencies,
): Promise<NextResponse> {
  const requestId = randomUUID();

  try {
    assertIntelligenceAskOrigin(request, {
      requireOrigin: deps.requireOrigin ?? false,
      requestId,
    });

    const profileWithRelations = await deps.requireUser();
    deps.assertAiCapability(profileWithRelations);
    (deps.assertBetaEligibility ?? defaultAssertBetaEligibility)(profileWithRelations);

    if (!isIntelligenceExecutionEnabled()) {
      throw new IntelligenceApiError(
        INTELLIGENCE_API_ERROR.EXECUTION_DISABLED,
        "Intelligence is temporarily unavailable.",
        503,
        requestId,
      );
    }

    assertIntelligenceAskContentType(request, requestId);
    const body = await readIntelligenceAskJsonBody(request, requestId);
    const validated = validateIntelligenceAskRequest(body, requestId);

    const abuseDecision = await deps.abuseControl.check({
      subjectKey: profileWithRelations.profile.id,
      route: INTELLIGENCE_ASK_ROUTE,
    });

    if (!abuseDecision.allowed) {
      throw new IntelligenceApiError(
        INTELLIGENCE_API_ERROR.ABUSE_LIMIT_EXCEEDED,
        abuseDecision.message,
        429,
        requestId,
      );
    }

    const result = await deps.executeIntelligenceRequest({
      question: validated.question,
      providerId: validated.providerId,
    });

    return intelligenceAskServiceResultResponse(result);
  } catch (error: unknown) {
    return intelligenceAskErrorResponse(error, requestId);
  }
}
