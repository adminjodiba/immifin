import {
  formatCategoryLabel,
  formatBulletinTypeLabel,
  formatCountryLabel,
  formatDisplayDate,
} from "@/lib/dashboard/formatProfileLabels";
import {
  calculateDaysBetween,
  calculateYearsMonthsDaysSince,
} from "@/lib/dashboard/journeyDates";
import { formatEligibilityDate } from "@/lib/citizenship-eligibility";
import {
  comparePriorityToBulletin,
  latestVisaBulletin,
  type LivePriorityDateCheck,
  type LivePriorityDateStatus,
} from "@/lib/visaBulletinData";
import type { ImmigrationProfile } from "@/lib/supabase/types";

const PROFILE_COUNTRY_TO_CHARGEABILITY: Record<string, string> = {
  India: "india",
  China: "china",
  Mexico: "mexico",
  Philippines: "philippines",
  ROW: "all",
};

export type BulletinTimelineCardData = {
  title: string;
  subtitle: string;
  cutoffMarkerTitle: string;
  timelineStartFormatted: string;
  priorityDateFormatted: string;
  todayFormatted: string;
  daysSincePriorityDate: number;
  daysSincePriorityLabel: string;
  cutoffFormatted: string;
  status: LivePriorityDateStatus;
  statusLabel: string;
  isPositive: boolean;
  priorityMarkerPercent: number;
  cutoffMarkerPercent: number;
  todayMarkerPercent: number;
  priorityLabelPercent: number;
  cutoffLabelPercent: number;
  fillPercent: number;
  statusExplanation: string;
  meaningMessage: string;
  error: string | null;
};

