/**
 * Pure Intelligence Context assembly (no I/O, not server-gated).
 * Used by the server builder and by deterministic verification scripts.
 */

import { hasCompleteImmigrationProfile } from "@/lib/dashboard/getPersonalDashboardData";
import {
  hasValidGreenCardDate,
  resolveJourneyStage,
  type JourneyStage,
} from "@/lib/dashboard/journeyStage";
import {
  INTELLIGENCE_CONTEXT_VERSION,
  INTELLIGENCE_MISSING_FIELD,
  INTELLIGENCE_WARNING,
} from "@/lib/intelligence/context/intelligence-context.constants";
import type {
  IntelligenceContext,
  IntelligenceContextSources,
  IntelligenceJourneyKind,
} from "@/lib/intelligence/context/intelligence-context.types";
import { validateIntelligenceContext } from "@/lib/intelligence/context/intelligence-context.validation";
import { resolveEntitlementPlan } from "@/lib/account/plan";
import { appPlanToSubscriptionTier } from "@/lib/subscription/plan";
import type { ImmigrationProfile } from "@/lib/supabase/types";

function resolveIntelligenceJourneyKind(
  immigrationProfile: ImmigrationProfile | null,
  stage: JourneyStage,
): IntelligenceJourneyKind {
  if (stage === "green_card_holder") {
    return "green_card_holder";
  }

  if (hasCompleteImmigrationProfile(immigrationProfile)) {
    return "employment_gc_waiting";
  }

  return "incomplete";
}

function collectEmploymentMissingFields(
  immigrationProfile: ImmigrationProfile | null,
): string[] {
  const missing: string[] = [];

  if (!immigrationProfile?.default_country?.trim()) {
    missing.push(INTELLIGENCE_MISSING_FIELD.COUNTRY_OF_CHARGEABILITY);
  }

  if (!immigrationProfile?.default_category?.trim()) {
    missing.push(INTELLIGENCE_MISSING_FIELD.EMPLOYMENT_BASED_CATEGORY);
  }

  if (!immigrationProfile?.priority_date?.trim()) {
    missing.push(INTELLIGENCE_MISSING_FIELD.PRIORITY_DATE);
  }

  return missing;
}

/**
 * Pure / deterministic assembly from preloaded sources.
 * Safe for unit verification without Clerk or network.
 */
export function assembleIntelligenceContext(
  sources: IntelligenceContextSources,
): IntelligenceContext {
  const immigrationProfile = sources.immigrationProfile;
  const stage = resolveJourneyStage(immigrationProfile);
  const journeyKind = resolveIntelligenceJourneyKind(immigrationProfile, stage);
  const isGreenCardHolder = stage === "green_card_holder";
  const greenCardIssueDate = immigrationProfile?.green_card_issue_date?.trim() || null;

  // Effective subscription plan authority (same as assertCapability / account API):
  // resolveEntitlementPlan → appPlanToSubscriptionTier
  const plan = appPlanToSubscriptionTier(
    resolveEntitlementPlan({
      profile: sources.profile,
      subscription: sources.subscription,
      developmentSimulationActive: Boolean(sources.developmentSimulationActive),
    }),
  );

  const warnings: string[] = [
    INTELLIGENCE_WARNING.CURRENT_IMMIGRATION_STATUS_UNAVAILABLE,
  ];

  if (!sources.firstName) {
    warnings.push(INTELLIGENCE_WARNING.FIRST_NAME_UNAVAILABLE);
  }

  const missingRequiredFields: string[] = [];

  if (journeyKind === "incomplete") {
    missingRequiredFields.push(...collectEmploymentMissingFields(immigrationProfile));
  }

  if (journeyKind === "green_card_holder" && !hasValidGreenCardDate(greenCardIssueDate)) {
    missingRequiredFields.push(INTELLIGENCE_MISSING_FIELD.GREEN_CARD_ISSUE_DATE);
  }

  // Explicit non-holder missing issue date — structured warning, not fabricated.
  if (!isGreenCardHolder && !greenCardIssueDate) {
    warnings.push(INTELLIGENCE_WARNING.GREEN_CARD_ISSUE_DATE_ABSENT);
  }

  const visaBulletin = sources.visaBulletin;
  if (visaBulletin?.warnings?.length) {
    warnings.push(...visaBulletin.warnings);
  } else if (!visaBulletin) {
    if (journeyKind === "employment_gc_waiting") {
      warnings.push(INTELLIGENCE_WARNING.FINAL_ACTION_DATE_UNAVAILABLE);
      warnings.push(INTELLIGENCE_WARNING.DATE_FOR_FILING_UNAVAILABLE);
    }
  } else {
    if (!visaBulletin.bulletinMonth) {
      warnings.push(INTELLIGENCE_WARNING.VISA_BULLETIN_MONTH_UNAVAILABLE);
    }
    if (journeyKind === "employment_gc_waiting") {
      if (!visaBulletin.finalActionDate) {
        warnings.push(INTELLIGENCE_WARNING.FINAL_ACTION_DATE_UNAVAILABLE);
      }
      if (!visaBulletin.dateForFiling) {
        warnings.push(INTELLIGENCE_WARNING.DATE_FOR_FILING_UNAVAILABLE);
      }
    }
  }

  const usable = missingRequiredFields.length === 0;

  const context: IntelligenceContext = {
    contextVersion: INTELLIGENCE_CONTEXT_VERSION,
    generatedAt: sources.generatedAt ?? new Date().toISOString(),
    user: {
      firstName: sources.firstName,
    },
    subscription: {
      plan,
    },
    journey: {
      kind: journeyKind,
      stage,
    },
    immigration: {
      countryOfChargeability: immigrationProfile?.default_country?.trim() || null,
      employmentBasedCategory: immigrationProfile?.default_category?.trim() || null,
      priorityDate: immigrationProfile?.priority_date?.trim() || null,
      currentImmigrationStatus: null,
    },
    greenCard: {
      isHolder: isGreenCardHolder,
      issueDate: greenCardIssueDate,
    },
    visaBulletin: {
      bulletinMonth: visaBulletin?.bulletinMonth ?? null,
      finalActionDate:
        journeyKind === "employment_gc_waiting"
          ? (visaBulletin?.finalActionDate ?? null)
          : null,
      dateForFiling:
        journeyKind === "employment_gc_waiting"
          ? (visaBulletin?.dateForFiling ?? null)
          : null,
    },
    readiness: {
      status: usable ? "usable" : "incomplete",
      usable,
      missingRequiredFields,
      warnings: [...new Set(warnings)],
    },
  };

  validateIntelligenceContext(context);
  return context;
}
