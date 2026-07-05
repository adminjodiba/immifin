import type { HistoryDateRangeKey } from "@/components/VisaBulletinHistoryTimelineScroll";

/** Use quarter x-axis labels for 12-month and longer views. */
export function shouldUseQuarterAxisLabels(
  dateRange: HistoryDateRangeKey,
  monthCount: number,
): boolean {
  if (dateRange === "6" || monthCount < 6) return false;
  return true;
}

/** Compact month label for short ranges (e.g. Jan '26). */
export function formatCompactMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  if (Number.isNaN(date.getTime())) return month;
  const shortMonth = date.toLocaleDateString("en-US", { month: "short" });
  const shortYear = date.toLocaleDateString("en-US", { year: "2-digit" });
  return `${shortMonth} '${shortYear}`;
}

/** Quarter label on the first month of each quarter (Jan/Apr/Jul/Oct). Empty string otherwise. */
export function formatQuarterAxisLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return "";
  const monthIndex = monthNumber - 1;
  if (monthIndex % 3 !== 0) return "";
  const quarter = Math.floor(monthIndex / 3) + 1;
  return `Q${quarter} '${String(year).slice(-2)}`;
}

export function formatAxisTickLabel(month: string, useQuarters: boolean): string {
  return useQuarters ? formatQuarterAxisLabel(month) : formatCompactMonthLabel(month);
}

export function enrichChartPointsWithAxisLabels<T extends { month: string }>(
  points: T[],
  dateRange: HistoryDateRangeKey,
): Array<T & { axisTickLabel: string }> {
  const useQuarters = shouldUseQuarterAxisLabels(dateRange, points.length);
  return points.map((point) => ({
    ...point,
    axisTickLabel: formatAxisTickLabel(point.month, useQuarters),
  }));
}
