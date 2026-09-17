/**
 * Development-only Visa Bulletin source override.
 *
 * Impossible to activate in Production: requires NODE_ENV === "development"
 * AND IMMIFIN_DEV_VISA_BULLETIN_FIXTURE=true (default OFF).
 *
 * October 2026 current + September 2026 previous TEST cutoffs live in
 * DEV_VISA_BULLETIN_FIXTURE_CUTOFFS. Not official Department of State dates.
 */

export const DEV_VISA_BULLETIN_FIXTURE_FLAG = "IMMIFIN_DEV_VISA_BULLETIN_FIXTURE";
export const DEV_VISA_BULLETIN_FIXTURE_CURRENT_MONTH = "2026-10";
export const DEV_VISA_BULLETIN_FIXTURE_PREVIOUS_MONTH = "2026-09";
/**
 * Simulated Campaign Details "Bulletin Refreshed" value while the fixture is on.
 * TEST DATA ONLY — not a Department of State publication timestamp.
 * Never written to admin_audit_log. Ignored unless the fixture is active.
 * America/Chicago (CDT, UTC-5) on 2026-10-10.
 */
export const DEV_VISA_BULLETIN_FIXTURE_REFRESHED_AT = "2026-10-10T15:20:00-05:00";
export const DEV_VISA_BULLETIN_FIXTURE_SEND_BLOCKED_MESSAGE =
  "Sending is disabled while Visa Bulletin test data is active.";

export type DevVisaBulletinSheetName =
  | "FinalActionDates"
  | "DatesForFiling"
  | "PreviousFinalActionDates"
  | "PreviousDatesForFiling";

export type DevVisaBulletinSheetRow = {
  category: string;
  country: string;
  cutoffDate: string;
};

type CutoffPair = {
  /** Simulated September 2026 previous tab. Not an official DOS date. */
  previous: string;
  /** Simulated October 2026 current tab. Not an official DOS date. */
  current: string;
};

const CATEGORIES = ["EB-1", "EB-2", "EB-3", "EB-4", "EB-5"] as const;
const COUNTRIES = [
  "Rest of the World",
  "China",
  "India",
  "Mexico",
  "Philippines",
] as const;

/**
 * Product Owner TEST cutoffs for September 2026 (previous) and October 2026 (current).
 * Canonical store: "C", "U", or YYYY-MM-DD. Not official DOS dates.
 * EB-4 / EB-5 remain compile placeholders and are outside this test.
 */
const DEV_VISA_BULLETIN_FIXTURE_CUTOFFS: Record<
  (typeof CATEGORIES)[number],
  Record<(typeof COUNTRIES)[number], { finalAction: CutoffPair; datesForFiling: CutoffPair }>
