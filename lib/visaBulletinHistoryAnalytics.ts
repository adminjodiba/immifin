import { formatBulletinDate, parseBulletinCutoffDate } from "@/lib/visaBulletinData";
import type { VisaBulletinHistoryRecord } from "@/lib/visaBulletinHistory";

export type VisaBulletinHistoryAnalytics = {
  currentCutoff: string | null;
  earliestCutoff: string | null;
  totalMovementDays: number | null;
  largestAdvancementDays: number | null;
  largestRetrogressionDays: number | null;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseHistoryCutoffDate(value: string): Date | null {
  const parsed = parseBulletinCutoffDate(value.trim());

  if (parsed === "C" || parsed === "U" || !ISO_DATE_PATTERN.test(parsed)) {
    return null;
  }

  const date = new Date(`${parsed}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatHistoryCutoffLabel(value: string): string {
  const parsed = parseBulletinCutoffDate(value.trim());

  if (parsed === "C" || parsed === "U" || !ISO_DATE_PATTERN.test(parsed)) {
    return value.trim();
  }

  return formatBulletinDate(parsed);
}

function dayDiff(earlier: Date, later: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeVisaBulletinHistoryAnalytics(
  records: VisaBulletinHistoryRecord[],
): VisaBulletinHistoryAnalytics {
  const sorted = [...records].sort((a, b) => a.month.localeCompare(b.month));

  const datedRows = sorted
    .map((row) => ({
      month: row.month,
      date: parseHistoryCutoffDate(row.cutoffDate),
      label: formatHistoryCutoffLabel(row.cutoffDate),
    }))
    .filter((row): row is { month: string; date: Date; label: string } => row.date !== null);

  if (datedRows.length === 0) {
    return {
      currentCutoff: null,
      earliestCutoff: null,
      totalMovementDays: null,
      largestAdvancementDays: null,
      largestRetrogressionDays: null,
    };
  }

  const earliest = datedRows[0];
  const current = datedRows[datedRows.length - 1];

  let largestAdvancementDays: number | null = null;
  let largestRetrogressionDays: number | null = null;

  for (let index = 1; index < sorted.length; index += 1) {
    const previousDate = parseHistoryCutoffDate(sorted[index - 1].cutoffDate);
    const currentDate = parseHistoryCutoffDate(sorted[index].cutoffDate);

    if (!previousDate || !currentDate) {
      continue;
    }

    const movementDays = dayDiff(previousDate, currentDate);

    if (movementDays > 0) {
      largestAdvancementDays =
        largestAdvancementDays === null
          ? movementDays
          : Math.max(largestAdvancementDays, movementDays);
    }

    if (movementDays < 0) {
      largestRetrogressionDays =
        largestRetrogressionDays === null
          ? movementDays
          : Math.min(largestRetrogressionDays, movementDays);
    }
  }

  const totalMovementDays =
    datedRows.length >= 2 ? dayDiff(earliest.date, current.date) : 0;

  return {
    currentCutoff: current.label,
    earliestCutoff: earliest.label,
    totalMovementDays,
    largestAdvancementDays,
    largestRetrogressionDays,
  };
}

export function formatMovementDays(days: number | null): string {
  if (days === null) {
    return "—";
  }

  if (days === 0) {
    return "No Change";
  }

  const absolute = Math.abs(days);
  const unit = absolute === 1 ? "Day" : "Days";
  const sign = days > 0 ? "+" : "-";

  return `${sign}${absolute} ${unit}`;
}

export type HistoryChartPoint = {
  month: string;
  monthLabel: string;
  cutoffLabel: string;
  daysFromStart: number;
};

function formatChartMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function buildHistoryChartData(records: VisaBulletinHistoryRecord[]): HistoryChartPoint[] {
  const datedRows = [...records]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({
      month: row.month,
      monthLabel: formatChartMonthLabel(row.month),
      date: parseHistoryCutoffDate(row.cutoffDate),
      cutoffLabel: formatHistoryCutoffLabel(row.cutoffDate),
    }))
    .filter((row): row is { month: string; monthLabel: string; date: Date; cutoffLabel: string } =>
      row.date !== null,
    );

  if (datedRows.length === 0) {
    return [];
  }

  const baselineDate = datedRows[0].date;

  return datedRows.map((row) => ({
    month: row.month,
    monthLabel: row.monthLabel,
    cutoffLabel: row.cutoffLabel,
    daysFromStart: dayDiff(baselineDate, row.date),
  }));
}

export type HistoryMovementChartPoint = {
  month: string;
  monthLabel: string;
  currentCutoffLabel: string;
  previousCutoffLabel: string;
  movementDays: number;
};

export function formatMovementChartLabel(days: number): string {
  if (days === 0) {
    return "No Change";
  }

  const absolute = Math.abs(days);
  const unit = absolute === 1 ? "Day" : "Days";

  if (days > 0) {
    return `Advanced ${absolute} ${unit}`;
  }

  return `Retrogressed ${absolute} ${unit}`;
}

export function buildHistoryMovementChartData(
  records: VisaBulletinHistoryRecord[],
): HistoryMovementChartPoint[] {
  const datedRows = [...records]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({
      month: row.month,
      monthLabel: formatChartMonthLabel(row.month),
      date: parseHistoryCutoffDate(row.cutoffDate),
      cutoffLabel: formatHistoryCutoffLabel(row.cutoffDate),
    }))
    .filter((row): row is { month: string; monthLabel: string; date: Date; cutoffLabel: string } =>
      row.date !== null,
    );

  if (datedRows.length < 2) {
    return [];
  }

  const movementPoints: HistoryMovementChartPoint[] = [];

  for (let index = 1; index < datedRows.length; index += 1) {
    const previous = datedRows[index - 1];
    const current = datedRows[index];

    movementPoints.push({
      month: current.month,
      monthLabel: current.monthLabel,
      currentCutoffLabel: current.cutoffLabel,
      previousCutoffLabel: previous.cutoffLabel,
      movementDays: dayDiff(previous.date, current.date),
    });
  }

  return movementPoints;
}
