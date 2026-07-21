import { toCivilIsoDate } from "@/lib/dates/civilDate";
import {
  getCurrentDatesForFiling,
  getCurrentFinalActionDates,
} from "@/lib/visaBulletinSheets";

export type ChargeabilityArea =
  | "all"
  | "china"
  | "india"
  | "mexico"
  | "philippines";

export type EmploymentCategory = "EB1" | "EB2" | "EB3" | "EB4" | "EB5";

export type FamilyCategory = "F1" | "F2A" | "F2B" | "F3" | "F4";

export type VisaCategory = EmploymentCategory | FamilyCategory;

/** "C" = current (no backlog). Otherwise an ISO date string (YYYY-MM-DD). */
export type BulletinDate = string | "C";

export type CategoryCutoff = {
  finalAction: BulletinDate;
  datesForFiling: BulletinDate;
};

export type VisaBulletin = {
  month: string;
  year: number;
  publishedAt: string;
  employment: Record<EmploymentCategory, Record<ChargeabilityArea, CategoryCutoff>>;
  family: Record<FamilyCategory, Record<ChargeabilityArea, CategoryCutoff>>;
};

const allCurrent: CategoryCutoff = { finalAction: "C", datesForFiling: "C" };

function cutoff(finalAction: BulletinDate, datesForFiling: BulletinDate): CategoryCutoff {
  return { finalAction, datesForFiling };
}

/**
 * Sample visa bulletin data for calculator demos.
 * Replace with the latest USCIS Visa Bulletin values when publishing.
 * @see https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html
 */
export const latestVisaBulletin: VisaBulletin = {
  month: "June",
  year: 2025,
  publishedAt: "2025-05-15",
  employment: {
    EB1: {
      all: allCurrent,
      china: cutoff("2022-09-01", "2022-11-01"),
      india: cutoff("2022-02-01", "2022-04-01"),
      mexico: allCurrent,
      philippines: allCurrent,
    },
    EB2: {
      all: cutoff("2023-01-01", "2023-03-01"),
      china: cutoff("2020-06-01", "2020-08-01"),
      india: cutoff("2012-05-01", "2012-07-01"),
      mexico: cutoff("2023-01-01", "2023-03-01"),
      philippines: cutoff("2023-01-01", "2023-03-01"),
    },
    EB3: {
      all: cutoff("2022-06-01", "2022-08-01"),
      china: cutoff("2020-01-01", "2020-03-01"),
      india: cutoff("2012-08-01", "2012-10-01"),
      mexico: cutoff("2022-06-01", "2022-08-01"),
      philippines: cutoff("2022-06-01", "2022-08-01"),
    },
    EB4: {
      all: cutoff("2021-03-01", "2021-05-01"),
      china: cutoff("2021-03-01", "2021-05-01"),
      india: cutoff("2021-03-01", "2021-05-01"),
      mexico: cutoff("2021-03-01", "2021-05-01"),
      philippines: cutoff("2021-03-01", "2021-05-01"),
    },
    EB5: {
      all: cutoff("2022-04-01", "2022-06-01"),
      china: cutoff("2015-12-01", "2016-02-01"),
      india: cutoff("2022-04-01", "2022-06-01"),
      mexico: cutoff("2022-04-01", "2022-06-01"),
      philippines: cutoff("2022-04-01", "2022-06-01"),
    },
  },
  family: {
    F1: {
      all: cutoff("2018-01-01", "2018-03-01"),
      china: cutoff("2018-01-01", "2018-03-01"),
      india: cutoff("2018-01-01", "2018-03-01"),
      mexico: cutoff("2008-06-01", "2008-08-01"),
      philippines: cutoff("2014-03-01", "2014-05-01"),
    },
    F2A: {
      all: allCurrent,
      china: allCurrent,
      india: allCurrent,
      mexico: cutoff("2021-07-01", "2021-09-01"),
      philippines: allCurrent,
    },
    F2B: {
      all: cutoff("2016-05-01", "2016-07-01"),
      china: cutoff("2016-05-01", "2016-07-01"),
      india: cutoff("2016-05-01", "2016-07-01"),
      mexico: cutoff("2006-02-01", "2006-04-01"),
      philippines: cutoff("2011-10-01", "2011-12-01"),
    },
    F3: {
      all: cutoff("2010-03-01", "2010-05-01"),
      china: cutoff("2010-03-01", "2010-05-01"),
      india: cutoff("2010-03-01", "2010-05-01"),
      mexico: cutoff("2000-04-01", "2000-06-01"),
      philippines: cutoff("2003-03-01", "2003-05-01"),
    },
    F4: {
      all: cutoff("2007-09-01", "2007-11-01"),
      china: cutoff("2007-09-01", "2007-11-01"),
      india: cutoff("2005-10-01", "2005-12-01"),
      mexico: cutoff("2000-01-01", "2000-03-01"),
      philippines: cutoff("2006-03-01", "2006-05-01"),
    },
  },
};

