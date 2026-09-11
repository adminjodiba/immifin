/**
 * Abuse-control boundary for the Intelligence API (S8-IIP-008).
 *
 * Discovery: no approved durable or process-local rate limiter exists for
 * comparable authenticated APIs. This module defines a typed boundary only.
 *
 * Production default is allow-all (not advertised as durable enforcement).
 * Durable multi-instance rate limiting requires a separate infrastructure story.
 * Do not invent commercial usage quotas here.
 */

export type IntelligenceAbuseControlInput = {
  /** Privacy-safe authenticated subject key (internal profile id). Never email. */
  subjectKey: string;
  route: string;
};

export type IntelligenceAbuseControlDecision =
  | { allowed: true }
  | {
      allowed: false;
      code: "INTELLIGENCE_ABUSE_LIMIT_EXCEEDED";
      message: string;
    };

export type IntelligenceAbuseControl = {
  check(
    input: IntelligenceAbuseControlInput,
  ): IntelligenceAbuseControlDecision | Promise<IntelligenceAbuseControlDecision>;
};

/** Default: allow every check. Not durable. Not a commercial quota. */
export function createAllowAllIntelligenceAbuseControl(): IntelligenceAbuseControl {
  return {
    check() {
      return { allowed: true };
    },
  };
}

/** Test helper: deny every check with a stable code. */
export function createDenyingIntelligenceAbuseControl(
  message = "Intelligence request limit exceeded.",
): IntelligenceAbuseControl {
  return {
    check() {
      return {
        allowed: false,
        code: "INTELLIGENCE_ABUSE_LIMIT_EXCEEDED",
        message,
      };
    },
  };
}
