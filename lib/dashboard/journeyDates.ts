import {
  calculateCitizenshipEligibility,
  formatEligibilityDate,
  type CitizenshipEligibilityResult,
} from "@/lib/citizenship-eligibility";
import { formatDisplayDate } from "@/lib/dashboard/formatProfileLabels";

export type DashboardEligibilityStatus =
  | "not_eligible_yet"
  | "filing_window_open"
  | "eligible_now";

export type JourneyProgress = {
  fillPercent: number;
  todayPercent: number;
  todayMarkerPercent: number;
};

export type JourneySummaryMetrics = {
  daysCompleted: number;
  daysCompletedDuration: string;
  totalRequiredDays: number;
  daysRemaining: number;
  progressPercent: number;
};

export type GreenCardJourneyData = {
  greenCardIssueDate: string;
  greenCardIssueDateFormatted: string;
  todayFormatted: string;
  earliestFilingDateFormatted: string;
  eligibilityDateFormatted: string;
  yearsAsPermanentResident: string;
  daysUntilEligible: number;
  eligibilityStatus: DashboardEligibilityStatus;
  eligibilityStatusLabel: string;
  progress: JourneyProgress;
  summary: JourneySummaryMetrics;
  waitingPeriodYears: 3 | 5;
  waitingPeriodDescription: string;
  citizenshipResult: CitizenshipEligibilityResult;
};

function parseLocalDate(value: string): Date {
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function calculateEarliestN400Date(
  greenCardDate: string,
  marriedToUSCitizen = false,
): Date | null {
  const result = calculateCitizenshipEligibility(greenCardDate, marriedToUSCitizen);
  return result?.earliestFilingDate ?? null;
}

export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function calculateDaysUntil(targetDate: Date, fromDate: Date = startOfToday()): number {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - from.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function calculateYearsMonthsDaysSince(
  startDate: string,
  endDate: Date = startOfToday(),
): string {
  const start = parseLocalDate(startDate);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (end < start) {
    return "0 days";
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} year${years === 1 ? "" : "s"}`);
  }

  if (months > 0) {
    parts.push(`${months} month${months === 1 ? "" : "s"}`);
  }

  if (parts.length === 0) {
    const diffDays = Math.max(
      0,
      Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
  }

  return parts.join(", ");
}

const MARKER_MIN_PERCENT = 0;
const MARKER_MAX_PERCENT = 100;

/** Keep markers on the true timeline; label edge-clipping is handled in the UI. */
export function clampTimelineMarkerPercent(percent: number): number {
  return Math.min(MARKER_MAX_PERCENT, Math.max(MARKER_MIN_PERCENT, percent));
}

export function calculateJourneyProgress(
  startDate: Date,
  endDate: Date,
  today: Date = startOfToday(),
): JourneyProgress {
  const daysCompleted = calculateDaysBetween(startDate, today);
  const totalRequiredDays = calculateDaysBetween(startDate, endDate);

  if (totalRequiredDays <= 0) {
    return { fillPercent: 100, todayPercent: 100, todayMarkerPercent: 100 };
  }

  const todayPercent = Math.min(
    100,
    Math.max(0, (daysCompleted / totalRequiredDays) * 100),
  );
  const fillPercent = today.getTime() >= endDate.getTime() ? 100 : todayPercent;

  return {
    fillPercent,
    todayPercent,
    todayMarkerPercent: clampTimelineMarkerPercent(todayPercent),
  };
}

function buildJourneySummary(
  greenCardIssueDate: string,
  greenCardDate: Date,
  earliestFilingDate: Date,
  today: Date,
  canFileNow: boolean,
): JourneySummaryMetrics {
  const daysCompleted = calculateDaysBetween(greenCardDate, today);
  const totalRequiredDays = calculateDaysBetween(greenCardDate, earliestFilingDate);
  const daysRemaining = canFileNow
    ? 0
    : Math.max(0, calculateDaysUntil(earliestFilingDate, today));
  const progressPercent =
    totalRequiredDays > 0
      ? Math.min(100, Math.max(0, Math.round((daysCompleted / totalRequiredDays) * 100)))
      : 100;

  return {
    daysCompleted,
    daysCompletedDuration: calculateYearsMonthsDaysSince(greenCardIssueDate, today),
    totalRequiredDays,
    daysRemaining,
    progressPercent,
  };
}

function getWaitingPeriodDescription(waitingPeriodYears: 3 | 5): string {
  return waitingPeriodYears === 3 ? "3 years minus 90 days" : "5 years minus 90 days";
}

function resolveDashboardEligibilityStatus(
  result: CitizenshipEligibilityResult,
): { status: DashboardEligibilityStatus; label: string } {
  if (result.isEligibleNow) {
    return { status: "eligible_now", label: "Eligible now" };
  }

  if (result.canFileNow) {
    return { status: "filing_window_open", label: "Filing window open" };
  }

  return { status: "not_eligible_yet", label: "Not eligible yet" };
}

export function buildGreenCardJourneyData(
  greenCardIssueDate: string,
  marriedToUSCitizen: boolean,
): GreenCardJourneyData | null {
  const citizenshipResult = calculateCitizenshipEligibility(
    greenCardIssueDate,
    marriedToUSCitizen,
  );

  if (!citizenshipResult) {
    return null;
  }

  const greenCardDate = parseLocalDate(greenCardIssueDate);
  const today = startOfToday();
  const { status, label } = resolveDashboardEligibilityStatus(citizenshipResult);
  const daysUntilEligible = Math.max(
    0,
    calculateDaysUntil(citizenshipResult.earliestFilingDate, today),
  );
  const progress = calculateJourneyProgress(
    greenCardDate,
    citizenshipResult.earliestFilingDate,
    today,
  );
  const summary = buildJourneySummary(
    greenCardIssueDate,
    greenCardDate,
    citizenshipResult.earliestFilingDate,
    today,
    citizenshipResult.canFileNow,
  );

  return {
    greenCardIssueDate,
    greenCardIssueDateFormatted: formatDisplayDate(greenCardIssueDate) ?? greenCardIssueDate,
    todayFormatted: formatEligibilityDate(today),
    earliestFilingDateFormatted: formatEligibilityDate(citizenshipResult.earliestFilingDate),
    eligibilityDateFormatted: formatEligibilityDate(citizenshipResult.eligibilityDate),
    yearsAsPermanentResident: calculateYearsMonthsDaysSince(greenCardIssueDate, today),
    daysUntilEligible: citizenshipResult.canFileNow ? 0 : daysUntilEligible,
    eligibilityStatus: status,
    eligibilityStatusLabel: label,
    progress,
    summary,
    waitingPeriodYears: citizenshipResult.waitingPeriodYears,
    waitingPeriodDescription: getWaitingPeriodDescription(
      citizenshipResult.waitingPeriodYears,
    ),
    citizenshipResult,
  };
}
