/**
 * Authenticated Intelligence API constants (S8-IIP-008).
 */

import { INTELLIGENCE_QUESTION_MAX_LENGTH } from "@/lib/intelligence/request/intelligence-request.constants";

/** Reuse S8-IIP-002 question length — do not silently truncate. */
export const INTELLIGENCE_API_QUESTION_MAX_LENGTH = INTELLIGENCE_QUESTION_MAX_LENGTH;

/**
 * Conservative JSON body size for `{ question, providerId }`.
 * Question max is 2,000 characters; overhead for JSON keys/providerId is small.
 */
export const INTELLIGENCE_API_MAX_BODY_BYTES = 8_192;

/** Cache headers for private AI responses. */
export const INTELLIGENCE_API_CACHE_CONTROL = "no-store, private";

/** Route identifier for abuse-control / safe operational context. */
export const INTELLIGENCE_ASK_ROUTE = "POST /api/intelligence/ask";
