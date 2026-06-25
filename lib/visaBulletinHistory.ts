import { unstable_cache } from "next/cache";
import { fetchVisaBulletinHistoryCsvRows } from "@/lib/visaBulletinSheets";
import {
  normalizeSheetCategory,
  normalizeSheetCountry,
  parseBulletinCutoffDate,
} from "@/lib/visaBulletinData";
import type { BulletinHistoryType } from "@/lib/visaBulletinArchive";

export type { BulletinHistoryType };

export type VisaBulletinHistoryRecord = {
  month: string;
  category: string;
  country: string;
  type: BulletinHistoryType;
  cutoffDate: string;
};

export type VisaBulletinHistoryQuery = {
  category?: string;
  country?: string;
  type?: BulletinHistoryType;
};

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
export const VISA_BULLETIN_HISTORY_REVALIDATE_SECONDS = 86400;

export function normalizeMonth(month: string): string {
  const trimmed = month.trim();

  if (MONTH_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(\d{4})[\s/-](\d{1,2})$/);
  if (!match) {
    return trimmed;
  }

  const year = match[1];
  const monthNumber = match[2].padStart(2, "0");
  const normalized = `${year}-${monthNumber}`;

  return MONTH_PATTERN.test(normalized) ? normalized : trimmed;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeHistoryTypeInput(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]/g, "");
}

const HISTORY_TYPE_ALIASES: Record<string, BulletinHistoryType> = {
  finalaction: "FinalAction",
  finalactiondates: "FinalAction",
  filing: "Filing",
  datesforfiling: "Filing",
};

export function normalizeHistoryType(value: string): BulletinHistoryType | null {
  const normalized = normalizeHistoryTypeInput(value);
  return HISTORY_TYPE_ALIASES[normalized] ?? null;
}

export function parseHistoryType(value: string | null): BulletinHistoryType | null | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  return normalizeHistoryType(value);
}

export function formatHistoryCutoffDate(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const parsed = parseBulletinCutoffDate(trimmed);

  if (parsed === "C") {
    return "C";
  }

  if (parsed === "U") {
    return "U";
  }

  return trimmed;
}

function parseHistoryRow(row: string[]): VisaBulletinHistoryRecord | null {
  const [monthValue, type, category, country, cutoffDate] = row;
  const month = normalizeMonth(monthValue ?? "");

  if (!month || !MONTH_PATTERN.test(month)) {
    return null;
  }

  const parsedType = parseHistoryType(type ?? null);
  if (!parsedType) {
    return null;
  }

  if (!category?.trim() || !country?.trim()) {
    return null;
  }

  return {
    month,
    category: category.trim(),
    country: country.trim(),
    type: parsedType,
    cutoffDate: formatHistoryCutoffDate(cutoffDate ?? ""),
  };
}

function matchesQuery(record: VisaBulletinHistoryRecord, query: VisaBulletinHistoryQuery): boolean {
  if (query.category) {
    const filterCategory = normalizeSheetCategory(query.category);
    const recordCategory = normalizeSheetCategory(record.category);

    if (normalizeKey(recordCategory) !== normalizeKey(filterCategory)) {
      return false;
    }
  }

  if (query.country) {
    const filterCountry = normalizeSheetCountry(query.country);
    const recordCountry = normalizeSheetCountry(record.country);

    if (normalizeKey(recordCountry) !== normalizeKey(filterCountry)) {
      return false;
    }
  }

  if (query.type && record.type !== query.type) {
    return false;
  }

  return true;
}

async function loadAllVisaBulletinHistoryRecords(): Promise<VisaBulletinHistoryRecord[]> {
  const values = await fetchVisaBulletinHistoryCsvRows();

  return values
    .map(parseHistoryRow)
    .filter((record): record is VisaBulletinHistoryRecord => record !== null)
    .sort((a, b) => a.month.localeCompare(b.month));
}

const getCachedVisaBulletinHistoryRecords = unstable_cache(
  loadAllVisaBulletinHistoryRecords,
  ["visa-bulletin-history-records"],
  { revalidate: VISA_BULLETIN_HISTORY_REVALIDATE_SECONDS },
);

export async function getVisaBulletinHistory(
  query: VisaBulletinHistoryQuery = {},
): Promise<VisaBulletinHistoryRecord[]> {
  const records = await getCachedVisaBulletinHistoryRecords();

  return records.filter((record) => matchesQuery(record, query));
}
