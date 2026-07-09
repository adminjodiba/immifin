import { getVisaBulletinPublishBase } from "@/lib/visaBulletinConfig";

/**
 * Immifin GC Dates — stamping worksheet tab gids (published CSV).
 * Override via STAMPING_WAIT_TIME_GID_* env vars when tabs change.
 */
export const STAMPING_WAIT_TIME_GIDS = {
  StampingWaitTimeCurrent: "1221088813",
  StampingWaitTimeHistory: "739284281",
  StampingCityMetadata: "1647689253",
} as const;

export type StampingSheetKey = keyof typeof STAMPING_WAIT_TIME_GIDS;

const GID_ENV_OVERRIDES: Record<StampingSheetKey, string> = {
  StampingWaitTimeCurrent: "STAMPING_WAIT_TIME_GID_CURRENT",
  StampingWaitTimeHistory: "STAMPING_WAIT_TIME_GID_HISTORY",
  StampingCityMetadata: "STAMPING_WAIT_TIME_GID_CITY_METADATA",
};

/** Same workbook as admin Google Sheets API (GOOGLE_SHEET_ID / GOOGLE_SPREADSHEET_ID). */
export function getGoogleSpreadsheetId(): string {
  return process.env.GOOGLE_SPREADSHEET_ID?.trim() || process.env.GOOGLE_SHEET_ID?.trim() || "";
}

export function resolveStampingGid(sheet: StampingSheetKey): string {
  const override = process.env[GID_ENV_OVERRIDES[sheet]]?.trim();
  return override || STAMPING_WAIT_TIME_GIDS[sheet];
}

/** Published CSV URL — same pattern as resolveVisaBulletinCsvUrl(). */
export function resolveStampingCsvUrl(sheet: StampingSheetKey): string {
  const base = getVisaBulletinPublishBase();
  const gid = resolveStampingGid(sheet);

  return `${base}?gid=${gid}&single=true&output=csv`;
}
