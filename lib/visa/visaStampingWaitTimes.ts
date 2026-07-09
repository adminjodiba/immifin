export type VisaStampingTrend = "Improving" | "Stable" | "Increasing";

export type VisaStampingStatus = "Low" | "Moderate" | "High" | "Very High";

export type VisaStampingAppointmentType = "Interview" | "Drop-box";

export type VisaStampingVisaType =
  | "B-1/B-2"
  | "F-1"
  | "M-1"
  | "J-1"
  | "H-1B"
  | "H-4"
  | "L-1"
  | "L-2"
  | "O"
  | "P"
  | "Q"
  | "C/D"
  | "Other NIV";

export type VisaStampingCountry =
  | "India"
  | "Canada"
  | "Mexico"
  | "United Arab Emirates"
  | "United Kingdom"
  | "Germany"
  | "Australia"
  | "Singapore";

export type VisaStampingHistoryPoint = {
  updateDate: string;
  waitDays: number;
  changeDays?: number;
  changePercent?: number;
  trend: VisaStampingTrend;
  isCurrent?: boolean;
};

export type VisaStampingHistoryAnalysis = {
  previousWaitDays?: number;
  previousUpdateDate?: string;
  changeDays?: number;
  changePercent?: number;
  trend: VisaStampingTrend;
  trendLabel: string;
  historicalSamples: number;
  lowestWaitDays?: number;
  highestWaitDays?: number;
  averageWaitDays?: number;
  /** Chronological samples (oldest → newest), including the current wait as the latest point. */
  historyPoints?: VisaStampingHistoryPoint[];
};

export type VisaStampingPost = {
  id: string;
  country: string;
  city: string;
  postName: string;
  latitude: number;
  longitude: number;
  region?: string;
  visaType: VisaStampingVisaType;
  appointmentType: VisaStampingAppointmentType;
  waitDays: number;
  previousWaitDays?: number;
  lastUpdated: string;
  sourceLabel: string;
  officialUrl: string;
  isActive?: boolean;
  historyAnalysis?: VisaStampingHistoryAnalysis;
};

export const VISA_STAMPING_COUNTRIES: readonly VisaStampingCountry[] = [
  "India",
  "Canada",
  "Mexico",
  "United Arab Emirates",
  "United Kingdom",
  "Germany",
  "Australia",
  "Singapore",
] as const;

export const VISA_STAMPING_VISA_TYPES: readonly VisaStampingVisaType[] = [
  "B-1/B-2",
  "F-1",
  "M-1",
  "J-1",
  "H-1B",
  "H-4",
  "L-1",
  "L-2",
  "O",
  "P",
  "Q",
  "C/D",
  "Other NIV",
] as const;

export const VISA_STAMPING_APPOINTMENT_TYPES: readonly VisaStampingAppointmentType[] = [
  "Interview",
  "Drop-box",
] as const;

export const VISA_STAMPING_DEMO_SOURCE = "Demo data — Replace with official DOS data";

const DOS_WAIT_TIMES_URL = "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html";

