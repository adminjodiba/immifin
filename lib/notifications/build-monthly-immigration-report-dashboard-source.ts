/**
 * Assembles Monthly Immigration Update dashboard source for a target user.
 * Reuses Personalized Dashboard + Movement Tracker engines — no duplicate math.
 * Supported journeys: employment_gc_waiting | green_card_holder.
 */

import {
  formatVisaBulletinMovementLabel,
  buildMonthlyImmigrationReportSubject,
} from "@/emails/templates/monthly-immigration-report-email";
import { isActiveProfileStatus } from "@/lib/auth/roles";
import { hasCompleteImmigrationProfile } from "@/lib/dashboard/getPersonalDashboardData";
import { getDashboardWelcomeName } from "@/lib/dashboard/getOptionalUserProfileForDashboard";
import { buildEmploymentJourneyData } from "@/lib/dashboard/employmentJourney";
import { buildGreenCardJourneyData } from "@/lib/dashboard/journeyDates";
import {
  hasValidGreenCardDate,
  resolveJourneyStage,
} from "@/lib/dashboard/journeyStage";
import {
  mapMonthlyImmigrationReportEmailProps,
  type MonthlyImmigrationReportDashboardSource,
  type VisaBulletinMovementSnapshot,
} from "@/lib/notifications/mappers/map-monthly-immigration-report-email";
import { siteConfig } from "@/lib/site";
import type { ImmigrationProfile, ProfileWithRelations } from "@/lib/supabase/types";
import {
  normalizeSheetCountry,
} from "@/lib/visaBulletinData";
import {
  formatVisaBulletinMonthLong,
  getLatestVisaBulletinMonth,
} from "@/lib/visaBulletinHistory";
import {
  getVisaBulletinMovement,
  type VisaBulletinMovementRow,
} from "@/lib/visaBulletinMovement";

export const MONTHLY_UPDATE_ASSEMBLY_ERROR = {
  USER_NOT_FOUND: "MONTHLY_UPDATE_USER_NOT_FOUND",
  PROFILE_INACTIVE: "MONTHLY_UPDATE_PROFILE_INACTIVE",
  IMMIGRATION_PROFILE_MISSING: "MONTHLY_UPDATE_IMMIGRATION_PROFILE_MISSING",
  IMMIGRATION_PROFILE_INCOMPLETE: "MONTHLY_UPDATE_IMMIGRATION_PROFILE_INCOMPLETE",
  UNSUPPORTED_JOURNEY: "MONTHLY_UPDATE_UNSUPPORTED_JOURNEY",
} as const;

export type MonthlyUpdateAssemblyErrorCode =
  (typeof MONTHLY_UPDATE_ASSEMBLY_ERROR)[keyof typeof MONTHLY_UPDATE_ASSEMBLY_ERROR];

export class MonthlyUpdateAssemblyError extends Error {
  readonly code: MonthlyUpdateAssemblyErrorCode;

  constructor(code: MonthlyUpdateAssemblyErrorCode, message: string) {
    super(message);
    this.name = "MonthlyUpdateAssemblyError";
    this.code = code;
  }
}

export function isMonthlyUpdateAssemblyError(
  error: unknown
): error is MonthlyUpdateAssemblyError {
  return error instanceof MonthlyUpdateAssemblyError;
}

/** Concise admin preview — no HTML / provider payloads. Journey-aware fields. */
export type MonthlyImmigrationUpdatePreviewSummary = {
  recipientEmail: string;
  firstName: string;
  journeyType: "employment_gc_waiting" | "green_card_holder";
  updateMonth: string;
  subject: string;
  /** Employment journey fields (null for green_card_holder). */
  immigrationCategory: string | null;
  chargeabilityCountry: string | null;
  priorityDate: string | null;
  finalActionStatus: string | null;
  dateForFilingStatus: string | null;
  finalActionMovement: string | null;
  dateForFilingMovement: string | null;
  /** Green Card holder fields (null for employment_gc_waiting). */
  greenCardIssueDate: string | null;
  earliestFilingDate: string | null;
  daysRemaining: number | null;
  progressPercent: number | null;
  journeyStatus: string | null;
};

