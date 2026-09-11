/**

 * Controlled-beta eligibility for IMMIFIN Intelligence (S8-IIP-011).

 *

 * Temporary server-only allowlist via IMMIFIN_INTELLIGENCE_BETA_USER_IDS

 * (comma-separated Clerk user IDs). Fails closed when unset or empty.

 *

 * Does not replace accessAI. Does not log allowlist contents or user IDs.

 * Never expose as NEXT_PUBLIC_.

 */



export const INTELLIGENCE_BETA_USER_IDS_ENV = "IMMIFIN_INTELLIGENCE_BETA_USER_IDS";



export type IntelligenceBetaEligibility =

  | { eligible: true }

  | {

      eligible: false;

      reason: "beta_not_enabled" | "user_not_invited" | "configuration_unavailable";

    };



/**

 * Parse the temporary beta allowlist.

 * Returns null when the variable is unset or blank (configuration unavailable).

 */

export function parseIntelligenceBetaAllowlist(

  raw: string | undefined,

): string[] | null {

  if (raw === undefined) {

    return null;

  }

  const trimmed = raw.trim();

  if (trimmed.length === 0) {

    return null;

  }

  return trimmed

    .split(",")

    .map((entry) => entry.trim())

    .filter((entry) => entry.length > 0);

}



/**

 * Resolve whether a Clerk user is invited to the Intelligence controlled beta.

 * Fail closed: missing/blank allowlist → not eligible.

 */

export function resolveIntelligenceBetaEligibility(

  clerkUserId: string,

  env: NodeJS.ProcessEnv = process.env,

): IntelligenceBetaEligibility {

  const allowlist = parseIntelligenceBetaAllowlist(env[INTELLIGENCE_BETA_USER_IDS_ENV]);



  if (allowlist === null) {

    return { eligible: false, reason: "configuration_unavailable" };

  }



  if (allowlist.length === 0) {

    return { eligible: false, reason: "beta_not_enabled" };

  }



  const normalizedId = typeof clerkUserId === "string" ? clerkUserId.trim() : "";

  if (!normalizedId) {

    return { eligible: false, reason: "user_not_invited" };

  }



  if (!allowlist.includes(normalizedId)) {

    return { eligible: false, reason: "user_not_invited" };

  }



  return { eligible: true };

}


