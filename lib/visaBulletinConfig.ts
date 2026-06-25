export const VISA_BULLETIN_PUBLISH_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTrvwKJOe-I0igAx68wdLWrr5dC6bSgTSMJ6K1_RwTjXuWa2YHM7dzMfdBhKgFmt4uSoHu0KqQN90YP/pub";

export const VISA_BULLETIN_GIDS = {
  FinalActionDates: "0",
  DatesForFiling: "909059527",
  PreviousFinalActionDates: "267529746",
  PreviousDatesForFiling: "175108841",
  VisaBulletinHistory: "1745588952",
} as const;

export type VisaBulletinSheetKey = keyof typeof VISA_BULLETIN_GIDS;

const GID_ENV_OVERRIDES: Record<VisaBulletinSheetKey, string> = {
  FinalActionDates: "VISA_BULLETIN_GID_FINAL_ACTION_DATES",
  DatesForFiling: "VISA_BULLETIN_GID_DATES_FOR_FILING",
  PreviousFinalActionDates: "VISA_BULLETIN_GID_PREVIOUS_FINAL_ACTION_DATES",
  PreviousDatesForFiling: "VISA_BULLETIN_GID_PREVIOUS_DATES_FOR_FILING",
  VisaBulletinHistory: "VISA_BULLETIN_GID_HISTORY",
};

export function getVisaBulletinPublishBase(): string {
  return process.env.VISA_BULLETIN_PUBLISH_BASE?.trim() || VISA_BULLETIN_PUBLISH_BASE;
}

export function resolveVisaBulletinGid(sheet: VisaBulletinSheetKey): string {
  const override = process.env[GID_ENV_OVERRIDES[sheet]]?.trim();
  return override || VISA_BULLETIN_GIDS[sheet];
}

export function resolveVisaBulletinCsvUrl(sheet: VisaBulletinSheetKey): string {
  const base = getVisaBulletinPublishBase();
  const gid = resolveVisaBulletinGid(sheet);

  if (gid === "0") {
    return `${base}?output=csv`;
  }

  return `${base}?gid=${gid}&single=true&output=csv`;
}
