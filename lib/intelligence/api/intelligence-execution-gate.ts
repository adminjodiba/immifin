/**
 * Server-controlled Intelligence execution kill switch (S8-IIP-010).
 *
 * Env: IMMIFIN_INTELLIGENCE_ENABLED
 * - unset / any value other than "false" → execution allowed
 * - exactly "false" → Intelligence Ask returns a safe unavailable response
 *
 * Does not affect public pages, login, pricing, Stripe, or notifications.
 * Never expose this as NEXT_PUBLIC_.
 */

export const INTELLIGENCE_ENABLED_ENV = "IMMIFIN_INTELLIGENCE_ENABLED";

/**
 * Whether Intelligence Ask may execute providers.
 * Operators disable by setting IMMIFIN_INTELLIGENCE_ENABLED=false.
 */
export function isIntelligenceExecutionEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env[INTELLIGENCE_ENABLED_ENV]?.trim() !== "false";
}
