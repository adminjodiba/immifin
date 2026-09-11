/**
 * IMMIFIN Intelligence Context public exports (S8-IIP-001).
 *
 * Safe barrel: types, constants, pure assembly, validation.
 * Import the server builder from:
 *   `@/lib/intelligence/context/build-intelligence-context`
 * Do not import the builder from Client Components.
 */

export { assembleIntelligenceContext } from "@/lib/intelligence/context/assemble-intelligence-context";
export {
  INTELLIGENCE_CONTEXT_VERSION,
  INTELLIGENCE_MISSING_FIELD,
  INTELLIGENCE_WARNING,
} from "@/lib/intelligence/context/intelligence-context.constants";
export {
  INTELLIGENCE_CONTEXT_ERROR,
  IntelligenceContextError,
  isIntelligenceContextError,
  type IntelligenceBulletinCutoff,
  type IntelligenceContext,
  type IntelligenceContextErrorCode,
  type IntelligenceContextGreenCard,
  type IntelligenceContextImmigration,
  type IntelligenceContextJourney,
  type IntelligenceContextReadiness,
  type IntelligenceContextReadinessStatus,
  type IntelligenceContextSources,
  type IntelligenceContextSubscription,
  type IntelligenceContextUser,
  type IntelligenceContextVisaBulletin,
  type IntelligenceJourneyKind,
  type IntelligenceVisaBulletinSnapshot,
} from "@/lib/intelligence/context/intelligence-context.types";
export {
  isUtcIso8601Timestamp,
  validateIntelligenceContext,
} from "@/lib/intelligence/context/intelligence-context.validation";
