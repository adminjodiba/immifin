/**
 * Monthly Immigration Update audience resolution.
 *
 * Summary uses cheap local eligibility only — never full email assembly or
 * per-user Visa Bulletin / Google Sheets movement reads.
 * Send remains authoritative: full personalized assembly per recipient before Resend.
 */

import { readNotificationPreferences } from "@/lib/account/notificationPreferences";
import { isActiveProfileStatus } from "@/lib/auth/roles";
import { hasCompleteImmigrationProfile } from "@/lib/dashboard/getPersonalDashboardData";
import { buildGreenCardJourneyData } from "@/lib/dashboard/journeyDates";
import {
  hasValidGreenCardDate,
  resolveJourneyStage,
} from "@/lib/dashboard/journeyStage";
import {
  isMonthlyUpdateAssemblyError,
  MONTHLY_UPDATE_ASSEMBLY_ERROR,
} from "@/lib/notifications/build-monthly-immigration-report-dashboard-source";
import { canAccessEmailAlerts } from "@/lib/subscription/capabilities";
import { getStoredSubscriptionTier } from "@/lib/subscription/service";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  ImmigrationProfile,
  Profile,
  ProfileWithRelations,
  Subscription,
} from "@/lib/supabase/types";

export type MonthlyUpdateSkipReason =
  | "missing_email"
  | "free_plan"
  | "email_alerts_disabled"
  | "visa_bulletin_updates_disabled"
  | "missing_immigration_profile"
  | "missing_required_data"
  | "unsupported_profile"
  | "assembly_failed";

/** Admin-facing exclusion buckets (counts only — no PII). */
export type MonthlyUpdateExclusionBreakdown = {
  freePlan: number;
  missingImmigrationProfile: number;
  missingRequiredData: number;
  notificationOptOut: number;
  invalidEmail: number;
  unsupportedProfile: number;
};

export type MonthlyUpdateAudienceCandidate = {
  profileWithRelations: ProfileWithRelations;
  tier: "pro" | "power";
};

export type MonthlyUpdateAudienceResolution = {
  sendable: MonthlyUpdateAudienceCandidate[];
  /** Active profiles considered for this campaign (eligible + excluded). */
  activeUserCount: number;
  proCount: number;
  powerCount: number;
  totalRecipients: number;
  skippedCount: number;
  skippedByReason: Partial<Record<MonthlyUpdateSkipReason, number>>;
  exclusionBreakdown: MonthlyUpdateExclusionBreakdown;
};

function mapProfile(row: Record<string, unknown>): Profile {
  return row as Profile;
}

function mapImmigrationProfile(row: Record<string, unknown>): ImmigrationProfile {
  return row as ImmigrationProfile;
}

