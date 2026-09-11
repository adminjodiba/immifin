/**

 * Intelligence controlled-beta eligibility exports (S8-IIP-011).

 * Server-side only for enforcement — do not import from Client Components

 * for authoritative decisions. The resolver itself is pure and safe to unit-test.

 */



export {

  INTELLIGENCE_BETA_USER_IDS_ENV,

  parseIntelligenceBetaAllowlist,

  resolveIntelligenceBetaEligibility,

  type IntelligenceBetaEligibility,

} from "@/lib/intelligence/beta/intelligence-beta-eligibility";