export const chargeabilityOptions: { value: ChargeabilityArea; label: string }[] = [
  { value: "all", label: "All other countries" },
  { value: "china", label: "China (mainland born)" },
  { value: "india", label: "India" },
  { value: "mexico", label: "Mexico" },
  { value: "philippines", label: "Philippines" },
];

export const employmentCategoryOptions: { value: EmploymentCategory; label: string }[] = [
  { value: "EB1", label: "EB-1 (Priority workers)" },
  { value: "EB2", label: "EB-2 (Advanced degree / NIW)" },
  { value: "EB3", label: "EB-3 (Skilled workers)" },
  { value: "EB4", label: "EB-4 (Special immigrants)" },
  { value: "EB5", label: "EB-5 (Investors)" },
];

export const familyCategoryOptions: { value: FamilyCategory; label: string }[] = [
  { value: "F1", label: "F1 (Unmarried sons/daughters of U.S. citizens)" },
  { value: "F2A", label: "F2A (Spouses/children of permanent residents)" },
  { value: "F2B", label: "F2B (Unmarried adult children of permanent residents)" },
  { value: "F3", label: "F3 (Married sons/daughters of U.S. citizens)" },
  { value: "F4", label: "F4 (Siblings of U.S. citizens)" },
];

export type PriorityDateStatus = "current" | "eligible" | "waiting";

export type PriorityDateComparison = {
  status: PriorityDateStatus;
  cutoffDate: BulletinDate;
  bulletinLabel: string;
  message: string;
};

export function getBulletinLabel(bulletin: VisaBulletin = latestVisaBulletin): string {
  return `${bulletin.month} ${bulletin.year} Visa Bulletin`;
}

export function getCategoryCutoff(
  category: VisaCategory,
  chargeability: ChargeabilityArea,
  useFilingDate = false,
  bulletin: VisaBulletin = latestVisaBulletin,
): CategoryCutoff {
  const table = category.startsWith("EB") ? bulletin.employment : bulletin.family;
  const entry: any = (table as any)[category][chargeability];

  return useFilingDate
    ? {
        finalAction: entry.datesForFiling,
        datesForFiling: entry.datesForFiling,
      }
    : entry;
}