function mapSubscription(row: Record<string, unknown>): Subscription {
  return row as Subscription;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function incrementSkip(
  skippedByReason: Partial<Record<MonthlyUpdateSkipReason, number>>,
  reason: MonthlyUpdateSkipReason
): void {
  skippedByReason[reason] = (skippedByReason[reason] ?? 0) + 1;
}

function countReason(
  skippedByReason: Partial<Record<MonthlyUpdateSkipReason, number>>,
  reason: MonthlyUpdateSkipReason
): number {
  return skippedByReason[reason] ?? 0;
}

/** Map internal skip reasons → admin exclusion breakdown (always includes all keys). */
export function buildMonthlyUpdateExclusionBreakdown(
  skippedByReason: Partial<Record<MonthlyUpdateSkipReason, number>>
): MonthlyUpdateExclusionBreakdown {
  return {
    freePlan: countReason(skippedByReason, "free_plan"),
    missingImmigrationProfile: countReason(
      skippedByReason,
      "missing_immigration_profile"
    ),
    missingRequiredData: countReason(skippedByReason, "missing_required_data"),
    notificationOptOut:
      countReason(skippedByReason, "email_alerts_disabled") +
      countReason(skippedByReason, "visa_bulletin_updates_disabled"),
    invalidEmail: countReason(skippedByReason, "missing_email"),
    unsupportedProfile:
      countReason(skippedByReason, "unsupported_profile") +
      countReason(skippedByReason, "assembly_failed"),
  };
}

export type MonthlyUpdateSummaryEligibility =
  | { kind: "eligible"; tier: "pro" | "power" }
  | { kind: "skip"; reason: MonthlyUpdateSkipReason };

/** Map send-time assembly errors onto the same skip buckets Summary uses. */
export function skipReasonFromAssemblyError(
  error: unknown
): MonthlyUpdateSkipReason {
  if (!isMonthlyUpdateAssemblyError(error)) {
    return "assembly_failed";
  }

  switch (error.code) {
    case MONTHLY_UPDATE_ASSEMBLY_ERROR.IMMIGRATION_PROFILE_MISSING:
      return "missing_immigration_profile";
    case MONTHLY_UPDATE_ASSEMBLY_ERROR.IMMIGRATION_PROFILE_INCOMPLETE:
      return "missing_required_data";
    case MONTHLY_UPDATE_ASSEMBLY_ERROR.UNSUPPORTED_JOURNEY:
    case MONTHLY_UPDATE_ASSEMBLY_ERROR.PROFILE_INACTIVE:
      return "unsupported_profile";
    case MONTHLY_UPDATE_ASSEMBLY_ERROR.BULLETIN_MONTH_UNAVAILABLE:
      return "assembly_failed";
    default:
      return "unsupported_profile";
  }
}

type ProfileListRow = Profile & {
  subscriptions: Subscription | Subscription[] | null;
  immigration_profiles: ImmigrationProfile | ImmigrationProfile[] | null;
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Load active profiles with subscription + immigration relations (admin/service role).
 */
export async function listActiveProfilesWithRelations(): Promise<
  ProfileWithRelations[]
> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, subscriptions(*), immigration_profiles(*)")
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to list active profiles: ${error.message}`);
  }

  return ((data ?? []) as ProfileListRow[]).map((row) => {
    const subscription = unwrapOne(row.subscriptions);
    const immigrationProfile = unwrapOne(row.immigration_profiles);
    const {
      subscriptions: _subscriptions,
      immigration_profiles: _immigrationProfiles,
      ...profileFields
    } = row;

    return {
      profile: mapProfile(profileFields as unknown as Record<string, unknown>),
      subscription: subscription
        ? mapSubscription(subscription as unknown as Record<string, unknown>)
        : null,
      immigrationProfile: immigrationProfile
        ? mapImmigrationProfile(
            immigrationProfile as unknown as Record<string, unknown>
          )
        : null,
    };
  });
}

function resolvePaidAlertTier(
  profileWithRelations: ProfileWithRelations
): SubscriptionTier | null {
  const tier = getStoredSubscriptionTier({
    profile: profileWithRelations.profile,
    subscription: profileWithRelations.subscription,
  });

  if (!canAccessEmailAlerts(tier)) {
    return null;
  }

  return tier;
}

/**
 * Cheap Summary / preflight eligibility — local profile, plan, prefs, and journey
 * completeness only. Does not assemble Monthly Update emails or read Visa Bulletin
 * movement / Google Sheets.
 */
export function evaluateMonthlyUpdateSummaryEligibility(
  profileWithRelations: ProfileWithRelations
): MonthlyUpdateSummaryEligibility {
  const email = profileWithRelations.profile.email?.trim() ?? "";
  if (!email || !isValidEmail(email)) {
    return { kind: "skip", reason: "missing_email" };
  }

  if (!isActiveProfileStatus(profileWithRelations.profile.status)) {
    return { kind: "skip", reason: "unsupported_profile" };
  }

  const tier = resolvePaidAlertTier(profileWithRelations);
  if (!tier || (tier !== "pro" && tier !== "power")) {
    return { kind: "skip", reason: "free_plan" };
  }

  const prefs = readNotificationPreferences(
    profileWithRelations.immigrationProfile?.preferences
  );
  if (!prefs.emailAlerts) {
    return { kind: "skip", reason: "email_alerts_disabled" };
  }
  if (!prefs.visaBulletinUpdates) {
    return { kind: "skip", reason: "visa_bulletin_updates_disabled" };
  }

  const immigrationProfile = profileWithRelations.immigrationProfile;
  if (!immigrationProfile) {
    return { kind: "skip", reason: "missing_immigration_profile" };
  }

  const journeyStage = resolveJourneyStage(immigrationProfile);
  if (journeyStage === "green_card_holder") {
    if (!hasValidGreenCardDate(immigrationProfile.green_card_issue_date)) {
      return { kind: "skip", reason: "missing_required_data" };
    }
    const journey = buildGreenCardJourneyData(
      immigrationProfile.green_card_issue_date!,
      immigrationProfile.married_to_us_citizen ?? false
    );
    if (!journey) {
      return { kind: "skip", reason: "missing_required_data" };
    }
  } else if (journeyStage === "employment_gc_waiting") {
    if (!hasCompleteImmigrationProfile(immigrationProfile)) {
      return { kind: "skip", reason: "missing_required_data" };
    }
  } else {
    return { kind: "skip", reason: "unsupported_profile" };
  }

  return { kind: "eligible", tier };
}

/**
 * Preflight Pro/Power audience for Summary (and send candidate list).
 * Does not assemble Monthly Update emails. Send must still run full personalized
 * assembly per candidate before Resend.
 */
export async function resolveMonthlyUpdateAudience(): Promise<MonthlyUpdateAudienceResolution> {
  const profiles = await listActiveProfilesWithRelations();
  const sendable: MonthlyUpdateAudienceCandidate[] = [];
  const skippedByReason: Partial<Record<MonthlyUpdateSkipReason, number>> = {};
  let skippedCount = 0;

  for (const profileWithRelations of profiles) {
    const eligibility = evaluateMonthlyUpdateSummaryEligibility(profileWithRelations);
    if (eligibility.kind === "skip") {
      skippedCount += 1;
      incrementSkip(skippedByReason, eligibility.reason);
      continue;
    }

    sendable.push({
      profileWithRelations,
      tier: eligibility.tier,
    });
  }

  const proCount = sendable.filter((item) => item.tier === "pro").length;
  const powerCount = sendable.filter((item) => item.tier === "power").length;
  const exclusionBreakdown = buildMonthlyUpdateExclusionBreakdown(skippedByReason);

  return {
    sendable,
    activeUserCount: profiles.length,
    proCount,
    powerCount,
    totalRecipients: sendable.length,
    skippedCount,
    skippedByReason,
    exclusionBreakdown,
  };
}
