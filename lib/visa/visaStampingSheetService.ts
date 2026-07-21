import { unstable_cache, revalidateTag } from "next/cache";
import { parseCivilDateToUtcNoon, toCivilIsoDate } from "@/lib/dates/civilDate";
import { parseWaitTimeToDays } from "@/lib/visa/parseWaitTimeToDays";
import {
  getCurrentStampingWaitTimes,
  getHistoricalStampingWaitTimes,
  getStampingCityMetadata,
  type StampingCsvRow,
} from "@/lib/visaStampingSheets";
import {
  VISA_STAMPING_DEMO_POSTS,
  type VisaStampingAppointmentType,
  type VisaStampingHistoryAnalysis,
  type VisaStampingHistoryPoint,
  type VisaStampingPost,
  type VisaStampingTrend,
  type VisaStampingVisaType,
} from "@/lib/visa/visaStampingWaitTimes";

export const VISA_STAMPING_SHEET_SOURCE_LABEL = "U.S. Department of State";
export const VISA_STAMPING_CACHE_TAG = "visa-stamping-sheet-data";

export const VISA_STAMPING_REVALIDATE_SECONDS = 86_400;

const DOS_WAIT_TIMES_URL =
  "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html";

/** Sheet column header for each UI visa type. */
export const VISA_TYPE_SHEET_COLUMN: Record<VisaStampingVisaType, string> = {
  "B-1/B-2": "Wait Time b1/b2",
  "F-1": "Wait Time F,M,J",
  "M-1": "Wait Time F,M,J",
  "J-1": "Wait Time F,M,J",
  "H-1B": "Wait Time H,L,O,P,Q",
  "H-4": "Wait Time H,L,O,P,Q",
  "L-1": "Wait Time H,L,O,P,Q",
  "L-2": "Wait Time H,L,O,P,Q",
  O: "Wait Time H,L,O,P,Q",
  P: "Wait Time H,L,O,P,Q",
  Q: "Wait Time H,L,O,P,Q",
  "C/D": "Wait Time C,D",
  "Other NIV": "Wait Time H,L,O,P,Q",
};

export type VisaStampingSheetRecord = {
  country: string;
  city: string;
  postName: string;
  latitude: number;
  longitude: number;
  region: string;
  visaType: VisaStampingVisaType;
  appointmentType: VisaStampingAppointmentType;
  waitDays: number;
  previousWaitDays?: number;
  lastUpdated: string;
  sourceLabel: string;
  isActive: boolean;
  historyAnalysis: VisaStampingHistoryAnalysis;
};

export type VisaStampingSheetLoadResult = {
  records: VisaStampingPost[];
  source: "Google Sheets" | "Demo fallback";
  lastUpdated: string;
  countries: string[];
  history: {
    enabled: boolean;
    historyRowsLoaded: number;
    currentRowsLoaded: number;
    cityMetadataRowsLoaded: number;
  };
};

type CityMetadata = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  region: string;
  isActive: boolean;
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function getCell(row: StampingCsvRow, ...candidates: string[]): string {
  for (const candidate of candidates) {
    const value = row[normalizeHeader(candidate)];
    if (value !== undefined) {
      return value;
    }
  }

  return "";
}

function isActiveValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "y" || normalized === "1";
}

