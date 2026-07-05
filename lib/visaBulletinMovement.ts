import { parseBulletinCutoffDate } from "@/lib/visaBulletinData";
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

function isIsoDate(value: string): value is string {
  return ISO_DATE_PATTERN.test(value);
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
        return "Invalid date";
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
  const previousRaw = previousDate.trim();
  const currentRaw = currentDate.trim();
  const parsedPrevious = parseBulletinCutoffDate(previousRaw);
  const parsedCurrent = parseBulletinCutoffDate(currentRaw);

  if (parsedCurrent === "C") {
    if (parsedPrevious === "C") {
      return buildMovementResult("no-change", 0, 0);
    }

    return buildMovementResult("current", null, null);
  }

  if (parsedCurrent === "U") {
    return buildMovementResult("unavailable", null, null);
  }

  if (parsedCurrent === parsedPrevious) {
    return buildMovementResult("no-change", 0, 0);
  }

  if (isIsoDate(parsedPrevious) && isIsoDate(parsedCurrent)) {
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

export async function getVisaBulletinMovement(
  type: MovementComparisonType,
): Promise<VisaBulletinMovementRow[]> {
  if (type === "final-action") {
    const [currentRows, previousRows] = await Promise.all([
      getCurrentFinalActionDates(),
      getPreviousFinalActionDates(),
    ]);

    return buildMovementRows(currentRows, previousRows);
  }

  const [currentRows, previousRows] = await Promise.all([
    getCurrentDatesForFiling(),
    getPreviousDatesForFiling(),
  ]);

  return buildMovementRows(currentRows, previousRows);
}
