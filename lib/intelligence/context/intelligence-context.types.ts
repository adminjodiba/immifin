/**
 * IMMIFIN Intelligence Context — Version 1 contract types.
 *
 * Factual / deterministic context only. No AI decisions, advice, or scores.
 */

import type { JourneyStage } from "@/lib/dashboard/journeyStage";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import type {
  ImmigrationProfile,
  Profile,
  Subscription,
} from "@/lib/supabase/types";

/**
 * Intelligence journey kind for Version 1.
 *
 * Composed from authoritative helpers:
 * - `resolveJourneyStage` (green card holder vs employment waiting)
 * - `hasCompleteImmigrationProfile` (incomplete employment profile)
 *
 * This is not a second journey authority and does not replace JourneyStage.
 */
export type IntelligenceJourneyKind =
  | "employment_gc_waiting"
  | "green_card_holder"
  | "incomplete";

export type IntelligenceContextReadinessStatus = "usable" | "incomplete";

/**
 * Raw Visa Bulletin cutoff values used by IMMIFIN live bulletin services:
 * - "C" = Current
 * - "U" = Unavailable
 * - YYYY-MM-DD civil date
 */
export type IntelligenceBulletinCutoff = string;

export type IntelligenceContextUser = {
  firstName: string | null;
};

export type IntelligenceContextSubscription = {
  /**
   * Effective subscription plan (`free` | `pro` | `power`).
   *
   * Resolved by IMMIFIN entitlement authority:
   * `resolveEntitlementPlan` (Dev simulation when authorized) or `getEffectivePlan`,
   * then `appPlanToSubscriptionTier`.
   * This is not a raw persisted `profile.plan` passthrough.
   */
  plan: SubscriptionTier;
};

export type IntelligenceContextJourney = {
  kind: IntelligenceJourneyKind;
  /** Authoritative dashboard journey stage from `resolveJourneyStage`. */
  stage: JourneyStage;
};

export type IntelligenceContextImmigration = {
  countryOfChargeability: string | null;
  employmentBasedCategory: string | null;
  priorityDate: string | null;
  /**
   * IMMIFIN does not currently persist a dedicated current-immigration-status
   * field. Always null in Version 1; see readiness.warnings.
   */
  currentImmigrationStatus: null;
};

export type IntelligenceContextGreenCard = {
  isHolder: boolean;
  issueDate: string | null;
};

export type IntelligenceContextVisaBulletin = {
  /** Latest archived bulletin month (YYYY-MM), or null when unavailable. */
  bulletinMonth: string | null;
  finalActionDate: IntelligenceBulletinCutoff | null;
  dateForFiling: IntelligenceBulletinCutoff | null;
};

export type IntelligenceContextReadiness = {
  status: IntelligenceContextReadinessStatus;
  /** True when Version 1 personalization inputs are sufficient for the journey. */
  usable: boolean;
  missingRequiredFields: string[];
  warnings: string[];
};

export type IntelligenceContext = {
  contextVersion: string;
  /** UTC ISO-8601 timestamp from `Date.prototype.toISOString()`. */
  generatedAt: string;
  user: IntelligenceContextUser;
  subscription: IntelligenceContextSubscription;
  journey: IntelligenceContextJourney;
  immigration: IntelligenceContextImmigration;
  greenCard: IntelligenceContextGreenCard;
  visaBulletin: IntelligenceContextVisaBulletin;
  readiness: IntelligenceContextReadiness;
};

/** Optional Visa Bulletin snapshot supplied by the server builder or tests. */
export type IntelligenceVisaBulletinSnapshot = {
  bulletinMonth: string | null;
  finalActionDate: IntelligenceBulletinCutoff | null;
  dateForFiling: IntelligenceBulletinCutoff | null;
  warnings?: string[];
};

/**
 * Pure assembly inputs. Callers obtain profile/subscription via existing
 * services (e.g. `requireUser`) — never query Supabase from this module.
 */
export type IntelligenceContextSources = {
  firstName: string | null;
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
  subscription: Subscription | null;
  visaBulletin: IntelligenceVisaBulletinSnapshot | null;
  /**
   * When true, entitlement uses stored simulated plan (authorized Dev Mode).
   * Defaults to false (normal Stripe-aware effective plan).
   */
  developmentSimulationActive?: boolean;
  /** Injectable for deterministic tests; defaults to `new Date().toISOString()`. */
  generatedAt?: string;
};

export const INTELLIGENCE_CONTEXT_ERROR = {
  VISA_BULLETIN_UNAVAILABLE: "INTELLIGENCE_CONTEXT_VISA_BULLETIN_UNAVAILABLE",
} as const;

export type IntelligenceContextErrorCode =
  (typeof INTELLIGENCE_CONTEXT_ERROR)[keyof typeof INTELLIGENCE_CONTEXT_ERROR];

export class IntelligenceContextError extends Error {
  readonly code: IntelligenceContextErrorCode;

  constructor(code: IntelligenceContextErrorCode, message: string) {
    super(message);
    this.name = "IntelligenceContextError";
    this.code = code;
  }
}

export function isIntelligenceContextError(
  error: unknown,
): error is IntelligenceContextError {
  return error instanceof IntelligenceContextError;
}
