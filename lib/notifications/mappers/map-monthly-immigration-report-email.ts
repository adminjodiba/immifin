/**
 * Dashboard → Monthly Immigration Update email props mapper.
 *
 * Presentation mapping only. Does not recalculate eligibility, movement,
 * or journey meaning — those come from the Personalized Dashboard layer.
 * Journey-aware: employment_gc_waiting | green_card_holder.
 */

import { resolveEmploymentTodaysFocus } from "@/lib/dashboard/dashboardFocusAndActions";
import type { EmploymentJourneyData } from "@/lib/dashboard/employmentJourney";
import type {
  DashboardEligibilityStatus,
  GreenCardJourneyData,
} from "@/lib/dashboard/journeyDates";
import type {
  MovementType,
  VisaBulletinMovementRow,
} from "@/lib/visaBulletinMovement";
import {
  VISA_BULLETIN_MOVEMENT_STATUSES,
  type MonthlyImmigrationReportEmailProps,
  type VisaBulletinMovementStatus,
} from "@/emails/templates/monthly-immigration-report-email";

/** Already-computed movement snapshot from `getVisaBulletinMovement` / compareBulletinMovement. */
export type VisaBulletinMovementSnapshot = Pick<
  VisaBulletinMovementRow,
  "movementType" | "movementDays" | "movementLabel"
>;

type MonthlyUpdateSourceBase = {
  firstName: string;
  dashboardUrl: string;
};

/** Employment-based Green Card waiting — Visa Bulletin journey. */
export type EmploymentMonthlyImmigrationReportDashboardSource =
  MonthlyUpdateSourceBase & {
    journeyType: "employment_gc_waiting";
    journey: EmploymentJourneyData;
    /** MoM Final Action movement for the user's category/country (dashboard engine). */
    finalActionMovement: VisaBulletinMovementSnapshot | null;
    /** MoM Dates for Filing movement for the user's category/country (dashboard engine). */
    datesForFilingMovement: VisaBulletinMovementSnapshot | null;
    /** Previous bulletin month display label, e.g. "June 2026". */
    comparisonMonthLabel: string;
  };

/** Green Card holder — Citizenship / N-400 journey. */
export type GreenCardMonthlyImmigrationReportDashboardSource =
  MonthlyUpdateSourceBase & {
    journeyType: "green_card_holder";
    journey: GreenCardJourneyData;
    /** Display month for subject / hero, e.g. "July 2026". */
    updateMonthLabel: string;
  };

/**
 * Dashboard-shaped source for the Monthly Immigration Update.
 * Assemble via dashboard journey builders — never invent immigration values here.
 */
export type MonthlyImmigrationReportDashboardSource =
  | EmploymentMonthlyImmigrationReportDashboardSource
  | GreenCardMonthlyImmigrationReportDashboardSource;

/** Map Movement Tracker types → email presentation statuses (no recalculation). */
export function mapMovementTypeToEmailStatus(
  movementType: MovementType | null | undefined
): VisaBulletinMovementStatus {
  switch (movementType) {
    case "forward":
    case "current":
      return VISA_BULLETIN_MOVEMENT_STATUSES.ADVANCED;
    case "retrogression":
      return VISA_BULLETIN_MOVEMENT_STATUSES.RETROGRESSED;
    case "no-change":
    case "unavailable":
    case "invalid":
    default:
      return VISA_BULLETIN_MOVEMENT_STATUSES.UNCHANGED;
  }
}

function movementDaysForEmail(
  snapshot: VisaBulletinMovementSnapshot | null
): number {
  if (!snapshot || snapshot.movementDays == null) {
    return 0;
  }
  return Math.abs(Math.trunc(snapshot.movementDays));
}

/**
 * Compose the highlight banner from dashboard status + movement labels.
 * Uses precomputed `movementLabel` / status — does not recompute MoM deltas.
 */
export function mapMonthlyHighlight(
  journey: EmploymentJourneyData,
  finalActionMovement: VisaBulletinMovementSnapshot | null
): string {
  const movementPhrase = finalActionMovement
    ? `Final Action ${finalActionMovement.movementLabel}`
    : "Final Action movement is unavailable";

  const casePhrase = journey.finalAction.isPositive
    ? "Your Final Action date has reached your Priority Date."
    : `Your case is still ${journey.finalAction.statusLabel.toLowerCase()}.`;

  return `This month: ${movementPhrase}. ${casePhrase}`;
}

/** Email-facing journey status labels (presentation only). */
export function mapGreenCardJourneyStatusLabel(
  status: DashboardEligibilityStatus
): string {
  switch (status) {
    case "eligible_now":
      return "Eligible Now";
    case "filing_window_open":
      return "Eligible Soon";
    case "not_eligible_yet":
    default:
      return "On Track";
  }
}

export function mapGreenCardNextMilestone(
  status: DashboardEligibilityStatus
): string {
  switch (status) {
    case "eligible_now":
      return "File N-400 application";
    case "filing_window_open":
      return "Prepare and file N-400";
    case "not_eligible_yet":
    default:
      return "Earliest N-400 filing date";
  }
}

