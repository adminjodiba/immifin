/**
 * Authenticated Intelligence API contracts (S8-IIP-008).
 */

import type { IntelligenceProviderId } from "@/lib/intelligence/providers/provider.capabilities";
import type { IntelligenceServiceResult } from "@/lib/intelligence/service/intelligence-service.types";
import type { ProfileWithRelations } from "@/lib/supabase/types";
import type { IntelligenceAbuseControl } from "@/lib/intelligence/api/intelligence-api.abuse";

/** Validated API request body after stripping unexpected fields. */
export type IntelligenceAskApiRequest = {
  question: string;
  providerId: IntelligenceProviderId;
};

export type IntelligenceAskCompletedResponse = {
  ok: true;
  status: "completed";
  requestId: string;
  providerId: IntelligenceProviderId;
  answer: string;
  warnings: string[];
};

export type IntelligenceAskNeedsProfileResponse = {
  ok: false;
  status: "needs_profile_information";
  requestId: string;
  blockingReasons: string[];
  warnings: string[];
};

export type IntelligenceAskErrorBody = {
  ok: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};

export type IntelligenceAskSuccessBody =
  | IntelligenceAskCompletedResponse
  | IntelligenceAskNeedsProfileResponse;

/**
 * Injectable dependencies for deterministic verification.
 * Production defaults are wired in `handle-intelligence-ask.ts` / route.
 */
export type IntelligenceAskHandlerDependencies = {
  requireUser: () => Promise<ProfileWithRelations>;
  assertAiCapability: (profileWithRelations: ProfileWithRelations) => void;
  /** Controlled-beta invite check. Defaults to env allowlist resolver. */
  assertBetaEligibility?: (profileWithRelations: ProfileWithRelations) => void;
  abuseControl: IntelligenceAbuseControl;
  executeIntelligenceRequest: (input: {
    question: string;
    providerId: IntelligenceProviderId;
  }) => Promise<IntelligenceServiceResult>;
  /**
   * When true, Origin header is required and must match the allow-list.
   * Default production behavior requires Origin for browser mutation safety.
   */
  requireOrigin?: boolean;
};