> = {
  "EB-1": {
    "Rest of the World": {
      finalAction: { previous: "C", current: "C" },
      datesForFiling: { previous: "C", current: "C" },
    },
    China: {
      finalAction: { previous: "2023-07-01", current: "2022-07-01" },
      datesForFiling: { previous: "2023-12-01", current: "2022-12-01" },
    },
    India: {
      finalAction: { previous: "2022-10-15", current: "2021-10-15" },
      datesForFiling: { previous: "2023-12-01", current: "2021-12-01" },
    },
    Mexico: {
      finalAction: { previous: "C", current: "C" },
      datesForFiling: { previous: "C", current: "C" },
    },
    Philippines: {
      finalAction: { previous: "C", current: "C" },
      datesForFiling: { previous: "C", current: "C" },
    },
  },
  "EB-2": {
    "Rest of the World": {
      finalAction: { previous: "C", current: "C" },
      datesForFiling: { previous: "C", current: "C" },
    },
    China: {
      finalAction: { previous: "2021-09-01", current: "2021-09-01" },
      datesForFiling: { previous: "2022-01-01", current: "2020-01-01" },
    },
    India: {
      finalAction: { previous: "U", current: "2012-03-01" },
      datesForFiling: { previous: "2015-01-15", current: "2012-01-15" },
    },
    Mexico: {
      finalAction: { previous: "C", current: "C" },
      datesForFiling: { previous: "C", current: "C" },
    },
    Philippines: {
      finalAction: { previous: "C", current: "C" },
      datesForFiling: { previous: "C", current: "C" },
    },
  },
  "EB-3": {
    "Rest of the World": {
      finalAction: { previous: "2024-09-01", current: "2023-09-01" },
      datesForFiling: { previous: "C", current: "C" },
    },
    China: {
      finalAction: { previous: "2022-01-01", current: "2021-01-01" },
      datesForFiling: { previous: "2022-01-08", current: "2021-01-08" },
    },
    India: {
      finalAction: { previous: "2014-01-01", current: "2012-01-01" },
      datesForFiling: { previous: "2015-01-15", current: "2012-01-15" },
    },
    Mexico: {
      finalAction: { previous: "2024-09-01", current: "2023-09-01" },
      datesForFiling: { previous: "C", current: "C" },
    },
    Philippines: {
      finalAction: { previous: "2023-08-01", current: "2022-08-01" },
      datesForFiling: { previous: "2024-01-01", current: "2022-01-01" },
    },
  },
  "EB-4": {
    "Rest of the World": {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
    China: {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
    India: {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
    Mexico: {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
    Philippines: {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
  },
  "EB-5": {
    "Rest of the World": {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
    China: {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
    India: {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
    Mexico: {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
    Philippines: {
      finalAction: { previous: "1999-01-01", current: "1999-02-01" },
      datesForFiling: { previous: "1999-03-01", current: "1999-04-01" },
    },
  },
};

function isTruthyFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

/** Server-only. Never true when NODE_ENV !== "development". */
export function isDevVisaBulletinFixtureActive(): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  // Static process.env.NAME so Next.js webpack inlines the flag into API-route
  // bundles. Dynamic process.env[FLAG] is omitted from those bundles, so the
  // summary path kept Production history while the RSC banner still saw .env.local.
  return isTruthyFlag(process.env.IMMIFIN_DEV_VISA_BULLETIN_FIXTURE);
}

function cutoffFor(
  sheet: DevVisaBulletinSheetName,
  category: (typeof CATEGORIES)[number],
  country: (typeof COUNTRIES)[number],
): string {
  const pair =
    sheet === "DatesForFiling" || sheet === "PreviousDatesForFiling"
      ? DEV_VISA_BULLETIN_FIXTURE_CUTOFFS[category][country].datesForFiling
      : DEV_VISA_BULLETIN_FIXTURE_CUTOFFS[category][country].finalAction;

  return sheet.startsWith("Previous") ? pair.previous : pair.current;
}

export function getDevVisaBulletinFixtureSheetRows(
  sheet: DevVisaBulletinSheetName,
): DevVisaBulletinSheetRow[] {
  const rows: DevVisaBulletinSheetRow[] = [];

  for (const category of CATEGORIES) {
    for (const country of COUNTRIES) {
      rows.push({
        category,
        country,
        cutoffDate: cutoffFor(sheet, category, country),
      });
    }
  }

  return rows;
}

/** History CSV body rows: month, type, category, country, cutoffDate */
export function getDevVisaBulletinFixtureHistoryRows(): string[][] {
  const rows: string[][] = [];

  for (const category of CATEGORIES) {
    for (const country of COUNTRIES) {
      rows.push([
        DEV_VISA_BULLETIN_FIXTURE_PREVIOUS_MONTH,
        "FinalAction",
        category,
        country,
        DEV_VISA_BULLETIN_FIXTURE_CUTOFFS[category][country].finalAction.previous,
      ]);
      rows.push([
        DEV_VISA_BULLETIN_FIXTURE_PREVIOUS_MONTH,
        "Filing",
        category,
        country,
        DEV_VISA_BULLETIN_FIXTURE_CUTOFFS[category][country].datesForFiling.previous,
      ]);
      rows.push([
        DEV_VISA_BULLETIN_FIXTURE_CURRENT_MONTH,
        "FinalAction",
        category,
        country,
        DEV_VISA_BULLETIN_FIXTURE_CUTOFFS[category][country].finalAction.current,
      ]);
      rows.push([
        DEV_VISA_BULLETIN_FIXTURE_CURRENT_MONTH,
        "Filing",
        category,
        country,
        DEV_VISA_BULLETIN_FIXTURE_CUTOFFS[category][country].datesForFiling.current,
      ]);
    }
  }

  return rows;
}
