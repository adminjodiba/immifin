/**
 * Stamping wait-time sheet loaders (Google Sheets published CSV).
 * Mirrors lib/visaBulletinSheets.ts — same fetch/cache pattern, header-based rows.
 */

import { resolveStampingCsvUrl, type StampingSheetKey } from "@/lib/visaStampingConfig";

export type StampingCsvRow = Record<string, string>;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const next = line[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsvMatrix(csvText: string): string[][] {
  return csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseCsvLine)
    .filter((row) => row.some((cell) => cell !== ""));
}

export function parseStampingHeaderCsvRows(csvText: string): StampingCsvRow[] {
  const rows = parseCsvMatrix(csvText);

  if (rows.length <= 1) {
    return [];
  }

  const headerKeys = rows[0]!.map(normalizeHeader);

  return rows.slice(1).map((values) => {
    const row: StampingCsvRow = {};
    headerKeys.forEach((key, index) => {
      row[key] = values[index]?.trim() ?? "";
    });
    return row;
  });
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

async function fetchStampingSheetRows(
  sheetName: StampingSheetKey,
  forceRefresh = false,
): Promise<StampingCsvRow[]> {
  const url = resolveStampingCsvUrl(sheetName);
  const csvText = await fetchCsvText(url, sheetName, forceRefresh);
  const rows = parseStampingHeaderCsvRows(csvText);

  console.log(`[visa-stamping] ${sheetName}: loaded ${rows.length} rows from ${url}`);
  console.log(`[visa-stamping] ${sheetName} sample:`, rows.slice(0, 3));

  return rows;
}

export async function getCurrentStampingWaitTimes(forceRefresh = false): Promise<StampingCsvRow[]> {
  return fetchStampingSheetRows("StampingWaitTimeCurrent", forceRefresh);
}

export async function getHistoricalStampingWaitTimes(forceRefresh = false): Promise<StampingCsvRow[]> {
  return fetchStampingSheetRows("StampingWaitTimeHistory", forceRefresh);
}

export async function getStampingCityMetadata(forceRefresh = false): Promise<StampingCsvRow[]> {
  return fetchStampingSheetRows("StampingCityMetadata", forceRefresh);
}