export type EmploymentJourneyData = {
  priorityDate: string;
  priorityDateFormatted: string;
  categoryLabel: string | null;
  countryLabel: string | null;
  preferredBulletinTypeLabel: string | null;
  bulletinMonthLabel: string;
  todayFormatted: string;
  daysSincePriorityDate: number;
  daysSincePriorityDuration: string;
  priorityDateAgoLabel: string;
  datesForFiling: BulletinTimelineCardData;
  finalAction: BulletinTimelineCardData;
};

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseLocalDate(value: string): Date {
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function toIsoDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function profileCountryToChargeability(country: string): string {
  return PROFILE_COUNTRY_TO_CHARGEABILITY[country] ?? country.toLowerCase();
}

function isPositiveStatus(status: LivePriorityDateStatus): boolean {
  return status === "current" || status === "eligible";
}

function statusToLabel(status: LivePriorityDateStatus): string {
  if (status === "current" || status === "eligible") {
    return "Current";
  }

  if (status === "waiting") {
    return "Waiting";
  }

  return "Unavailable";
}

type ComparativeTimelineLayout = {
  timelineStartFormatted: string;
  priorityMarkerPercent: number;
  cutoffMarkerPercent: number;
  todayMarkerPercent: number;
  priorityLabelPercent: number;
  cutoffLabelPercent: number;
  fillPercent: number;
};

function computeComparativeTimelineLayout(
  priorityDate: string,
  cutoffDate: string,
  today: Date,
  status: LivePriorityDateStatus,
): ComparativeTimelineLayout {
  const priority = parseLocalDate(priorityDate);
  const unavailableLayout = (): ComparativeTimelineLayout => ({
    timelineStartFormatted: formatDisplayDate(priorityDate) ?? priorityDate,
    priorityMarkerPercent: 0,
    cutoffMarkerPercent: 50,
    todayMarkerPercent: 100,
    priorityLabelPercent: 0,
    cutoffLabelPercent: 50,
    fillPercent: 100,
  });

  if (status === "unavailable" || cutoffDate === "U") {
    return unavailableLayout();
  }

  const isCurrentCutoff = cutoffDate === "C";
  const hasRealCutoffDate = /^\d{4}-\d{2}-\d{2}$/.test(cutoffDate);

  if (!isCurrentCutoff && !hasRealCutoffDate) {
    return unavailableLayout();
  }

  const cutoff = hasRealCutoffDate ? parseLocalDate(cutoffDate) : priority;
  const timelineStart = priority.getTime() <= cutoff.getTime() ? priority : cutoff;
  const timelineEnd = today;
  const totalMs = timelineEnd.getTime() - timelineStart.getTime();

  const toPercent = (date: Date): number => {
    if (totalMs <= 0) {
      return 100;
    }

    return Math.min(
      100,
      Math.max(0, ((date.getTime() - timelineStart.getTime()) / totalMs) * 100),
    );
  };

  const priorityMarkerPercent = toPercent(priority);
  let cutoffMarkerPercent: number;

  if (isCurrentCutoff) {
    cutoffMarkerPercent = Math.min(
      100,
      Math.max(priorityMarkerPercent + 8, priorityMarkerPercent),
    );
  } else {
    cutoffMarkerPercent = toPercent(cutoff);
  }

  const todayMarkerPercent = 100;

  return {
    timelineStartFormatted:
      formatDisplayDate(toIsoDateString(timelineStart)) ?? toIsoDateString(timelineStart),
    priorityMarkerPercent,
    cutoffMarkerPercent,
    todayMarkerPercent,
    priorityLabelPercent: priorityMarkerPercent,
    cutoffLabelPercent: cutoffMarkerPercent,
    fillPercent: 100,
  };
}

function buildTimelineCard(
  check: LivePriorityDateCheck | null,
  error: string | null,
  config: {
    title: string;
    subtitle: string;
    cutoffMarkerTitle: string;
    positiveMessage: string;
    negativeMessage: string;
  },
  priorityDate: string,
  today: Date,
): BulletinTimelineCardData {
  const daysSincePriorityDate = calculateDaysBetween(parseLocalDate(priorityDate), today);
  const daysSincePriorityLabel = `${daysSincePriorityDate.toLocaleString()} day${
    daysSincePriorityDate === 1 ? "" : "s"
  } since priority date`;

  if (error || !check) {
    const layout = computeComparativeTimelineLayout(priorityDate, "U", today, "unavailable");

    return {
      title: config.title,
      subtitle: config.subtitle,
      cutoffMarkerTitle: config.cutoffMarkerTitle,
      timelineStartFormatted: layout.timelineStartFormatted,
      priorityDateFormatted: formatDisplayDate(priorityDate) ?? priorityDate,
      todayFormatted: formatEligibilityDate(today),
      daysSincePriorityDate,
      daysSincePriorityLabel,
      cutoffFormatted: "Unavailable",
      status: "unavailable",
      statusLabel: "Unavailable",
      isPositive: false,
      priorityMarkerPercent: layout.priorityMarkerPercent,
      cutoffMarkerPercent: layout.cutoffMarkerPercent,
      todayMarkerPercent: layout.todayMarkerPercent,
      priorityLabelPercent: layout.priorityLabelPercent,
      cutoffLabelPercent: layout.cutoffLabelPercent,
      fillPercent: layout.fillPercent,
      statusExplanation: "We could not load Visa Bulletin data for this chart.",
      meaningMessage: error ?? "Please try again later.",
      error,
    };
  }

  const isPositive = isPositiveStatus(check.status);
  const layout = computeComparativeTimelineLayout(
    priorityDate,
    check.cutoffDate,
    today,
    check.status,
  );

  return {
    title: config.title,
    subtitle: config.subtitle,
    cutoffMarkerTitle: config.cutoffMarkerTitle,
    timelineStartFormatted: layout.timelineStartFormatted,
    priorityDateFormatted: formatDisplayDate(priorityDate) ?? priorityDate,
    todayFormatted: formatEligibilityDate(today),
    daysSincePriorityDate,
    daysSincePriorityLabel,
    cutoffFormatted: check.formattedCutoff,
    status: check.status,
    statusLabel: statusToLabel(check.status),
    isPositive,
    priorityMarkerPercent: layout.priorityMarkerPercent,
    cutoffMarkerPercent: layout.cutoffMarkerPercent,
    todayMarkerPercent: layout.todayMarkerPercent,
    priorityLabelPercent: layout.priorityLabelPercent,
    cutoffLabelPercent: layout.cutoffLabelPercent,
    fillPercent: layout.fillPercent,
    statusExplanation: check.message,
    meaningMessage: isPositive ? config.positiveMessage : config.negativeMessage,
    error: null,
  };
}

export async function buildEmploymentJourneyData(
  immigrationProfile: ImmigrationProfile,
): Promise<EmploymentJourneyData> {
  const priorityDate = immigrationProfile.priority_date!;
  const category = immigrationProfile.default_category!;
  const chargeability = profileCountryToChargeability(immigrationProfile.default_country!);
  const today = startOfToday();

  const daysSincePriorityDate = calculateDaysBetween(parseLocalDate(priorityDate), today);

  let filingCheck: LivePriorityDateCheck | null = null;
  let finalActionCheck: LivePriorityDateCheck | null = null;
  let filingError: string | null = null;
  let finalActionError: string | null = null;

  const [filingResult, finalActionResult] = await Promise.allSettled([
    comparePriorityToBulletin(priorityDate, category, chargeability, "filing"),
    comparePriorityToBulletin(priorityDate, category, chargeability, "final-action"),
  ]);

  if (filingResult.status === "fulfilled") {
    filingCheck = filingResult.value;
  } else {
    filingError =
      filingResult.reason instanceof Error
        ? filingResult.reason.message
        : "Unable to load Dates for Filing data.";
  }

  if (finalActionResult.status === "fulfilled") {
    finalActionCheck = finalActionResult.value;
  } else {
    finalActionError =
      finalActionResult.reason instanceof Error
        ? finalActionResult.reason.message
        : "Unable to load Final Action Date data.";
  }

  const bulletinMonthLabel = `${latestVisaBulletin.month} ${latestVisaBulletin.year}`;

  return {
    priorityDate,
    priorityDateFormatted: formatDisplayDate(priorityDate) ?? priorityDate,
    categoryLabel: formatCategoryLabel(immigrationProfile.default_category),
    countryLabel: formatCountryLabel(immigrationProfile.default_country),
    preferredBulletinTypeLabel: formatBulletinTypeLabel(
      immigrationProfile.default_bulletin_type,
    ),
    bulletinMonthLabel,
    todayFormatted: formatEligibilityDate(today),
    daysSincePriorityDate,
    daysSincePriorityDuration: calculateYearsMonthsDaysSince(priorityDate, today),
    priorityDateAgoLabel: calculateYearsMonthsDaysSince(priorityDate, today),
    datesForFiling: buildTimelineCard(
      filingCheck,
      filingError,
      {
        title: "Dates for Filing",
        subtitle:
          "This compares your Priority Date, the Visa Bulletin cutoff, and today on a real calendar timeline.",
        cutoffMarkerTitle: "Current Filing Date Cutoff",
        positiveMessage:
          "Great! The Dates for Filing cutoff has reached your Priority Date.",
        negativeMessage:
          "The Dates for Filing cutoff has not reached your Priority Date yet.",
      },
      priorityDate,
      today,
    ),
    finalAction: buildTimelineCard(
      finalActionCheck,
      finalActionError,
      {
        title: "Final Action Date",
        subtitle:
          "This compares your Priority Date, the Visa Bulletin cutoff, and today on a real calendar timeline.",
        cutoffMarkerTitle: "Current Final Action Cutoff",
        positiveMessage: "Great! The Final Action Date has reached your Priority Date.",
        negativeMessage: "The Final Action Date has not reached your Priority Date yet.",
      },
      priorityDate,
      today,
    ),
  };
}
