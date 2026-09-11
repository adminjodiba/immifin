/**
 * Same-origin / Origin allow-list for Intelligence API mutations (S8-IIP-008).
 *
 * Existing authenticated JSON APIs (favorites, profile, checkout) do not validate
 * Origin today; Clerk session cookies + no permissive CORS are the baseline.
 * This route adds an explicit Origin allow-list for defense-in-depth when the
 * browser sends an Origin header (typical for POST from web apps).
 *
 * No Access-Control-Allow-Origin headers are set (no CORS).
 */

import {
  INTELLIGENCE_API_ERROR,
  IntelligenceApiError,
} from "@/lib/intelligence/api/intelligence-api.errors";

function normalizeOrigin(value: string): string {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

/**
 * Approved browser origins for Intelligence API POST.
 * Includes localhost, development tunnel, and production hosts.
 */
export function getIntelligenceApiAllowedOrigins(
  env: NodeJS.ProcessEnv = process.env,
): Set<string> {
  const origins = new Set<string>([
    "http://localhost:3000",
    "https://dev.immifin.com",
    "https://immifin.com",
    "https://www.immifin.com",
  ]);

  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    origins.add(normalizeOrigin(appUrl));
  }

  return origins;
}

/**
 * Validate Origin when present (or required).
 * Non-browser clients that omit Origin are allowed unless requireOrigin is true.
 */
export function assertIntelligenceAskOrigin(
  request: Request,
  options: {
    requireOrigin?: boolean;
    env?: NodeJS.ProcessEnv;
    requestId?: string;
  } = {},
): void {
  const originHeader = request.headers.get("origin");
  const requireOrigin = options.requireOrigin ?? false;

  if (!originHeader) {
    if (requireOrigin) {
      throw new IntelligenceApiError(
        INTELLIGENCE_API_ERROR.ORIGIN_REJECTED,
        "Request origin is required.",
        403,
        options.requestId,
      );
    }
    return;
  }

  const allowed = getIntelligenceApiAllowedOrigins(options.env);
  const normalized = normalizeOrigin(originHeader);

  if (!allowed.has(normalized)) {
    throw new IntelligenceApiError(
      INTELLIGENCE_API_ERROR.ORIGIN_REJECTED,
      "Request origin is not allowed.",
      403,
      options.requestId,
    );
  }
}