export type MonthlyImmigrationUpdatePrepared = {
  source: MonthlyImmigrationReportDashboardSource;
  preview: MonthlyImmigrationUpdatePreviewSummary;
};

function resolveAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return siteConfig.url.replace(/\/$/, "");
}

/** Match sheet categories like EB-2 to profile values like EB2. */
function categoryMatchKey(category: string): string {
  return category.trim().toLowerCase().replace(/[-\s]/g, "");
}

export function findVisaBulletinMovementForProfile(
  rows: VisaBulletinMovementRow[],
  immigrationProfile: ImmigrationProfile
): VisaBulletinMovementSnapshot | null {
  const category = immigrationProfile.default_category;
  const country = immigrationProfile.default_country;
  if (!category || !country) {
    return null;
  }

  const catKey = categoryMatchKey(category);
  const countryKey = normalizeSheetCountry(country).toLowerCase();

  const row = rows.find(
    (entry) =>
      categoryMatchKey(entry.category) === catKey &&
      normalizeSheetCountry(entry.country).toLowerCase() === countryKey
  );

  if (!row) {
    return null;
  }

  return {
    movementType: row.movementType,
    movementDays: row.movementDays,
    movementLabel: row.movementLabel,
  };
}

export function previousVisaBulletinMonthKey(monthKey: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  const previous = new Date(year, month - 2, 1);
  const previousMonth = String(previous.getMonth() + 1).padStart(2, "0");
  return `${previous.getFullYear()}-${previousMonth}`;
}

function resolveCalendarUpdateMonthLabel(): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

async function resolveComparisonMonthLabel(): Promise<string> {
  const latest = await getLatestVisaBulletinMonth();
  if (!latest) {
    return "Previous month";
  }

  const previousKey = previousVisaBulletinMonthKey(latest);
  if (!previousKey) {
    return "Previous month";
  }

  return formatVisaBulletinMonthLong(previousKey);
}

function buildPreviewSummary(
  recipientEmail: string,
  source: MonthlyImmigrationReportDashboardSource
): MonthlyImmigrationUpdatePreviewSummary {
  const emailProps = mapMonthlyImmigrationReportEmailProps(source);
  const subject = buildMonthlyImmigrationReportSubject(emailProps.updateMonthLabel);

  if (emailProps.journeyType === "green_card_holder") {
    return {
      recipientEmail,
      firstName: emailProps.firstName,
      journeyType: "green_card_holder",
      updateMonth: emailProps.updateMonthLabel,
      subject,
      immigrationCategory: null,
      chargeabilityCountry: null,
      priorityDate: null,
      finalActionStatus: null,
      dateForFilingStatus: null,
      finalActionMovement: null,
      dateForFilingMovement: null,
      greenCardIssueDate: emailProps.greenCardIssueDateDisplay,
      earliestFilingDate: emailProps.earliestFilingDateDisplay,
      daysRemaining: emailProps.daysRemaining,
      progressPercent: emailProps.progressPercent,
      journeyStatus: emailProps.journeyStatusLabel,
    };
  }

  return {
    recipientEmail,
    firstName: emailProps.firstName,
    journeyType: "employment_gc_waiting",
    updateMonth: emailProps.updateMonthLabel,
    subject,
    immigrationCategory: emailProps.immigrationCategory,
    chargeabilityCountry: emailProps.chargeabilityCountry,
    priorityDate: emailProps.priorityDateDisplay,
    finalActionStatus: emailProps.finalActionStatus,
    dateForFilingStatus: emailProps.dateForFilingStatus,
    finalActionMovement: formatVisaBulletinMovementLabel(
      emailProps.finalActionMovementStatus,
      emailProps.finalActionMovementDays
    ),
    dateForFilingMovement: formatVisaBulletinMovementLabel(
      emailProps.dateForFilingMovementStatus,
      emailProps.dateForFilingMovementDays
    ),
    greenCardIssueDate: null,
    earliestFilingDate: null,
    daysRemaining: null,
    progressPercent: null,
    journeyStatus: null,
  };
}

