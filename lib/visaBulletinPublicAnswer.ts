/**
 * Deterministic public Visa Bulletin answer layer.
 * Facts come only from the existing Sheets pipeline — never from LLMs or sample data.
 */

import {
  findMatchingVisaBulletinRow,
  formatBulletinDate,
  parseBulletinCutoffDate,
} from "@/lib/visaBulletinData";
import {
  formatVisaBulletinMonthLong,
  formatVisaBulletinMonthShort,
  getLatestVisaBulletinMonth,
  getVisaBulletinHistory,
  type VisaBulletinHistoryQuery,
  type VisaBulletinHistoryRecord,
} from "@/lib/visaBulletinHistory";
import {
  compareBulletinMovement,
} from "@/lib/visaBulletinMovement";
import {
  getCurrentDatesForFiling,
  getCurrentFinalActionDates,
  getPreviousDatesForFiling,
  getPreviousFinalActionDates,
  type BulletinSheetRow,
} from "@/lib/visaBulletinSheets";
import {
  getPublicVisaBulletinCanonicalPath,
  getPublicVisaBulletinCategoryConfig,
  getPublicVisaBulletinCountryConfig,
  type PublicVisaBulletinCategoryConfig,
  type PublicVisaBulletinCountryConfig,
} from "@/lib/visaBulletinPublicSlugs";

export const PUBLIC_VISA_BULLETIN_HISTORY_LIMIT = 6;

export type PublicBulletinSemanticState =
  | "current"
  | "unavailable"
  | "dated"
  | "unknown";

export type PublicBulletinStatusLabel =
  | "Current"
  | "Unavailable"
  | "Waiting Queue";

export type PublicBulletinCell = {
  raw: string | null;
  parsed: string | null;
  semanticState: PublicBulletinSemanticState;
  statusLabel: PublicBulletinStatusLabel | null;
  displayValue: string | null;
};

export type PublicBulletinChartAnswer = {
  current: PublicBulletinCell;
  previous: PublicBulletinCell;
  movement: ReturnType<typeof compareBulletinMovement> | null;
};

export type PublicVisaBulletinHistoryPoint = {
  month: string;
  monthShort: string;
  monthLong: string;
  raw: string;
  parsed: string;
  semanticState: PublicBulletinSemanticState;
  statusLabel: PublicBulletinStatusLabel | null;
  displayValue: string;
};

export type PublicVisaBulletinAnswer = {
  category: PublicVisaBulletinCategoryConfig;
  country: PublicVisaBulletinCountryConfig;
  bulletin: {
    month: string | null;
    monthShort: string | null;
    monthLong: string | null;
  };
  fad: PublicBulletinChartAnswer;
  dff: PublicBulletinChartAnswer;
  recentHistory: {
    fad: PublicVisaBulletinHistoryPoint[];
    dff: PublicVisaBulletinHistoryPoint[];
  };
  canonicalPath: string;
};

export type PublicVisaBulletinAnswerInput = {
  categorySlug: string;
  countrySlug: string;
};

export type PublicVisaBulletinAnswerLoaders = {
  getCurrentFinalActionDates: () => Promise<BulletinSheetRow[]>;
  getCurrentDatesForFiling: () => Promise<BulletinSheetRow[]>;
  getPreviousFinalActionDates: () => Promise<BulletinSheetRow[]>;
  getPreviousDatesForFiling: () => Promise<BulletinSheetRow[]>;
  getLatestVisaBulletinMonth: () => Promise<string | null>;
  getVisaBulletinHistory: (
    query: VisaBulletinHistoryQuery,
  ) => Promise<VisaBulletinHistoryRecord[]>;
};

const defaultLoaders: PublicVisaBulletinAnswerLoaders = {
  getCurrentFinalActionDates: () => getCurrentFinalActionDates(),
  getCurrentDatesForFiling: () => getCurrentDatesForFiling(),
  getPreviousFinalActionDates: () => getPreviousFinalActionDates(),
  getPreviousDatesForFiling: () => getPreviousDatesForFiling(),
  getLatestVisaBulletinMonth,
  getVisaBulletinHistory: (query) => getVisaBulletinHistory(query),
};