function parseCoordinate(value: string): number | null {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSheetDate(value: string): Date | null {
  return parseCivilDateToUtcNoon(value);
}

function toIsoDate(value: string): string {
  return toCivilIsoDate(value) ?? value.trim();
}

function compareSheetDates(left: string, right: string): number {
  const leftDate = parseSheetDate(left);
  const rightDate = parseSheetDate(right);

  if (leftDate && rightDate) {
    return leftDate.getTime() - rightDate.getTime();
  }

  return left.localeCompare(right);
}

function slugifyId(...parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCityMetadataRows(rows: StampingCsvRow[]): CityMetadata[] {
  return rows
    .map((row) => {
      const city = getCell(row, "City");
      const country = getCell(row, "Country");
      const latitude = parseCoordinate(getCell(row, "Latitude"));
      const longitude = parseCoordinate(getCell(row, "Longitude"));

      if (!city || !country || latitude === null || longitude === null) {
        return null;
      }

      return {
        city,
        country,
        latitude,
        longitude,
        region: getCell(row, "Region"),
        isActive: isActiveValue(getCell(row, "Active")),
      };
    })
    .filter((row): row is CityMetadata => row !== null);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function getWaitValueForVisaType(row: StampingCsvRow, visaType: VisaStampingVisaType): string {
  const columnName = VISA_TYPE_SHEET_COLUMN[visaType];
  return getCell(row, columnName);
}

function trendFromChange(changeDays: number): VisaStampingTrend {
  if (changeDays <= -15) {
    return "Improving";
  }
  if (changeDays >= 15) {
    return "Increasing";
  }
  return "Stable";
}

function buildHistoryPoints(options: {
  currentDate: string;
  currentWaitDays: number;
  historicalWaits: { waitDays: number; updateDate: string }[];
}): VisaStampingHistoryPoint[] {
  const chronological = [...options.historicalWaits].sort((left, right) =>
    compareSheetDates(left.updateDate, right.updateDate),
  );

  const points: VisaStampingHistoryPoint[] = [];

  for (const sample of chronological) {
    const previous = points[points.length - 1];
    const changeDays = previous ? sample.waitDays - previous.waitDays : undefined;
    const changePercent =
      previous && previous.waitDays > 0 && changeDays !== undefined
        ? roundToOneDecimal((changeDays / previous.waitDays) * 100)
        : undefined;

    points.push({
      updateDate: sample.updateDate,
      waitDays: sample.waitDays,
      changeDays,
      changePercent,
      trend: changeDays === undefined ? "Stable" : trendFromChange(changeDays),
    });
  }

  const previous = points[points.length - 1];
  const changeDays = previous ? options.currentWaitDays - previous.waitDays : undefined;
  const changePercent =
    previous && previous.waitDays > 0 && changeDays !== undefined
      ? roundToOneDecimal((changeDays / previous.waitDays) * 100)
      : undefined;

  points.push({
    updateDate: toIsoDate(options.currentDate),
    waitDays: options.currentWaitDays,
    changeDays,
    changePercent,
    trend: changeDays === undefined ? "Stable" : trendFromChange(changeDays),
    isCurrent: true,
  });

  return points;
}

function buildHistoryAnalysis(options: {
  city: string;
  visaType: VisaStampingVisaType;
  currentDate: string;
  currentWaitDays: number;
  historyRows: StampingCsvRow[];
  /** Full point series is expensive — only build when explicitly requested. */
  includeHistoryPoints?: boolean;
}): VisaStampingHistoryAnalysis {
  const columnName = VISA_TYPE_SHEET_COLUMN[options.visaType];
  const cityKey = options.city.toLowerCase();
  const candidates = options.historyRows
    .filter((row) => getCell(row, "City").toLowerCase() === cityKey)
    .filter((row) => compareSheetDates(getCell(row, "Last_update_date", "Last update date"), options.currentDate) < 0)
    .sort((left, right) =>
      compareSheetDates(
        getCell(right, "Last_update_date", "Last update date"),
        getCell(left, "Last_update_date", "Last update date"),
      ),
    );

  const historicalWaits: { waitDays: number; updateDate: string }[] = [];
  for (const row of candidates) {
    const raw = getCell(row, columnName);
    const days = parseWaitTimeToDays(raw);
    if (days !== null) {
      historicalWaits.push({
        waitDays: days,
        updateDate: toIsoDate(getCell(row, "Last_update_date", "Last update date")),
      });
    }
  }

  const historyPoints = options.includeHistoryPoints
    ? buildHistoryPoints({
        currentDate: options.currentDate,
        currentWaitDays: options.currentWaitDays,
        historicalWaits,
      })
    : undefined;

  if (historicalWaits.length === 0) {
    return {
      trend: "Stable",
      trendLabel: "No prior history yet",
      historicalSamples: 0,
      lowestWaitDays: options.currentWaitDays,
      highestWaitDays: options.currentWaitDays,
      averageWaitDays: options.currentWaitDays,
      ...(historyPoints ? { historyPoints } : {}),
    };
  }

  const previous = historicalWaits[0]!;
  const changeDays = options.currentWaitDays - previous.waitDays;
  const changePercent = previous.waitDays > 0 ? roundToOneDecimal((changeDays / previous.waitDays) * 100) : undefined;
  const trend = trendFromChange(changeDays);
  const trendLabel =
    trend === "Improving"
      ? `Improving by ${Math.abs(changeDays)} days since last update`
      : trend === "Increasing"
        ? `Increased by ${changeDays} days since last update`
        : "Stable since last update";
  const allWaits = [options.currentWaitDays, ...historicalWaits.map((sample) => sample.waitDays)];
  const averageWaitDays = roundToOneDecimal(allWaits.reduce((sum, value) => sum + value, 0) / allWaits.length);

  return {
    previousWaitDays: previous.waitDays,
    previousUpdateDate: previous.updateDate,
    changeDays,
    changePercent,
    trend,
    trendLabel,
    historicalSamples: historicalWaits.length,
    lowestWaitDays: Math.min(...allWaits),
    highestWaitDays: Math.max(...allWaits),
    averageWaitDays,
    ...(historyPoints ? { historyPoints } : {}),
  };
}

function indexHistoryRowsByCity(historyRows: StampingCsvRow[]): Map<string, StampingCsvRow[]> {
  const indexed = new Map<string, StampingCsvRow[]>();
  for (const row of historyRows) {
    const cityKey = getCell(row, "City").toLowerCase();
    if (!cityKey) {
      continue;
    }
    const bucket = indexed.get(cityKey);
    if (bucket) {
      bucket.push(row);
    } else {
      indexed.set(cityKey, [row]);
    }
  }
  return indexed;
}

/** Strip heavy history series from posts for default map payloads. */
export function stripHistoryPointsFromPosts(posts: VisaStampingPost[]): VisaStampingPost[] {
  return posts.map((post) => {
    if (!post.historyAnalysis?.historyPoints) {
      return post;
    }

    const { historyPoints: _historyPoints, ...historyAnalysis } = post.historyAnalysis;
    return {
      ...post,
      historyAnalysis,
    };
  });
}

/**
 * Attach full historyPoints for a single city + visa type only.
 * Used by includeHistory=true API requests from the History Trend tab.
 */
export function attachHistoryPointsForPost(
  posts: VisaStampingPost[],
  options: { city: string; visaType: VisaStampingVisaType; historyRows: StampingCsvRow[] },
): VisaStampingPost[] {
  const cityKey = options.city.trim().toLowerCase();

  return posts.map((post) => {
    if (post.city.trim().toLowerCase() !== cityKey || post.visaType !== options.visaType) {
      return post;
    }

    const historyAnalysis = buildHistoryAnalysis({
      city: post.city,
      visaType: post.visaType,
      currentDate: post.lastUpdated,
      currentWaitDays: post.waitDays,
      historyRows: options.historyRows,
      includeHistoryPoints: true,
    });

    return {
      ...post,
      previousWaitDays: historyAnalysis.previousWaitDays ?? post.previousWaitDays,
      historyAnalysis,
    };
  });
}

function sheetRecordToPost(record: VisaStampingSheetRecord): VisaStampingPost {
  return {
    id: slugifyId(record.country, record.city, record.visaType, record.appointmentType),
    country: record.country,
    city: record.city,
    postName: record.postName,
    latitude: record.latitude,
    longitude: record.longitude,
    region: record.region,
    visaType: record.visaType,
    appointmentType: record.appointmentType,
    waitDays: record.waitDays,
    previousWaitDays: record.previousWaitDays,
    lastUpdated: record.lastUpdated,
    sourceLabel: record.sourceLabel,
    officialUrl: DOS_WAIT_TIMES_URL,
    isActive: record.isActive,
    historyAnalysis: record.historyAnalysis,
  };
}

function buildRecordsFromSheets(options: {
  currentRows: StampingCsvRow[];
  historyRows: StampingCsvRow[];
  metadata: CityMetadata[];
}): VisaStampingSheetRecord[] {
  const metadataByCity = new Map(
    options.metadata.map((entry) => [entry.city.trim().toLowerCase(), entry]),
  );
  const historyByCity = indexHistoryRowsByCity(options.historyRows);

  const records: VisaStampingSheetRecord[] = [];

  for (const row of options.currentRows) {
    const city = getCell(row, "City");
    const meta = metadataByCity.get(city.toLowerCase());

    if (!meta || !meta.isActive) {
      continue;
    }

    const lastUpdated = toIsoDate(getCell(row, "Last_update_date", "Last update date"));
    const cityHistoryRows = historyByCity.get(city.toLowerCase()) ?? [];

    for (const visaType of Object.keys(VISA_TYPE_SHEET_COLUMN) as VisaStampingVisaType[]) {
      const rawWait = getWaitValueForVisaType(row, visaType);
      const waitDays = parseWaitTimeToDays(rawWait);

      if (waitDays === null) {
        continue;
      }

      const historyAnalysis = buildHistoryAnalysis({
        city,
        visaType,
        currentDate: getCell(row, "Last_update_date", "Last update date"),
        currentWaitDays: waitDays,
        historyRows: cityHistoryRows,
        includeHistoryPoints: false,
      });

      records.push({
        country: meta.country,
        city: meta.city,
        postName: `U.S. Embassy / Consulate - ${meta.city}`,
        latitude: meta.latitude,
        longitude: meta.longitude,
        region: meta.region,
        visaType,
        appointmentType: "Interview",
        waitDays,
        previousWaitDays: historyAnalysis.previousWaitDays,
        lastUpdated,
        sourceLabel: VISA_STAMPING_SHEET_SOURCE_LABEL,
        isActive: meta.isActive,
        historyAnalysis,
      });
    }
  }

  return records;
}

function getDemoFallbackResult(): VisaStampingSheetLoadResult {
  const records = VISA_STAMPING_DEMO_POSTS.map((post) => {
    const historyAnalysis: VisaStampingHistoryAnalysis =
      post.previousWaitDays !== undefined
        ? {
            previousWaitDays: post.previousWaitDays,
            changeDays: post.waitDays - post.previousWaitDays,
            changePercent:
              post.previousWaitDays > 0
                ? roundToOneDecimal(((post.waitDays - post.previousWaitDays) / post.previousWaitDays) * 100)
                : undefined,
            trend:
              post.waitDays - post.previousWaitDays <= -15
                ? "Improving"
                : post.waitDays - post.previousWaitDays >= 15
                  ? "Increasing"
                  : "Stable",
            trendLabel:
              post.waitDays - post.previousWaitDays <= -15
                ? `Improving by ${Math.abs(post.waitDays - post.previousWaitDays)} days since last update`
                : post.waitDays - post.previousWaitDays >= 15
                  ? `Increased by ${post.waitDays - post.previousWaitDays} days since last update`
                  : "Stable since last update",
            historicalSamples: 1,
            lowestWaitDays: Math.min(post.waitDays, post.previousWaitDays),
            highestWaitDays: Math.max(post.waitDays, post.previousWaitDays),
            averageWaitDays: roundToOneDecimal((post.waitDays + post.previousWaitDays) / 2),
          }
        : {
            trend: "Stable",
            trendLabel: "No prior history yet",
            historicalSamples: 0,
            lowestWaitDays: post.waitDays,
            highestWaitDays: post.waitDays,
            averageWaitDays: post.waitDays,
          };

    return {
      ...post,
      historyAnalysis,
    };
  });
  const countries = [...new Set(records.map((post) => post.country))].sort((a, b) => a.localeCompare(b));
  const lastUpdated = records.reduce(
    (max, post) => (post.lastUpdated > max ? post.lastUpdated : max),
    records[0]?.lastUpdated ?? "2025-05-10",
  );

  return {
    records,
    source: "Demo fallback",
    lastUpdated,
    countries,
    history: {
      enabled: false,
      historyRowsLoaded: 0,
      currentRowsLoaded: records.length,
      cityMetadataRowsLoaded: records.length,
    },
  };
}

/** Cached history CSV rows — shared by cold sheet join and History Trend requests. */
const getCachedVisaStampingHistoryRows = unstable_cache(
  () => getHistoricalStampingWaitTimes(false),
  ["visa-stamping-history-rows"],
  { revalidate: VISA_STAMPING_REVALIDATE_SECONDS, tags: [VISA_STAMPING_CACHE_TAG] },
);

async function loadVisaStampingSheetData(forceRefresh = false): Promise<VisaStampingSheetLoadResult> {
  try {
    const [currentRows, historyRows, metadataRows] = await Promise.all([
      getCurrentStampingWaitTimes(forceRefresh),
      forceRefresh ? getHistoricalStampingWaitTimes(true) : getCachedVisaStampingHistoryRows(),
      getStampingCityMetadata(forceRefresh),
    ]);

    const metadata = parseCityMetadataRows(metadataRows);
    const sheetRecords = buildRecordsFromSheets({ currentRows, historyRows, metadata });
    const records = sheetRecords.map(sheetRecordToPost);

    if (records.length === 0) {
      console.warn("[visa-stamping] Sheet load returned zero records — using demo fallback");
      return getDemoFallbackResult();
    }

    const countries = [...new Set(records.map((post) => post.country))].sort((a, b) => a.localeCompare(b));
    const lastUpdated = records.reduce(
      (max, post) => (post.lastUpdated > max ? post.lastUpdated : max),
      records[0]!.lastUpdated,
    );

    if (process.env.NODE_ENV === "development") {
      console.log(`[visa-stamping] Loaded ${records.length} records from Google Sheets`);
    }

    return {
      records,
      source: "Google Sheets",
      lastUpdated,
      countries,
      history: {
        enabled: historyRows.length > 0,
        historyRowsLoaded: historyRows.length,
        currentRowsLoaded: currentRows.length,
        cityMetadataRowsLoaded: metadataRows.length,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sheet fetch error";
    console.error(`[visa-stamping] Sheet fetch failed: ${message}`);
    return getDemoFallbackResult();
  }
}

const getCachedVisaStampingSheetData = unstable_cache(
  () => loadVisaStampingSheetData(false),
  ["visa-stamping-sheet-data"],
  { revalidate: VISA_STAMPING_REVALIDATE_SECONDS, tags: [VISA_STAMPING_CACHE_TAG] },
);

export async function getVisaStampingHistoryRows(options?: {
  forceRefresh?: boolean;
}): Promise<StampingCsvRow[]> {
  if (options?.forceRefresh) {
    return getHistoricalStampingWaitTimes(true);
  }

  return getCachedVisaStampingHistoryRows();
}

export async function getVisaStampingSheetData(options?: {
  forceRefresh?: boolean;
}): Promise<VisaStampingSheetLoadResult> {
  if (options?.forceRefresh) {
    revalidateTag(VISA_STAMPING_CACHE_TAG);
    return loadVisaStampingSheetData(true);
  }

  return getCachedVisaStampingSheetData();
}

export function filterVisaStampingSheetRecords(
  records: VisaStampingPost[],
  options: {
    country?: string | "Worldwide";
    visaType?: VisaStampingVisaType;
    appointmentType?: VisaStampingAppointmentType;
    searchQuery?: string;
  },
): VisaStampingPost[] {
  const normalizedSearch = options.searchQuery?.trim().toLowerCase() ?? "";

  return records.filter((post) => {
    if (options.country && options.country !== "Worldwide" && post.country !== options.country) {
      return false;
    }

    if (options.visaType && post.visaType !== options.visaType) {
      return false;
    }

    if (options.appointmentType) {
      if (post.appointmentType !== "Interview" && post.appointmentType !== options.appointmentType) {
        return false;
      }
    }

    if (post.isActive === false) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = `${post.city} ${post.postName} ${post.country} ${post.region ?? ""}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });
}

export { getWaitTrend } from "@/lib/visa/visaStampingWaitTimes";