export const VISA_STAMPING_DEMO_POSTS: VisaStampingPost[] = [
  {
    id: "india-kolkata",
    country: "India",
    city: "Kolkata",
    postName: "U.S. Consulate General",
    latitude: 22.5431,
    longitude: 88.3425,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 42,
    previousWaitDays: 65,
    lastUpdated: "2025-05-10",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "india-new-delhi",
    country: "India",
    city: "New Delhi",
    postName: "U.S. Embassy",
    latitude: 28.5969,
    longitude: 77.2225,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 58,
    previousWaitDays: 60,
    lastUpdated: "2025-05-10",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "india-hyderabad",
    country: "India",
    city: "Hyderabad",
    postName: "U.S. Consulate General",
    latitude: 17.4414,
    longitude: 78.3892,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 94,
    previousWaitDays: 78,
    lastUpdated: "2025-05-10",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "india-mumbai",
    country: "India",
    city: "Mumbai",
    postName: "U.S. Consulate General",
    latitude: 18.926,
    longitude: 72.8238,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 138,
    previousWaitDays: 104,
    lastUpdated: "2025-05-10",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "india-chennai",
    country: "India",
    city: "Chennai",
    postName: "U.S. Consulate General",
    latitude: 13.0569,
    longitude: 80.2421,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 182,
    previousWaitDays: 130,
    lastUpdated: "2025-05-10",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "canada-toronto",
    country: "Canada",
    city: "Toronto",
    postName: "U.S. Consulate General",
    latitude: 43.6532,
    longitude: -79.3832,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 35,
    previousWaitDays: 40,
    lastUpdated: "2025-05-08",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "canada-vancouver",
    country: "Canada",
    city: "Vancouver",
    postName: "U.S. Consulate General",
    latitude: 49.2827,
    longitude: -123.1207,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 48,
    previousWaitDays: 52,
    lastUpdated: "2025-05-08",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "mexico-mexico-city",
    country: "Mexico",
    city: "Mexico City",
    postName: "U.S. Embassy",
    latitude: 19.4326,
    longitude: -99.1332,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 72,
    previousWaitDays: 68,
    lastUpdated: "2025-05-07",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "uae-dubai",
    country: "United Arab Emirates",
    city: "Dubai",
    postName: "U.S. Consulate General",
    latitude: 25.2048,
    longitude: 55.2708,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 28,
    previousWaitDays: 32,
    lastUpdated: "2025-05-09",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "uk-london",
    country: "United Kingdom",
    city: "London",
    postName: "U.S. Embassy",
    latitude: 51.5074,
    longitude: -0.1278,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 45,
    previousWaitDays: 42,
    lastUpdated: "2025-05-06",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "germany-frankfurt",
    country: "Germany",
    city: "Frankfurt",
    postName: "U.S. Consulate General",
    latitude: 50.1109,
    longitude: 8.6821,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 55,
    previousWaitDays: 50,
    lastUpdated: "2025-05-05",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "australia-sydney",
    country: "Australia",
    city: "Sydney",
    postName: "U.S. Consulate General",
    latitude: -33.8688,
    longitude: 151.2093,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 62,
    previousWaitDays: 58,
    lastUpdated: "2025-05-04",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
  {
    id: "singapore-singapore",
    country: "Singapore",
    city: "Singapore",
    postName: "U.S. Embassy",
    latitude: 1.3521,
    longitude: 103.8198,
    visaType: "H-1B",
    appointmentType: "Interview",
    waitDays: 22,
    previousWaitDays: 25,
    lastUpdated: "2025-05-03",
    sourceLabel: VISA_STAMPING_DEMO_SOURCE,
    officialUrl: DOS_WAIT_TIMES_URL,
  },
];

/** @deprecated Use VISA_STAMPING_DEMO_POSTS — live data comes from /api/visa-stamping-wait-times */
export const VISA_STAMPING_POSTS = VISA_STAMPING_DEMO_POSTS;

export function getWaitTrend(waitDays: number, previousWaitDays?: number): VisaStampingTrend {
  if (previousWaitDays === undefined) {
    return "Stable";
  }

  if (waitDays <= previousWaitDays - 15) {
    return "Improving";
  }

  if (waitDays >= previousWaitDays + 15) {
    return "Increasing";
  }

  return "Stable";
}

export function getWaitStatus(waitDays: number): VisaStampingStatus {
  if (waitDays <= 30) {
    return "Low";
  }

  if (waitDays <= 90) {
    return "Moderate";
  }

  if (waitDays <= 180) {
    return "High";
  }

  return "Very High";
}

export function getApproxWindow(waitDays: number): string {
  if (waitDays < 30) {
    return "Less than 1 month";
  }

  if (waitDays < 60) {
    return "About 1–2 months";
  }

  if (waitDays < 120) {
    return "About 2–4 months";
  }

  if (waitDays < 180) {
    return "About 4–6 months";
  }

  return "6+ months";
}

export type PinColorBand = "green" | "yellow" | "orange" | "red";

export function getPinColorBand(waitDays: number): PinColorBand {
  if (waitDays <= 30) {
    return "green";
  }

  if (waitDays <= 90) {
    return "yellow";
  }

  if (waitDays <= 180) {
    return "orange";
  }

  return "red";
}

export const PIN_MARKER_HEX: Record<PinColorBand, string> = {
  green: "#10b981",
  yellow: "#facc15",
  orange: "#f97316",
  red: "#ef4444",
};

export const PIN_COLOR_STYLES: Record<
  PinColorBand,
  { pin: string; ring: string; label: string; status: string }
> = {
  green: {
    pin: "bg-emerald-500",
    ring: "ring-emerald-300",
    label: "0–30 days (Low)",
    status: "Low",
  },
  yellow: {
    pin: "bg-amber-400",
    ring: "ring-amber-200",
    label: "31–90 days (Moderate)",
    status: "Moderate",
  },
  orange: {
    pin: "bg-orange-500",
    ring: "ring-orange-200",
    label: "91–180 days (High)",
    status: "High",
  },
  red: {
    pin: "bg-red-500",
    ring: "ring-red-200",
    label: "181+ days (Very High)",
    status: "Very High",
  },
};

export function filterVisaStampingPosts(
  posts: VisaStampingPost[],
  options: {
    country: string | "Worldwide";
    visaType: VisaStampingVisaType;
    appointmentType: VisaStampingAppointmentType;
    searchQuery?: string;
  },
): VisaStampingPost[] {
  const normalizedSearch = options.searchQuery?.trim().toLowerCase() ?? "";

  return posts.filter((post) => {
    if (options.country !== "Worldwide" && post.country !== options.country) {
      return false;
    }

    if (post.visaType !== options.visaType) {
      return false;
    }

    if (post.appointmentType !== options.appointmentType) {
      return false;
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

/** Shortest wait first; ties broken alphabetically by city. */
export function sortPostsByWaitDays(posts: VisaStampingPost[]): VisaStampingPost[] {
  return [...posts].sort((a, b) => a.waitDays - b.waitDays || a.city.localeCompare(b.city, "en"));
}

export function getVisaStampingSummary(posts: VisaStampingPost[]) {
  if (posts.length === 0) {
    return null;
  }

  const sorted = sortPostsByWaitDays(posts);
  const total = posts.reduce((sum, post) => sum + post.waitDays, 0);

  return {
    fastest: sorted[0]!,
    slowest: sorted[sorted.length - 1]!,
    averageWaitDays: Math.round(total / posts.length),
    postsCompared: posts.length,
  };
}

export function formatDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getLatestDatasetUpdate(posts: VisaStampingPost[]): string {
  if (posts.length === 0) {
    return formatDisplayDate("2025-05-10");
  }

  const latest = posts.reduce((max, post) => (post.lastUpdated > max ? post.lastUpdated : max), posts[0]!.lastUpdated);
  return formatDisplayDate(latest);
}

export type MapViewConfig = {
  center: [number, number];
  zoom: number;
};

/** Southwest / northeast corners — frame the full country (not pin clusters). */
export type CountryMapBounds = [[number, number], [number, number]];

export const COUNTRY_MAP_BOUNDS: Record<VisaStampingCountry, CountryMapBounds> = {
  India: [
    [6.5, 68.0],
    [37.2, 97.5],
  ],
  Canada: [
    [41.5, -141.0],
    [70.0, -52.0],
  ],
  Mexico: [
    [14.5, -118.5],
    [32.8, -86.5],
  ],
  "United Arab Emirates": [
    [22.5, 51.0],
    [26.5, 57.0],
  ],
  "United Kingdom": [
    [49.8, -8.5],
    [59.0, 2.0],
  ],
  Germany: [
    [47.2, 5.8],
    [55.2, 15.2],
  ],
  Australia: [
    [-44.0, 112.0],
    [-10.0, 154.0],
  ],
  Singapore: [
    [1.15, 103.6],
    [1.48, 104.1],
  ],
};

/** @deprecated Prefer COUNTRY_MAP_BOUNDS.India — kept for existing imports. */
export const INDIA_MAP_BOUNDS = COUNTRY_MAP_BOUNDS.India;

export const INDIA_MAP_VIEW: MapViewConfig = {
  center: [22.9734, 78.6569],
  zoom: 4,
};

export const WORLD_MAP_VIEW: MapViewConfig = {
  center: [20, 0],
  zoom: 2,
};

export const COUNTRY_MAP_VIEWS: Record<VisaStampingCountry, MapViewConfig> = {
  India: INDIA_MAP_VIEW,
  Canada: { center: [56, -96], zoom: 3 },
  Mexico: { center: [23.6, -102.5], zoom: 5 },
  "United Arab Emirates": { center: [24.3, 54.0], zoom: 7 },
  "United Kingdom": { center: [54.5, -2.5], zoom: 5 },
  Germany: { center: [51.2, 10.5], zoom: 5 },
  Australia: { center: [-25, 133], zoom: 4 },
  Singapore: { center: [1.35, 103.82], zoom: 11 },
};

export function getMapBoundsForCountry(country: string): CountryMapBounds | null {
  if (country in COUNTRY_MAP_BOUNDS) {
    return COUNTRY_MAP_BOUNDS[country as VisaStampingCountry];
  }

  return null;
}

export function getMapViewForCountry(country: string | "Worldwide"): MapViewConfig {
  if (country === "Worldwide") {
    return WORLD_MAP_VIEW;
  }

  if (country in COUNTRY_MAP_VIEWS) {
    return COUNTRY_MAP_VIEWS[country as VisaStampingCountry];
  }

  return WORLD_MAP_VIEW;
}

export const DEFAULT_VISA_STAMPING_FILTERS = {
  country: "India" as VisaStampingCountry,
  visaType: "H-1B" as VisaStampingVisaType,
  appointmentType: "Interview" as VisaStampingAppointmentType,
};

export const DEFAULT_SELECTED_POST_ID = "india-hyderabad";