function describePublicBulletinValue(raw: string | null): PublicBulletinCell {
  if (raw === null || raw.trim() === "") {
    return {
      raw,
      parsed: null,
      semanticState: "unknown",
      statusLabel: null,
      displayValue: null,
    };
  }

  const parsed = parseBulletinCutoffDate(raw);

  if (parsed === "C") {
    return {
      raw,
      parsed: "C",
      semanticState: "current",
      statusLabel: "Current",
      displayValue: "Current",
    };
  }

  if (parsed === "U") {
    return {
      raw,
      parsed: "U",
      semanticState: "unavailable",
      statusLabel: "Unavailable",
      displayValue: "Unavailable",
    };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
    return {
      raw,
      parsed,
      semanticState: "dated",
      statusLabel: "Waiting Queue",
      displayValue: formatBulletinDate(parsed),
    };
  }

  return {
    raw,
    parsed,
    semanticState: "unknown",
    statusLabel: null,
    displayValue: raw,
  };
}

function cellFromRow(
  rows: readonly BulletinSheetRow[],
  category: string,
  country: string,
): PublicBulletinCell {
  const row = findMatchingVisaBulletinRow(rows, category, country);
  return describePublicBulletinValue(row ? row.cutoffDate : null);
}

function movementForCells(
  previous: PublicBulletinCell,
  current: PublicBulletinCell,
): ReturnType<typeof compareBulletinMovement> | null {
  if (previous.raw === null || current.raw === null) {
    return null;
  }

  return compareBulletinMovement(previous.raw, current.raw);
}

function historyPointFromRecord(
  record: VisaBulletinHistoryRecord,
): PublicVisaBulletinHistoryPoint {
  const cell = describePublicBulletinValue(record.cutoffDate);

  return {
    month: record.month,
    monthShort: formatVisaBulletinMonthShort(record.month),
    monthLong: formatVisaBulletinMonthLong(record.month),
    raw: record.cutoffDate,
    parsed: cell.parsed ?? record.cutoffDate,
    semanticState: cell.semanticState,
    statusLabel: cell.statusLabel,
    displayValue: cell.displayValue ?? record.cutoffDate,
  };
}

function limitRecentHistory(
  records: VisaBulletinHistoryRecord[],
): PublicVisaBulletinHistoryPoint[] {
  const newestLast = [...records].sort((a, b) => a.month.localeCompare(b.month));
  return newestLast.slice(-PUBLIC_VISA_BULLETIN_HISTORY_LIMIT).map(historyPointFromRecord);
}

export async function getPublicVisaBulletinAnswer(
  input: PublicVisaBulletinAnswerInput,
  options?: { loaders?: PublicVisaBulletinAnswerLoaders },
): Promise<PublicVisaBulletinAnswer | null> {
  const category = getPublicVisaBulletinCategoryConfig(input.categorySlug);
  const country = getPublicVisaBulletinCountryConfig(input.countrySlug);
  const canonicalPath = getPublicVisaBulletinCanonicalPath(
    input.categorySlug,
    input.countrySlug,
  );

  if (!category || !country || !canonicalPath) {
    return null;
  }

  const loaders = options?.loaders ?? defaultLoaders;
  const [
    currentFadRows,
    currentDffRows,
    previousFadRows,
    previousDffRows,
    bulletinMonth,
    fadHistory,
    dffHistory,
  ] = await Promise.all([
    loaders.getCurrentFinalActionDates(),
    loaders.getCurrentDatesForFiling(),
    loaders.getPreviousFinalActionDates(),
    loaders.getPreviousDatesForFiling(),
    loaders.getLatestVisaBulletinMonth(),
    loaders.getVisaBulletinHistory({
      category: category.matchKey,
      country: country.matchValue,
      type: "FinalAction",
    }),
    loaders.getVisaBulletinHistory({
      category: category.matchKey,
      country: country.matchValue,
      type: "Filing",
    }),
  ]);

  const fadCurrent = cellFromRow(currentFadRows, category.matchKey, country.matchValue);
  const fadPrevious = cellFromRow(previousFadRows, category.matchKey, country.matchValue);
  const dffCurrent = cellFromRow(currentDffRows, category.matchKey, country.matchValue);
  const dffPrevious = cellFromRow(previousDffRows, category.matchKey, country.matchValue);

  return {
    category,
    country,
    bulletin: {
      month: bulletinMonth,
      monthShort: bulletinMonth ? formatVisaBulletinMonthShort(bulletinMonth) : null,
      monthLong: bulletinMonth ? formatVisaBulletinMonthLong(bulletinMonth) : null,
    },
    fad: {
      current: fadCurrent,
      previous: fadPrevious,
      movement: movementForCells(fadPrevious, fadCurrent),
    },
    dff: {
      current: dffCurrent,
      previous: dffPrevious,
      movement: movementForCells(dffPrevious, dffCurrent),
    },
    recentHistory: {
      fad: limitRecentHistory(fadHistory),
      dff: limitRecentHistory(dffHistory),
    },
    canonicalPath,
  };
}
