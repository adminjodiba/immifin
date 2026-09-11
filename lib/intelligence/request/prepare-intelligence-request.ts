/**
 * IMMIFIN Intelligence Request Envelope preparer (S8-IIP-002).
 *
 * Server-only orchestration:
 *   validate question
 *   → buildIntelligenceContext()
 *   → Intelligence Request Envelope
 *   → future Immigration Intelligence Engine
 *
 * Does not query Supabase, grant capabilities, call AI, persist, or log.
 */

import "server-only";

import { buildIntelligenceContext } from "@/lib/intelligence/context/build-intelligence-context";
import { assembleIntelligenceRequest } from "@/lib/intelligence/request/assemble-intelligence-request";
import type { IntelligenceRequest } from "@/lib/intelligence/request/intelligence-request.types";
import { validateIntelligenceQuestion } from "@/lib/intelligence/request/intelligence-request.validation";

/**
 * Prepare a Version 1 Intelligence Request Envelope for the authenticated user.
 *
 * - Validates the question before loading context.
 * - Consumes the approved `buildIntelligenceContext()` export (auth boundary).
 * - Propagates AuthError and IntelligenceContextError unchanged.
 * - Throws IntelligenceRequestError for invalid questions.
 */
export async function prepareIntelligenceRequest(
  question: unknown,
): Promise<IntelligenceRequest> {
  const validatedQuestion = validateIntelligenceQuestion(question);
  const context = await buildIntelligenceContext();

  return assembleIntelligenceRequest({
    question: validatedQuestion,
    context,
  });
}
