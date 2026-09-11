/**
 * Client-safe Intelligence Ask response contracts (S8-IIP-009).
 * Mirrors S8-IIP-008 API envelopes without importing server-only modules.
 */

export type IntelligenceAskCompletedClientResult = {
  kind: "completed";
  requestId: string;
  providerId: string;
  answer: string;
  warnings: string[];
};

export type IntelligenceAskNeedsProfileClientResult = {
  kind: "needs_profile_information";
  requestId: string;
  blockingReasons: string[];
  warnings: string[];
};

export type IntelligenceAskClientErrorKind =
  | "unauthenticated"
  | "capability_required"
  | "beta_not_eligible"
  | "validation"
  | "rate_limited"
  | "profile_required"
  | "unavailable"
  | "timeout"
  | "not_configured"
  | "generic";

export type IntelligenceAskClientError = {
  kind: "error";
  errorKind: IntelligenceAskClientErrorKind;
  message: string;
  requestId?: string;
  /** Stable API code when present — not shown as primary UI copy. */
  code?: string;
};

export type IntelligenceAskClientResult =
  | IntelligenceAskCompletedClientResult
  | IntelligenceAskNeedsProfileClientResult
  | IntelligenceAskClientError;

/**
 * Temporary client compatibility field for S8-IIP-008 request validation.
 * Architecture debt: provider selection should remain entirely server-controlled.
 * Do not expose a provider/model selector in the UI.
 */
export const INTELLIGENCE_ASK_CLIENT_PROVIDER_ID = "openai" as const;

export const INTELLIGENCE_ASK_ENDPOINT = "/api/intelligence/ask";
