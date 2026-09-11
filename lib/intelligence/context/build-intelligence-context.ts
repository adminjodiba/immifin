/**
 * IMMIFIN Intelligence Context Builder (S8-IIP-001).
 *
 * Server-only composition layer:
 *   existing auth / profile / subscription / Visa Bulletin services
 *   → Intelligence Context
 *   → future Immigration Intelligence Engine
 *
 * Does not query Supabase directly. Does not grant capabilities. No AI.
 */

import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/auth/requireUser";
import { hasCompleteImmigrationProfile } from "@/lib/dashboard/getPersonalDashboardData";
import { resolveJourneyStage } from "@/lib/dashboard/journeyStage";
import { assembleIntelligenceContext } from "@/lib/intelligence/context/assemble-intelligence-context";
import { INTELLIGENCE_WARNING } from "@/lib/intelligence/context/intelligence-context.constants";
import type {
  IntelligenceContext,
  IntelligenceVisaBulletinSnapshot,
} from "@/lib/intelligence/context/intelligence-context.types";
import {
  INTELLIGENCE_CONTEXT_ERROR,
  IntelligenceContextError,
} from "@/lib/intelligence/context/intelligence-context.types";
import { canUseDevSubscriptionTools } from "@/lib/subscription/devSubscriptionAccess";
import type { ImmigrationProfile } from "@/lib/supabase/types";
import { comparePriorityToBulletin } from "@/lib/visaBulletinData";
import { getLatestVisaBulletinMonth } from "@/lib/visaBulletinHistory";

function resolveFirstName(
  clerkFirstName: string | null | undefined,
  displayName: string | null | undefined,
): string | null {
  const fromClerk = clerkFirstName?.trim();
  if (fromClerk) {
    return fromClerk;
  }

  const fromDisplay = displayName?.trim();
  if (fromDisplay) {
    return fromDisplay.split(/\s+/)[0] ?? null;
  }

  return null;
}

function resolveJourneyKindLabel(
  immigrationProfile: ImmigrationProfile | null,
): "employment_gc_waiting" | "green_card_holder" | "incomplete" {
  const stage = resolveJourneyStage(immigrationProfile);
  if (stage === "green_card_holder") {
    return "green_card_holder";
  }
  if (hasCompleteImmigrationProfile(immigrationProfile)) {
    return "employment_gc_waiting";
  }
  return "incomplete";
}

async function loadVisaBulletinSnapshot(
  immigrationProfile: ImmigrationProfile,
): Promise<IntelligenceVisaBulletinSnapshot> {
  const priorityDate = immigrationProfile.priority_date!;
  const category = immigrationProfile.default_category!;
  const country = immigrationProfile.default_country!;
  const warnings: string[] = [];

  const [finalActionResult, filingResult, monthResult] = await Promise.allSettled([
    comparePriorityToBulletin(priorityDate, category, country, "final-action"),
    comparePriorityToBulletin(priorityDate, category, country, "filing"),
    getLatestVisaBulletinMonth(),
  ]);

  const finalActionFailed = finalActionResult.status === "rejected";
  const filingFailed = filingResult.status === "rejected";

  if (finalActionFailed && filingFailed) {
    const reason =
      finalActionResult.reason instanceof Error
        ? finalActionResult.reason.message
        : "Unable to load Visa Bulletin cutoff data.";

    throw new IntelligenceContextError(
      INTELLIGENCE_CONTEXT_ERROR.VISA_BULLETIN_UNAVAILABLE,
      reason,
    );
  }

  let finalActionDate: string | null = null;
  let dateForFiling: string | null = null;
  let bulletinMonth: string | null = null;

  if (finalActionResult.status === "fulfilled") {
    finalActionDate = finalActionResult.value.cutoffDate;
  } else {
    warnings.push(INTELLIGENCE_WARNING.FINAL_ACTION_DATE_UNAVAILABLE);
  }

  if (filingResult.status === "fulfilled") {
    dateForFiling = filingResult.value.cutoffDate;
  } else {
    warnings.push(INTELLIGENCE_WARNING.DATE_FOR_FILING_UNAVAILABLE);
  }

  if (monthResult.status === "fulfilled" && monthResult.value) {
    bulletinMonth = monthResult.value;
  } else {
    warnings.push(INTELLIGENCE_WARNING.VISA_BULLETIN_MONTH_UNAVAILABLE);
  }

  return {
    bulletinMonth,
    finalActionDate,
    dateForFiling,
    warnings,
  };
}

async function loadBulletinMonthOnly(): Promise<IntelligenceVisaBulletinSnapshot> {
  const warnings: string[] = [];

  try {
    const bulletinMonth = await getLatestVisaBulletinMonth();
    if (!bulletinMonth) {
      warnings.push(INTELLIGENCE_WARNING.VISA_BULLETIN_MONTH_UNAVAILABLE);
    }
    return {
      bulletinMonth,
      finalActionDate: null,
      dateForFiling: null,
      warnings,
    };
  } catch {
    warnings.push(INTELLIGENCE_WARNING.VISA_BULLETIN_MONTH_UNAVAILABLE);
    return {
      bulletinMonth: null,
      finalActionDate: null,
      dateForFiling: null,
      warnings,
    };
  }
}

/**
 * Server-side builder for the authenticated IMMIFIN user.
 *
 * Propagates authentication failures from `requireUser`.
 * Propagates Visa Bulletin infrastructure failures for complete employment profiles
 * as `IntelligenceContextError` (not as incomplete profile data).
 */
export async function buildIntelligenceContext(): Promise<IntelligenceContext> {
  const [profileWithRelations, clerkUser] = await Promise.all([
    requireUser(),
    currentUser(),
  ]);

  const { profile, immigrationProfile, subscription } = profileWithRelations;
  const firstName = resolveFirstName(clerkUser?.firstName, profile.display_name);
  const journeyKind = resolveJourneyKindLabel(immigrationProfile);

  let visaBulletin: IntelligenceVisaBulletinSnapshot | null = null;

  if (
    journeyKind === "employment_gc_waiting" &&
    immigrationProfile &&
    hasCompleteImmigrationProfile(immigrationProfile)
  ) {
    visaBulletin = await loadVisaBulletinSnapshot(immigrationProfile);
  } else if (journeyKind === "green_card_holder") {
    visaBulletin = await loadBulletinMonthOnly();
  }

  return assembleIntelligenceContext({
    firstName,
    profile,
    immigrationProfile,
    subscription,
    visaBulletin,
    developmentSimulationActive: canUseDevSubscriptionTools(profile.clerk_user_id),
  });
}