export function comparePriorityDate(
  priorityDate: string,
  category: VisaCategory,
  chargeability: ChargeabilityArea,
  useFilingDate = false,
  bulletin: VisaBulletin = latestVisaBulletin,
): PriorityDateComparison | null {
  const parsed = new Date(`${priorityDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const { finalAction, datesForFiling } = getCategoryCutoff(
    category,
    chargeability,
    useFilingDate,
    bulletin,
  );
  const cutoffDate = useFilingDate ? datesForFiling : finalAction;
  const bulletinLabel = getBulletinLabel(bulletin);

  if (cutoffDate === "C") {
    return {
      status: "current",
      cutoffDate,
      bulletinLabel,
      message: "This category is current. Your priority date may be eligible now.",
    };
  }

  const cutoff = new Date(`${cutoffDate}T00:00:00`);

  if (parsed <= cutoff) {
    return {
      status: "eligible",
      cutoffDate,
      bulletinLabel,
      message: "Your priority date is on or before the published cutoff date.",
    };
  }

  return {
    status: "waiting",
    cutoffDate,
    bulletinLabel,
    message: "Your priority date is after the published cutoff. You are still waiting.",
  };
}

export function formatBulletinDate(date: BulletinDate): string {
  if (date === "C") {
    return "Current (C)";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export type VisaBulletinDataType = "final-action" | "filing";

export type VisaBulletinRow = {
  category: string;
  country: string;
  finalActionDate: string;
};

export async function getVisaBulletinData(
  type: VisaBulletinDataType = "final-action",
): Promise<VisaBulletinRow[]> {
  const sheetRows =
    type === "filing"
      ? await getCurrentDatesForFiling()
      : await getCurrentFinalActionDates();

  return sheetRows.map((row) => ({
    category: row.category,
    country: row.country,
    finalActionDate: row.cutoffDate,
  }));
}

const sheetCountryAliases: Record<string, string> = {
  all: "Rest of the World",
  "rest of the world": "Rest of the World",
  row: "Rest of the World",
  china: "China",
  india: "India",
  mexico: "Mexico",
  philippines: "Philippines",
};

export function normalizeSheetCountry(country: string): string {
  return sheetCountryAliases[country.trim().toLowerCase()] ?? country.trim();
}

export function normalizeSheetCategory(category: string): string {
  const trimmed = category.trim();
  const match = trimmed.match(/^(eb|f)(\d+[ab]?)$/i);
  if (match) {
    return `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()}${match[2].toUpperCase()}`;
  }
  return trimmed;
}

export function parseBulletinCutoffDate(value: string): BulletinDate | "U" {
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();

  if (!trimmed || upper === "C" || upper === "CURRENT") {
    return "C";
  }

  if (upper === "U" || upper === "UNAVAILABLE") {
    return "U";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const iso = toCivilIsoDate(trimmed);
  if (iso) {
    return iso;
  }

  return trimmed;
}

export type LivePriorityDateStatus = PriorityDateStatus | "unavailable";

export type LivePriorityDateCheck = {
  status: LivePriorityDateStatus;
  priorityDate: string;
  category: string;
  country: string;
  cutoffDate: string;
  formattedCutoff: string;
  message: string;
};

export async function checkPriorityDate(
  priorityDate: string,
  category: string,
  country: string,
): Promise<LivePriorityDateCheck> {
  return comparePriorityToBulletin(priorityDate, category, country, "final-action");
}

export async function comparePriorityToBulletin(
  priorityDate: string,
  category: string,
  country: string,
  type: VisaBulletinDataType = "final-action",
): Promise<LivePriorityDateCheck> {
  const parsedPriority = new Date(`${priorityDate}T00:00:00`);
  if (Number.isNaN(parsedPriority.getTime())) {
    throw new Error("Invalid priority date. Use YYYY-MM-DD.");
  }

  const sheetCategory = normalizeSheetCategory(category);
  const sheetCountry = normalizeSheetCountry(country);
  const rows = await getVisaBulletinData(type);

  const row = rows.find(
    (entry) =>
      entry.category.toLowerCase() === sheetCategory.toLowerCase() &&
      entry.country.toLowerCase() === sheetCountry.toLowerCase(),
  );

  if (!row) {
    throw new Error(`No bulletin row found for ${sheetCategory} / ${sheetCountry}.`);
  }

  const cutoff = parseBulletinCutoffDate(row.finalActionDate);
  const formattedCutoff =
    cutoff === "C"
      ? formatBulletinDate("C")
      : cutoff === "U"
        ? "Unavailable (U)"
        : typeof cutoff === "string" && /^\d{4}-\d{2}-\d{2}$/.test(cutoff)
          ? formatBulletinDate(cutoff)
          : row.finalActionDate;

  if (cutoff === "C") {
    return {
      status: "current",
      priorityDate,
      category: row.category,
      country: row.country,
      cutoffDate: "C",
      formattedCutoff,
      message: "This category is current. Your priority date may be eligible now.",
    };
  }

  if (cutoff === "U") {
    return {
      status: "unavailable",
      priorityDate,
      category: row.category,
      country: row.country,
      cutoffDate: "U",
      formattedCutoff,
      message: "Cutoff data is unavailable for this category and country.",
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff)) {
    throw new Error(`Could not parse bulletin cutoff date: ${row.finalActionDate}`);
  }

  const cutoffDate = new Date(`${cutoff}T00:00:00`);

  if (parsedPriority <= cutoffDate) {
    return {
      status: "eligible",
      priorityDate,
      category: row.category,
      country: row.country,
      cutoffDate: cutoff,
      formattedCutoff,
      message: "Your priority date is on or before the published cutoff date.",
    };
  }

  return {
    status: "waiting",
    priorityDate,
    category: row.category,
    country: row.country,
    cutoffDate: cutoff,
    formattedCutoff,
    message: "Your priority date is after the published cutoff. You are still waiting.",
  };
}
