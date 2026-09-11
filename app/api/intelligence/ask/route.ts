/**
 * Authenticated Intelligence Ask API (S8-IIP-008).
 *
 * POST only. Enforces Clerk auth + `accessAI` (Power) before delegating to
 * the S8-IIP-007 Intelligence Service. No chat UI, streaming, or persistence.
 */

import { NextResponse } from "next/server";
import {
  createDefaultIntelligenceAskHandlerDependencies,
  handleIntelligenceAsk,
} from "@/lib/intelligence/api/handle-intelligence-ask";
import { executeIntelligenceRequest } from "@/lib/intelligence/service/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const deps = createDefaultIntelligenceAskHandlerDependencies((input) =>
    executeIntelligenceRequest(input),
  );
  return handleIntelligenceAsk(request, deps);
}
