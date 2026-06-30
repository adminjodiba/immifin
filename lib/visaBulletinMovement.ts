import { parseBulletinCutoffDate } from "@/lib/visaBulletinData";
import type { BulletinHistoryType } from "@/lib/visaBulletinArchive";
import { getVisaBulletinHistory } from "@/lib/visaBulletinHistory";
import { resolveVisaBulletinCsvUrl } from "@/lib/visaBulletinConfig";
import type { BulletinSheetRow } from "@/lib/visaBulletinSheets";
import {
  getCurrentDatesForFiling,
  getCurrentFinalActionDates,
  getPreviousDatesForFiling,
  getPreviousFinalActionDates,
} from "@/lib/visaBulletinSheets";

export type MovementComparisonType = "final-action" | "filing";

export type MovementType =
  | "no-change"
  | "forward"
  | "retrogression"
  | "current"
  | "unavailable"
  | "invalid";

/** UI tone hint for movementLabel (green = forward, red = retrogression, etc.). */
export type MovementLabelStyle =
  | "green"
  | "red"
  | "neutral"
  | "current"
  | "unavailable"
  | "invalid";

export type VisaBulletinMovementRow = {
  category: string;
  country: string;
  previousDate: string;
  currentDate: string;
  movementType: MovementType;
  movementLabel: string;
  movementLabelStyle: MovementLabelStyle;
  movementDays: number | null;
  movementMonths: number | null;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAYS_PER_MONTH = 30;

function rowKey(category: string, country: string): string {
  return `${category.trim().toLowerCase()}|${country.trim().toLowerCase()}`;
}

type ParsedCutoff = ReturnType<typeof parseBulletinCutoffDate>;

function isComparableIsoDate(value: ParsedCutoff): value is string {
  return value !== "C" && value !== "U" && ISO_DATE_PATTERN.test(value);
}

function dayDiff(previousIso: string, currentIso: string): number {
  const previousMs = new Date(`${previousIso}T00:00:00`).getTime();
  const currentMs = new Date(`${currentIso}T00:00:00`).getTime();

  if (Number.isNaN(previousMs) || Number.isNaN(currentMs)) {
    return Number.NaN;
  }

  return Math.round((currentMs - previousMs) / (1000 * 60 * 60 * 24));
}

export function daysToMovementMonths(movementDays: number): number {
  return Math.round(movementDays / DAYS_PER_MONTH);
}

function movementLabelStyleForType(movementType: MovementType): MovementLabelStyle {
  switch (movementType) {
    case "forward":
      return "green";
    case "retrogression":
      return "red";
    case "no-change":
      return "neutral";
    case "current":
      return "current";
    case "unavailable":
      return "unavailable";
    case "invalid":
      return "invalid";
  }
}

export function formatMovementLabel(
  movementType: MovementType,
  movementDays: number | null,
  movementMonths: number | null,
): string {
  switch (movementType) {
    case "current":
      return "Current";
    case "unavailable":
      return "Unavailable";
    case "invalid":
      return "Invalid date";
    case "no-change":
      return "No Change";
    case "forward":
    case "retrogression": {
      if (movementDays === null || movementMonths === null) {
        return movementType === "forward" ? "Advanced to Current" : "Retrogressed from Current";
      }

      if (movementDays === 0) {
        return "No Change";
      }

      const absolute = Math.abs(movementMonths);
      const unit = absolute === 1 ? "Month" : "Months";
      const sign = movementDays > 0 ? "+" : "-";

      return `${sign}${absolute} ${unit}`;
    }
  }
}

type MovementResult = Pick<
  VisaBulletinMovementRow,
  | "movementType"
  | "movementLabel"
  | "movementLabelStyle"
  | "movementDays"
  | "movementMonths"
>;

function buildMovementResult(
  movementType: MovementType,
  movementDays: number | null,
  movementMonths: number | null,
): MovementResult {
  return {
    movementType,
    movementDays,
    movementMonths,
    movementLabel: formatMovementLabel(movementType, movementDays, movementMonths),
    movementLabelStyle: movementLabelStyleForType(movementType),
  };
}

export function compareBulletinMovement(
  previousDate: string,
  currentDate: string,
): MovementResult {
  const parsedPrevious = parseBulletinCutoffDate(previousDate.trim());
  const parsedCurrent = parseBulletinCutoffDate(currentDate.trim());

  if (parsedCurrent === "U" || parsedPrevious === "U") {
    if (parsedCurrent === "U" && parsedPrevious === "U") {
      return buildMovementResult("no-change", 0, 0);
    }

    return buildMovementResult("unavailable", null, null);
  }

  if (parsedCurrent === "C" && parsedPrevious === "C") {
    return buildMovementResult("no-change", 0, 0);
  }

  if (parsedCurrent === "C" && isComparableIsoDate(parsedPrevious)) {
    return buildMovementResult("forward", null, null);
  }

  if (parsedPrevious === "C" && isComparableIsoDate(parsedCurrent)) {
    return buildMovementResult("retrogression", null, null);
  }

  if (parsedCurrent === parsedPrevious) {
    return buildMovementResult("no-change", 0, 0);
  }

  if (isComparableIsoDate(parsedPrevious) && isComparableIsoDate(parsedCurrent)) {
    const movementDays = dayDiff(parsedPrevious, parsedCurrent);

    if (Number.isNaN(movementDays)) {
      return buildMovementResult("invalid", null, null);
    }

    const movementMonths = daysToMovementMonths(movementDays);

    if (movementDays > 0) {
      return buildMovementResult("forward", movementDays, movementMonths);
    }

    if (movementDays < 0) {
      return buildMovementResult("retrogression", movementDays, movementMonths);
    }

    return buildMovementResult("no-change", 0, 0);
  }

  return buildMovementResult("invalid", null, null);
}

function indexRows(rows: BulletinSheetRow[]): Map<string, BulletinSheetRow> {
  const map = new Map<string, BulletinSheetRow>();

  for (const row of rows) {
    map.set(rowKey(row.category, row.country), row);
  }

  return map;
}

function buildMovementRows(
  currentRows: BulletinSheetRow[],
  previousRows: BulletinSheetRow[],
): VisaBulletinMovementRow[] {
  const currentByKey = indexRows(currentRows);
  const previousByKey = indexRows(previousRows);
  const keys = new Set([...currentByKey.keys(), ...previousByKey.keys()]);

  return [...keys]
    .map((key) => {
      const current = currentByKey.get(key);
      const previous = previousByKey.get(key);

      const category = current?.category ?? previous?.category ?? "";
      const country = current?.country ?? previous?.country ?? "";
      const currentDate = current?.cutoffDate ?? "";
      const previousDate = previous?.cutoffDate ?? "";

      return {
        category,
        country,
        previousDate,
        currentDate,
        ...compareBulletinMovement(previousDate, currentDate),
      };
    })
    .sort((a, b) => {
      const categoryCompare = a.category.localeCompare(b.category);
      return categoryCompare !== 0 ? categoryCompare : a.country.localeCompare(b.country);
    });
}

function historyTypeForComparison(type: MovementComparisonType): BulletinHistoryType {
  return type === "final-action" ? "FinalAction" : "Filing";
}

function normalizedCutoff(value: string): ParsedCutoff {
  return parseBulletinCutoffDate(value.trim());
}

function sheetRowsMatch(
  leftRows: BulletinSheetRow[],
  rightRows: BulletinSheetRow[],
): boolean {
  if (leftRows.length === 0 || leftRows.length !== rightRows.length) {
    return false;
  }

  const leftByKey = indexRows(leftRows);
  const rightByKey = indexRows(rightRows);

  for (const [key, leftRow] of leftByKey) {
    const rightRow = rightByKey.get(key);

    if (
      !rightRow ||
      normalizedCutoff(leftRow.cutoffDate) !== normalizedCutoff(rightRow.cutoffDate)
    ) {
      return false;
    }
  }

  return true;
}

function historyRecordsToRows(
  records: Awaited<ReturnType<typeof getVisaBulletinHistory>>,
  month: string,
): BulletinSheetRow[] {
  return records
    .filter((record) => record.month === month)
    .map((record) => ({
      category: record.category,
      country: record.country,
      cutoffDate: record.cutoffDate,
    }));
}

async function findHistoryMonthMatchingRows(
  type: BulletinHistoryType,
  rows: BulletinSheetRow[],
): Promise<string | null> {
  const records = await getVisaBulletinHistory({ type });
  const months = [...new Set(records.map((record) => record.month))].sort();

  for (let index = months.length - 1; index >= 0; index -= 1) {
    const month = months[index];
    const monthRows = historyRecordsToRows(records, month);

    if (sheetRowsMatch(monthRows, rows)) {
      return month;
    }
  }

  return null;
}

async function getPreviousRowsFromHistory(
  type: MovementComparisonType,
  currentRows: BulletinSheetRow[],
  previousFinalActionRows?: BulletinSheetRow[],
): Promise<{ previousMonth: string; rows: BulletinSheetRow[] } | null> {
  const historyType = historyTypeForComparison(type);
  const records = await getVisaBulletinHistory({ type: historyType });
  const months = [...new Set(records.map((record) => record.month))].sort();

  if (months.length < 2) {
    return null;
  }

  if (type === "filing" && previousFinalActionRows?.length) {
    const finalActionPreviousMonth = await findHistoryMonthMatchingRows(
      "FinalAction",
      previousFinalActionRows,
    );

    if (finalActionPreviousMonth) {
      return {
        previousMonth: finalActionPreviousMonth,
        rows: historyRecordsToRows(records, finalActionPreviousMonth),
      };
    }
  }

  let referenceMonth = months[months.length - 1];

  for (let index = months.length - 1; index >= 0; index -= 1) {
    const month = months[index];
    const monthRows = historyRecordsToRows(records, month);

    if (sheetRowsMatch(monthRows, currentRows)) {
      referenceMonth = month;
      break;
    }
  }

  const referenceIndex = months.indexOf(referenceMonth);

  if (referenceIndex <= 0) {
    return null;
  }

  const previousMonth = months[referenceIndex - 1];

  return {
    previousMonth,
    rows: historyRecordsToRows(records, previousMonth),
  };
}

function logFilingSourceDebug(
  currentRows: BulletinSheetRow[],
  previousRows: BulletinSheetRow[],
  resolvedPreviousRows: BulletinSheetRow[],
  previousMonth: string | null,
): void {
  const sample = (rows: BulletinSheetRow[]) =>
    rows.find((row) => /eb2/i.test(row.category) && /india/i.test(row.country));

  const currentSample = sample(currentRows);
  const dedicatedPreviousSample = sample(previousRows);
  const resolvedPreviousSample = sample(resolvedPreviousRows);

  console.warn("[visa-bulletin-movement] filing source debug:", {
    currentDatesForFilingUrl: resolveVisaBulletinCsvUrl("DatesForFiling"),
    previousDatesForFilingUrl: resolveVisaBulletinCsvUrl("PreviousDatesForFiling"),
    historyPreviousMonth: previousMonth,
    sampleCurrentEb2India: currentSample?.cutoffDate ?? null,
    sampleDedicatedPreviousEb2India: dedicatedPreviousSample?.cutoffDate ?? null,
    sampleResolvedPreviousEb2India: resolvedPreviousSample?.cutoffDate ?? null,
    comparisonResult:
      currentSample && resolvedPreviousSample
        ? compareBulletinMovement(
            resolvedPreviousSample.cutoffDate,
            currentSample.cutoffDate,
          ).movementType
        : null,
  });
}

async function resolvePreviousRows(
  type: MovementComparisonType,
  currentRows: BulletinSheetRow[],
  previousRows: BulletinSheetRow[],
  options: { forceHistory?: boolean; previousFinalActionRows?: BulletinSheetRow[] } = {},
): Promise<BulletinSheetRow[]> {
  const dedicatedPreviousMatchesCurrent = sheetRowsMatch(currentRows, previousRows);

  if (!dedicatedPreviousMatchesCurrent && !options.forceHistory) {
    return previousRows;
  }

  const historyPrevious = await getPreviousRowsFromHistory(
    type,
    currentRows,
    options.previousFinalActionRows,
  );

  if (!historyPrevious) {
    console.warn(
      `[visa-bulletin-movement] ${type}: dedicated previous sheet matches current and no history month is available`,
    );
    return previousRows;
  }

  const resolvedPreviousRows = historyPrevious.rows;

  if (type === "filing") {
    logFilingSourceDebug(
      currentRows,
      previousRows,
      resolvedPreviousRows,
      historyPrevious.previousMonth,
    );
  }

  if (sheetRowsMatch(currentRows, resolvedPreviousRows)) {
    console.warn(
      `[visa-bulletin-movement] ${type}: dedicated previous sheet is stale; history month ${historyPrevious.previousMonth} matches current bulletin dates`,
    );
  } else {
    console.warn(
      `[visa-bulletin-movement] ${type}: dedicated previous sheet is stale; using VisaBulletinHistory month ${historyPrevious.previousMonth}`,
    );
  }

  return resolvedPreviousRows;
}

export async function getVisaBulletinMovement(
  type: MovementComparisonType,
): Promise<VisaBulletinMovementRow[]> {
  if (type === "final-action") {
    const [currentRows, previousRows] = await Promise.all([
      getCurrentFinalActionDates(),
      getPreviousFinalActionDates(),
    ]);

    return buildMovementRows(
      currentRows,
      await resolvePreviousRows(type, currentRows, previousRows),
    );
  }

  const [currentRows, previousRows, currentFinalActionRows, previousFinalActionRows] =
    await Promise.all([
      getCurrentDatesForFiling(),
      getPreviousDatesForFiling(),
      getCurrentFinalActionDates(),
      getPreviousFinalActionDates(),
    ]);

  const filingPreviousSheetIsStale =
    sheetRowsMatch(currentRows, previousRows) &&
    !sheetRowsMatch(currentFinalActionRows, previousFinalActionRows);

  return buildMovementRows(
    currentRows,
    await resolvePreviousRows(type, currentRows, previousRows, {
      forceHistory: filingPreviousSheetIsStale,
      previousFinalActionRows: previousFinalActionRows,
    }),
  );
}
