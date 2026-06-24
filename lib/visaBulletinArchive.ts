import { appendSheetValues, readSheetValues } from "@/lib/googleSheetsClient";
import {
  getCurrentDatesForFiling,
  getCurrentFinalActionDates,
  type BulletinSheetRow,
} from "@/lib/visaBulletinSheets";

export type BulletinHistoryType = "FinalAction" | "Filing";

export type BulletinHistoryRow = {
  month: string;
  type: BulletinHistoryType;
  category: string;
  country: string;
  cutoffDate: string;
};

export type ArchiveVisaBulletinSuccess = {
  success: true;
  recordsAdded: number;
};

export type ArchiveVisaBulletinFailure = {
  success: false;
  message: string;
};

export type ArchiveVisaBulletinResult = ArchiveVisaBulletinSuccess | ArchiveVisaBulletinFailure;

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const HISTORY_SHEET_NAME = process.env.VISA_BULLETIN_HISTORY_SHEET?.trim() || "VisaBulletinHistory";

export function parseArchiveMonth(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const month = value.trim();
  return MONTH_PATTERN.test(month) ? month : null;
}

function toHistoryRows(
  month: string,
  type: BulletinHistoryType,
  rows: BulletinSheetRow[],
): BulletinHistoryRow[] {
  return rows.map((row) => ({
    month,
    type,
    category: row.category,
    country: row.country,
    cutoffDate: row.cutoffDate,
  }));
}

function toSheetValues(rows: BulletinHistoryRow[]): string[][] {
  return rows.map((row) => [row.month, row.type, row.category, row.country, row.cutoffDate]);
}

async function monthAlreadyArchived(month: string): Promise<boolean> {
  const values = await readSheetValues(`${HISTORY_SHEET_NAME}!A2:A`);

  return values.some((row) => (row[0] ?? "").trim() === month);
}

export async function archiveVisaBulletinMonth(month: string): Promise<ArchiveVisaBulletinResult> {
  if (await monthAlreadyArchived(month)) {
    return {
      success: false,
      message: "Month already archived",
    };
  }

  const [finalActionRows, filingRows] = await Promise.all([
    getCurrentFinalActionDates(),
    getCurrentDatesForFiling(),
  ]);

  const historyRows = [
    ...toHistoryRows(month, "FinalAction", finalActionRows),
    ...toHistoryRows(month, "Filing", filingRows),
  ];

  if (historyRows.length === 0) {
    return {
      success: false,
      message: "No visa bulletin rows available to archive",
    };
  }

  await appendSheetValues(`${HISTORY_SHEET_NAME}!A:E`, toSheetValues(historyRows));

  console.log("[visa-bulletin-archive] archived month:", {
    month,
    recordsAdded: historyRows.length,
    finalActionRows: finalActionRows.length,
    filingRows: filingRows.length,
  });

  return {
    success: true,
    recordsAdded: historyRows.length,
  };
}
