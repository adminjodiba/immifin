/**
 * Multi-sheet visa bulletin loaders (Google Sheets published CSV).
 * Existing calculators/pages continue using getVisaBulletinData() in visaBulletinData.ts.
 */

export type VisaBulletinSheetName =
  | "FinalActionDates"
  | "DatesForFiling"
  | "PreviousFinalActionDates"
  | "PreviousDatesForFiling";

export type BulletinSheetRow = {
  category: string;
  country: string;
  cutoffDate: string;
};

const DEFAULT_PUBLISH_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrvwKJOe-I0igAx68wdLWrr5dC6bSgTSMJ6K1_RwTjXuWa2YHM7dzMfdBhKgFmt4uSoHu0KqQN90YP/pub";

const DEFAULT_FINAL_ACTION_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrvwKJOe-I0igAx68wdLWrr5dC6bSgTSMJ6K1_RwTjXuWa2YHM7dzMfdBhKgFmt4uSoHu0KqQN90YP/pub?output=csv";

const DEFAULT_HISTORY_GID = "1745588952";

const HISTORY_URL_ENV = "VISA_BULLETIN_URL_HISTORY";
const HISTORY_GID_ENV = "VISA_BULLETIN_GID_HISTORY";

const sheetUrlEnvKeys: Record<VisaBulletinSheetName, string> = {
  FinalActionDates: "VISA_BULLETIN_URL_FINAL_ACTION_DATES",
  DatesForFiling: "VISA_BULLETIN_URL_DATES_FOR_FILING",
  PreviousFinalActionDates: "VISA_BULLETIN_URL_PREVIOUS_FINAL_ACTION_DATES",
  PreviousDatesForFiling: "VISA_BULLETIN_URL_PREVIOUS_DATES_FOR_FILING",
};

const sheetGidEnvKeys: Record<VisaBulletinSheetName, string> = {
  FinalActionDates: "VISA_BULLETIN_GID_FINAL_ACTION_DATES",
  DatesForFiling: "VISA_BULLETIN_GID_DATES_FOR_FILING",
  PreviousFinalActionDates: "VISA_BULLETIN_GID_PREVIOUS_FINAL_ACTION_DATES",
  PreviousDatesForFiling: "VISA_BULLETIN_GID_PREVIOUS_DATES_FOR_FILING",
};

function buildPublishCsvUrl(gid: string): string {
  const base = process.env.VISA_BULLETIN_PUBLISH_BASE ?? DEFAULT_PUBLISH_BASE;
  return `${base}?gid=${gid}&single=true&output=csv`;
}

function resolveSheetUrl(sheetName: VisaBulletinSheetName): string {
  const directUrl = process.env[sheetUrlEnvKeys[sheetName]]?.trim();
  if (directUrl) {
    return directUrl;
  }

  const gid = process.env[sheetGidEnvKeys[sheetName]]?.trim();
  if (gid) {
    return buildPublishCsvUrl(gid);
  }

  if (sheetName === "FinalActionDates") {
    return process.env.VISA_BULLETIN_CSV_URL ?? DEFAULT_FINAL_ACTION_CSV_URL;
  }

  throw new Error(
    `Missing sheet URL for ${sheetName}. Set ${sheetUrlEnvKeys[sheetName]} or ${sheetGidEnvKeys[sheetName]} in .env.local.`,
  );
}

function resolveHistorySheetUrl(): string {
  const directUrl = process.env[HISTORY_URL_ENV]?.trim();
  if (directUrl) {
    return directUrl;
  }

  const gid = process.env[HISTORY_GID_ENV]?.trim() ?? DEFAULT_HISTORY_GID;
  return buildPublishCsvUrl(gid);
}

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
  const response = await fetch(url, { next: { revalidate: 86400 } });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${label} (${response.status})`);
  }

  return response.text();
}

async function fetchSheetRows(sheetName: VisaBulletinSheetName): Promise<BulletinSheetRow[]> {
  const url = resolveSheetUrl(sheetName);
  const csvText = await fetchCsvText(url, sheetName);
  const rows = parseCsvRows(csvText);

  console.log(`[visa-bulletin] ${sheetName}: loaded ${rows.length} rows from ${url}`);
  console.log(`[visa-bulletin] ${sheetName} sample:`, rows.slice(0, 3));

  return rows;
}

export async function fetchVisaBulletinHistoryCsvRows(): Promise<string[][]> {
  const url = resolveHistorySheetUrl();
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
