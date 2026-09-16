export type GoogleSheetRefreshTrigger = "admin" | "scheduled";

export type GoogleSheetRefreshActor = {
  profileId: string | null;
  clerkUserId: string;
  email: string;
};

export const SCHEDULED_SHEET_SYNC_ACTOR: GoogleSheetRefreshActor = {
  profileId: null,
  clerkUserId: "system:daily-sheet-sync",
  email: "system@immifin.scheduled",
};

export type VisaBulletinRefreshMetadata = {
  source: "Google Sheets";
  lastUpdated: string;
  count: number;
  rowCounts: {
    FinalActionDates: number;
    DatesForFiling: number;
    PreviousFinalActionDates: number;
    PreviousDatesForFiling: number;
    VisaBulletinHistory: number;
  };
  latestMonth: string | null;
};

export type VisaStampingRefreshMetadata = {
  source: "Google Sheets";
  lastUpdated: string;
  count: number;
  countries: string[];
};