async function assembleEmploymentSource(
  profileWithRelations: ProfileWithRelations,
  immigrationProfile: ImmigrationProfile
): Promise<MonthlyImmigrationReportDashboardSource> {
  if (!hasCompleteImmigrationProfile(immigrationProfile)) {
    throw new MonthlyUpdateAssemblyError(
      MONTHLY_UPDATE_ASSEMBLY_ERROR.IMMIGRATION_PROFILE_INCOMPLETE,
      "Immigration profile is incomplete. Category, chargeability country, and priority date are required."
    );
  }

  const [journey, finalActionRows, filingRows, comparisonMonthLabel] =
    await Promise.all([
      buildEmploymentJourneyData(immigrationProfile),
      getVisaBulletinMovement("final-action"),
      getVisaBulletinMovement("filing"),
      resolveComparisonMonthLabel(),
    ]);

  return {
    journeyType: "employment_gc_waiting",
    firstName: getDashboardWelcomeName(null, profileWithRelations.profile),
    dashboardUrl: `${resolveAppBaseUrl()}/dashboard`,
    journey,
    finalActionMovement: findVisaBulletinMovementForProfile(
      finalActionRows,
      immigrationProfile
    ),
    datesForFilingMovement: findVisaBulletinMovementForProfile(
      filingRows,
      immigrationProfile
    ),
    comparisonMonthLabel,
  };
}

async function assembleGreenCardSource(
  profileWithRelations: ProfileWithRelations,
  immigrationProfile: ImmigrationProfile
): Promise<MonthlyImmigrationReportDashboardSource> {
  if (!hasValidGreenCardDate(immigrationProfile.green_card_issue_date)) {
    throw new MonthlyUpdateAssemblyError(
      MONTHLY_UPDATE_ASSEMBLY_ERROR.IMMIGRATION_PROFILE_INCOMPLETE,
      "Immigration profile is incomplete. Green Card issue date is required for citizenship journey updates."
    );
  }

  const journey = buildGreenCardJourneyData(
    immigrationProfile.green_card_issue_date!,
    immigrationProfile.married_to_us_citizen ?? false
  );

  if (!journey) {
    throw new MonthlyUpdateAssemblyError(
      MONTHLY_UPDATE_ASSEMBLY_ERROR.IMMIGRATION_PROFILE_INCOMPLETE,
      "Unable to build citizenship journey data from this Green Card issue date."
    );
  }

  const updateMonthLabel = resolveCalendarUpdateMonthLabel();

  return {
    journeyType: "green_card_holder",
    firstName: getDashboardWelcomeName(null, profileWithRelations.profile),
    dashboardUrl: `${resolveAppBaseUrl()}/dashboard`,
    journey,
    updateMonthLabel,
  };
}

/**
 * Build dashboard-shaped source + admin preview for one IMMIFIN user.
 * Throws MonthlyUpdateAssemblyError when the user cannot receive this email.
 */
export async function prepareMonthlyImmigrationUpdateForUser(
  profileWithRelations: ProfileWithRelations
): Promise<MonthlyImmigrationUpdatePrepared> {
  const { profile, immigrationProfile } = profileWithRelations;

  if (!isActiveProfileStatus(profile.status)) {
    throw new MonthlyUpdateAssemblyError(
      MONTHLY_UPDATE_ASSEMBLY_ERROR.PROFILE_INACTIVE,
      "This user profile is not active. No email was sent."
    );
  }

  if (!immigrationProfile) {
    throw new MonthlyUpdateAssemblyError(
      MONTHLY_UPDATE_ASSEMBLY_ERROR.IMMIGRATION_PROFILE_MISSING,
      "This user has no immigration profile. Complete category, country, and priority date first."
    );
  }

  const journeyStage = resolveJourneyStage(immigrationProfile);

  let source: MonthlyImmigrationReportDashboardSource;
  if (journeyStage === "green_card_holder") {
    source = await assembleGreenCardSource(
      profileWithRelations,
      immigrationProfile
    );
  } else if (journeyStage === "employment_gc_waiting") {
    source = await assembleEmploymentSource(
      profileWithRelations,
      immigrationProfile
    );
  } else {
    throw new MonthlyUpdateAssemblyError(
      MONTHLY_UPDATE_ASSEMBLY_ERROR.UNSUPPORTED_JOURNEY,
      "Monthly Immigration Update currently supports employment-based Green Card waiting and Green Card holder journeys only."
    );
  }

  return {
    source,
    preview: buildPreviewSummary(profile.email, source),
  };
}