export function mapGreenCardMonthlyHighlight(
  journey: GreenCardJourneyData
): string {
  if (journey.eligibilityStatus === "eligible_now") {
    return "This month: You are eligible to begin preparing your N-400 application.";
  }
  if (journey.eligibilityStatus === "filing_window_open") {
    return "This month: Your earliest N-400 filing window is open.";
  }
  const days = journey.summary.daysRemaining;
  return `This month: ${days} day${days === 1 ? "" : "s"} remaining until your earliest N-400 filing date.`;
}

/**
 * Concise Card 3 advisor copy from dashboard citizenship metrics.
 * Presentation composition only — does not recalculate dates.
 */
export function mapGreenCardAdvisorSummary(
  journey: GreenCardJourneyData
): string {
  if (journey.eligibilityStatus === "eligible_now") {
    return "Congratulations! You are now eligible to begin preparing your N-400 application.";
  }
  if (journey.eligibilityStatus === "filing_window_open") {
    return "Congratulations! You may now be within your earliest naturalization filing window. Review your eligibility and begin preparing your N-400 application.";
  }

  const days = journey.summary.daysRemaining;
  return `Your citizenship journey is progressing as expected. You are approximately ${days} day${days === 1 ? "" : "s"} away from your earliest N-400 filing date. No action is required this month.`;
}

function mapEmploymentMonthlyImmigrationReportEmailProps(
  source: EmploymentMonthlyImmigrationReportDashboardSource
): MonthlyImmigrationReportEmailProps {
  const { journey } = source;
  const todaysFocus = resolveEmploymentTodaysFocus(journey);

  return {
    journeyType: "employment_gc_waiting",
    firstName: source.firstName.trim() || "there",
    dashboardUrl: source.dashboardUrl,
    updateMonthLabel: journey.bulletinMonthLabel,
    monthlyHighlight: mapMonthlyHighlight(journey, source.finalActionMovement),
    immigrationCategory: journey.categoryLabel?.trim() || "Unavailable",
    chargeabilityCountry: journey.countryLabel?.trim() || "Unavailable",
    priorityDateDisplay: journey.priorityDateFormatted,
    finalActionDateDisplay: journey.finalAction.cutoffFormatted,
    finalActionStatus: journey.finalAction.statusLabel,
    dateForFilingDisplay: journey.datesForFiling.cutoffFormatted,
    dateForFilingStatus: journey.datesForFiling.statusLabel,
    journeyMeaningText: journey.finalAction.meaningMessage,
    advisorSummaryText: todaysFocus.message,
    comparisonMonth: source.comparisonMonthLabel,
    finalActionMovementDays: movementDaysForEmail(source.finalActionMovement),
    finalActionMovementStatus: mapMovementTypeToEmailStatus(
      source.finalActionMovement?.movementType
    ),
    dateForFilingMovementDays: movementDaysForEmail(
      source.datesForFilingMovement
    ),
    dateForFilingMovementStatus: mapMovementTypeToEmailStatus(
      source.datesForFilingMovement?.movementType
    ),
  };
}

function mapGreenCardMonthlyImmigrationReportEmailProps(
  source: GreenCardMonthlyImmigrationReportDashboardSource
): MonthlyImmigrationReportEmailProps {
  const { journey } = source;
  const daysRemaining = journey.summary.daysRemaining;
  const progressPercent = journey.summary.progressPercent;

  return {
    journeyType: "green_card_holder",
    firstName: source.firstName.trim() || "there",
    dashboardUrl: source.dashboardUrl,
    updateMonthLabel: source.updateMonthLabel,
    monthlyHighlight: mapGreenCardMonthlyHighlight(journey),
    greenCardIssueDateDisplay: journey.greenCardIssueDateFormatted,
    earliestFilingDateDisplay: journey.earliestFilingDateFormatted,
    daysRemaining,
    daysRemainingDisplay:
      daysRemaining === 0
        ? "You can file now"
        : `${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
    progressPercent,
    journeyStatusLabel: mapGreenCardJourneyStatusLabel(
      journey.eligibilityStatus
    ),
    todayDisplay: journey.todayFormatted,
    nextMilestoneLabel: mapGreenCardNextMilestone(journey.eligibilityStatus),
    advisorSummaryText: mapGreenCardAdvisorSummary(journey),
  };
}

/**
 * Convert Personalized Dashboard data into Monthly Immigration Update template props.
 * Read-only presentation mapping — no immigration business calculations.
 */
export function mapMonthlyImmigrationReportEmailProps(
  source: MonthlyImmigrationReportDashboardSource
): MonthlyImmigrationReportEmailProps {
  if (source.journeyType === "green_card_holder") {
    return mapGreenCardMonthlyImmigrationReportEmailProps(source);
  }
  return mapEmploymentMonthlyImmigrationReportEmailProps(source);
}
