export type DataFreshnessStatus = "current" | "due-soon" | "overdue";

export type DatasetUrgency = "Low" | "High";

export type ImmifinDataset = {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  refreshFrequency: string;
  nextRecommendedRefresh: string;
  urgency: DatasetUrgency;
  refreshHint: string;
  refreshSteps: string[];
};

export type DataRefreshCenterAlert = {
  status: DataFreshnessStatus;
  message: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFirstDayOfNextMonth(from: Date): string {
  return formatIsoDate(new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1)));
}

function buildDatasetCatalog(referenceDate: Date): ImmifinDataset[] {
  const todayIso = formatIsoDate(referenceDate);

  return [
    {
      id: "occupation",
      name: "Occupation dataset",
      version: "O*NET-SOC seed list / 722 occupations",
      lastUpdated: todayIso,
      refreshFrequency: "Every 3 years",
      nextRecommendedRefresh: "2029-07-01",
      urgency: "Low",
      refreshHint:
        "To update occupations, drop the official O*NET-SOC JSON file into lib/h1b/data/ and run the import script.",
      refreshSteps: [
        "Download or prepare onet-soc-2019.json / latest O*NET-SOC JSON",
        "Place it in lib/h1b/data/",
        "Run: npx tsx scripts/import-onet-soc.ts",
        "Restart and verify the occupation picker",
      ],
    },
    {
      id: "dol-prevailing-wage",
      name: "DOL prevailing wage dataset",
      version: "Demo wage data",
      lastUpdated: todayIso,
      refreshFrequency: "Annually",
      nextRecommendedRefresh: "2027-07-01",
      urgency: "High",
      refreshHint:
        "To update wage data, download the latest DOL/FLAG prevailing wage files and import them into the wage data directory.",
      refreshSteps: [
        "Download the latest DOL wage data",
        "Convert or place the wage file into the expected JSON/CSV format",
        "Run the future wage import script",
        "Verify wage levels in the H-1B Wage Level Estimator",
      ],
    },
    {
      id: "h1b-lottery-odds",
      name: "H-1B lottery odds dataset",
      version: "Mock FY assumptions",
      lastUpdated: todayIso,
      refreshFrequency: "Annually / H-1B season",
      nextRecommendedRefresh: "2027-04-01",
      urgency: "High",
      refreshHint:
        "To update lottery assumptions, replace the FY lottery assumptions JSON after USCIS/DHS publishes updated registration and selection data.",
      refreshSteps: [
        "Add the latest fiscal year lottery assumptions file",
        "Update active dataset manifest",
        "Verify wage-level odds and master's cap estimates",
        "Test H-1B Lottery Odds Calculator",
      ],
    },
    {
      id: "visa-bulletin",
      name: "Visa Bulletin dataset",
      version: "Google Sheets feed",
      lastUpdated: todayIso,
      refreshFrequency: "Monthly",
      nextRecommendedRefresh: getFirstDayOfNextMonth(referenceDate),
      urgency: "High",
      refreshHint: "Visa Bulletin data is currently maintained through the Google Sheets feed.",
      refreshSteps: [
        "Update the Google Sheet tabs for Final Action Dates and Dates for Filing",
        "Confirm the published CSV/feed is accessible",
        "Verify Visa Bulletin dashboard and movement tracker",
        "Archive monthly data if needed",
      ],
    },
  ];
}

export function getDataFreshnessStatus(
  dataset: Pick<ImmifinDataset, "nextRecommendedRefresh">,
  today: Date = new Date(),
): DataFreshnessStatus {
  const todayDate = toUtcDateOnly(today);
  const nextRefreshDate = toUtcDateOnly(dataset.nextRecommendedRefresh);
  const daysUntilRefresh = Math.floor(
    (nextRefreshDate.getTime() - todayDate.getTime()) / MS_PER_DAY,
  );

  if (daysUntilRefresh < 0) {
    return "overdue";
  }

  if (daysUntilRefresh <= 30) {
    return "due-soon";
  }

  return "current";
}

export function getImmifinDatasets(today: Date = new Date()): ImmifinDataset[] {
  return buildDatasetCatalog(today);
}

export function getDataRefreshCenterAlert(
  datasets: ImmifinDataset[],
  today: Date = new Date(),
): DataRefreshCenterAlert {
  const statuses = datasets.map((dataset) => getDataFreshnessStatus(dataset, today));

  if (statuses.includes("overdue")) {
    return {
      status: "overdue",
      message: "Some IMMIFIN datasets need refresh.",
    };
  }

  if (statuses.includes("due-soon")) {
    return {
      status: "due-soon",
      message: "Some datasets are due for refresh soon.",
    };
  }

  return {
    status: "current",
    message: "All datasets are current.",
  };
}

export const DATA_FRESHNESS_STATUS_LABELS: Record<DataFreshnessStatus, string> = {
  current: "Current",
  "due-soon": "Due Soon",
  overdue: "Overdue",
};

export function formatDisplayDate(isoDate: string): string {
  const date = toUtcDateOnly(isoDate);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}
