/**
 * Multi-sheet visa bulletin loaders (Google Sheets published CSV).
 * Existing calculators/pages continue using getVisaBulletinData() in visaBulletinData.ts.
 */

import {
  resolveVisaBulletinCsvUrl,
  type VisaBulletinSheetKey,
} from "@/lib/visaBulletinConfig";

export type VisaBulletinSheetName = Exclude<VisaBulletinSheetKey, "VisaBulletinHistory">;

export type BulletinSheetRow = {
  category: string;
  country: string;
  cutoffDate: string;
};

export const VISA_BULLETIN_SHEETS_CACHE_TAG = "visa-bulletin-sheets";

function parseCsvMatrix(csvText: string): string[][] {
  return csvText
    .split("\n")
    .map((row) => row.split(",").map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell !== ""));
}

function parseCsvRows(csvText: string): BulletinSheetRow[] {
  const rows = parseCsvMatrix(csvText);

  if (rows.length <= 1) {
    return [];
  }

  return rows.slice(1).map((row) => ({
    category: row[0] ?? "",
    country: row[1] ?? "",
    cutoffDate: row[2] ?? "",
  }));
}

async function fetchCsvText(url: string, label: string, forceRefresh = false): Promise<string> {
  const response = await fetch(
    url,
    forceRefresh ? { cache: "no-store" } : { next: { revalidate: 86400 } },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${label} (${response.status})`);
  }

  return response.text();
}

async function fetchSheetRows(
  sheetName: VisaBulletinSheetName,
  forceRefresh = false,
): Promise<BulletinSheetRow[]> {
  const url = resolveVisaBulletinCsvUrl(sheetName);
  const csvText = await fetchCsvText(url, sheetName, forceRefresh);
  const rows = parseCsvRows(csvText);

  console.log(`[visa-bulletin] ${sheetName}: loaded ${rows.length} rows from ${url}`);
  console.log(`[visa-bulletin] ${sheetName} sample:`, rows.slice(0, 3));

  return rows;
}

export async function fetchVisaBulletinHistoryCsvRows(forceRefresh = false): Promise<string[][]> {
  const url = resolveVisaBulletinCsvUrl("VisaBulletinHistory");
  const csvText = await fetchCsvText(url, "VisaBulletinHistory", forceRefresh);
  const rows = parseCsvMatrix(csvText);
  const dataRows = rows.length <= 1 ? [] : rows.slice(1);

  console.log(`[visa-bulletin] VisaBulletinHistory: loaded ${dataRows.length} rows from ${url}`);
  console.log(`[visa-bulletin] VisaBulletinHistory sample:`, dataRows.slice(0, 3));

  return dataRows;
}

export async function getCurrentFinalActionDates(forceRefresh = false): Promise<BulletinSheetRow[]> {
  return fetchSheetRows("FinalActionDates", forceRefresh);
}

export async function getPreviousFinalActionDates(
  forceRefresh = false,
): Promise<BulletinSheetRow[]> {
  return fetchSheetRows("PreviousFinalActionDates", forceRefresh);
}

export async function getCurrentDatesForFiling(forceRefresh = false): Promise<BulletinSheetRow[]> {
  return fetchSheetRows("DatesForFiling", forceRefresh);
}

export async function getPreviousDatesForFiling(forceRefresh = false): Promise<BulletinSheetRow[]> {
  return fetchSheetRows("PreviousDatesForFiling", forceRefresh);
}

/** Loads all four sheets sequentially and logs each result. */
export async function loadAllVisaBulletinSheets(options?: {
  forceRefresh?: boolean;
}): Promise<{
  FinalActionDates: BulletinSheetRow[];
  DatesForFiling: BulletinSheetRow[];
  PreviousFinalActionDates: BulletinSheetRow[];
  PreviousDatesForFiling: BulletinSheetRow[];
}> {
  const forceRefresh = options?.forceRefresh ?? false;
  const FinalActionDates = await getCurrentFinalActionDates(forceRefresh);
  const DatesForFiling = await getCurrentDatesForFiling(forceRefresh);
  const PreviousFinalActionDates = await getPreviousFinalActionDates(forceRefresh);
  const PreviousDatesForFiling = await getPreviousDatesForFiling(forceRefresh);

  console.log("[visa-bulletin] All sheets loaded:", {
    FinalActionDates: FinalActionDates.length,
    DatesForFiling: DatesForFiling.length,
    PreviousFinalActionDates: PreviousFinalActionDates.length,
    PreviousDatesForFiling: PreviousDatesForFiling.length,
  });

  return {
    FinalActionDates,
    DatesForFiling,
    PreviousFinalActionDates,
    PreviousDatesForFiling,
  };
}
