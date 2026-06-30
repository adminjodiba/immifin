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

async function fetchCsvText(url: string, label: string): Promise<string> {
  const response = await fetch(url, {
    next: { revalidate: 86400, tags: [`visa-bulletin-sheet-${label}`] },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${label} (${response.status})`);
  }

  return response.text();
}

async function fetchSheetRows(sheetName: VisaBulletinSheetName): Promise<BulletinSheetRow[]> {
  const url = resolveVisaBulletinCsvUrl(sheetName);
  const csvText = await fetchCsvText(url, sheetName);
  const rows = parseCsvRows(csvText);

  console.log(`[visa-bulletin] ${sheetName}: loaded ${rows.length} rows from ${url}`);
  console.log(`[visa-bulletin] ${sheetName} sample:`, rows.slice(0, 3));

  return rows;
}

export async function fetchVisaBulletinHistoryCsvRows(): Promise<string[][]> {
  const url = resolveVisaBulletinCsvUrl("VisaBulletinHistory");
  const csvText = await fetchCsvText(url, "VisaBulletinHistory");
  const rows = parseCsvMatrix(csvText);
  const dataRows = rows.length <= 1 ? [] : rows.slice(1);

  console.log(`[visa-bulletin] VisaBulletinHistory: loaded ${dataRows.length} rows from ${url}`);
  console.log(`[visa-bulletin] VisaBulletinHistory sample:`, dataRows.slice(0, 3));

  return dataRows;
}

export async function getCurrentFinalActionDates(): Promise<BulletinSheetRow[]> {
  return fetchSheetRows("FinalActionDates");
}

export async function getPreviousFinalActionDates(): Promise<BulletinSheetRow[]> {
  return fetchSheetRows("PreviousFinalActionDates");
}

export async function getCurrentDatesForFiling(): Promise<BulletinSheetRow[]> {
  return fetchSheetRows("DatesForFiling");
}

export async function getPreviousDatesForFiling(): Promise<BulletinSheetRow[]> {
  return fetchSheetRows("PreviousDatesForFiling");
}

/** Loads all four sheets sequentially and logs each result. */
export async function loadAllVisaBulletinSheets(): Promise<{
  FinalActionDates: BulletinSheetRow[];
  DatesForFiling: BulletinSheetRow[];
  PreviousFinalActionDates: BulletinSheetRow[];
  PreviousDatesForFiling: BulletinSheetRow[];
}> {
  const FinalActionDates = await getCurrentFinalActionDates();
  const DatesForFiling = await getCurrentDatesForFiling();
  const PreviousFinalActionDates = await getPreviousFinalActionDates();
  const PreviousDatesForFiling = await getPreviousDatesForFiling();

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
