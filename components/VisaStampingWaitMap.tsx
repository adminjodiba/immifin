"use client";

/**
 * Global Visa Stamping Wait Map — approved simulation layout.
 */

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { jsonFetcher, visaStampingSwrOptions } from "@/lib/swr";
import {
  DEFAULT_SELECTED_POST_ID,
  DEFAULT_VISA_STAMPING_FILTERS,
  filterVisaStampingPosts,
  formatDisplayDate,
  getVisaStampingSummary,
  getWaitStatus,
  getWaitTrend,
  sortPostsByWaitDays,
  VISA_STAMPING_APPOINTMENT_TYPES,
  VISA_STAMPING_COUNTRIES,
  VISA_STAMPING_VISA_TYPES,
  type VisaStampingAppointmentType,
  type VisaStampingHistoryPoint,
  type VisaStampingPost,
  type VisaStampingTrend,
  type VisaStampingVisaType,
} from "@/lib/visa/visaStampingWaitTimes";

const VisaStampingLeafletMap = dynamic(() => import("@/components/visa/VisaStampingLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center bg-slate-50 text-sm text-slate-500 xl:absolute xl:inset-0 xl:h-auto">
      Loading map…
    </div>
  ),
});

const VisaStampingHistoryTrendChart = dynamic(
  () =>
    import("@/components/visa/VisaStampingHistoryTrendChart").then(
      (mod) => mod.VisaStampingHistoryTrendChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[180px] items-center justify-center text-xs text-slate-500">Loading chart…</div>
    ),
  },
);

const PAGE_HREF = "/immigration/visa-stamping-wait-map";
const PAGE_TITLE = "Global Visa Stamping Wait Map";

type VisaStampingApiResponse = {
  data: VisaStampingPost[];
  metadata: {
    source: "Google Sheets" | "Demo fallback";
    lastUpdated: string;
    lastUpdatedIso?: string;
    count: number;
    countries?: string[];
    appointmentTypeNote?: string;
    refreshed?: boolean;
    history?: {
      enabled: boolean;
      historyRowsLoaded: number;
      currentRowsLoaded: number;
      cityMetadataRowsLoaded: number;
    };
  };
};

type DetailsTab = "overview" | "history" | "source";
type HistoryRangeKey = "6m" | "12m" | "all";

const calculatorCloseLinkClassName =
  "flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30";

const filterSelectClassName =
  "rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

const cardClassName = "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";

type CountryFilter = string | "Worldwide";

const TREND_STYLES = {
  Improving: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Stable: "bg-sky-50 text-sky-800 ring-sky-200",
  Increasing: "bg-red-50 text-red-800 ring-red-200",
} as const;

const STATUS_BADGE_STYLES = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Moderate: "bg-amber-50 text-amber-700 ring-amber-200",
  High: "bg-orange-50 text-orange-700 ring-orange-200",
  "Very High": "bg-red-50 text-red-700 ring-red-200",
} as const;

const PAGE_SUBTITLE =
  "Real-time U.S. visa stamping (interview) wait times at consulates worldwide.";

function buildApiUrl(
  country: CountryFilter,
  visaType: VisaStampingVisaType,
  appointmentType: VisaStampingAppointmentType,
  options?: {
    includeHistory?: boolean;
    city?: string;
  },
) {
  const params = new URLSearchParams({ country, visaType, appointmentType });
  if (options?.includeHistory && options.city) {
    params.set("includeHistory", "true");
    params.set("city", options.city);
  }
  return `/api/visa-stamping-wait-times?${params.toString()}`;
}

function overallTrendFromPoints(points: VisaStampingHistoryPoint[]): VisaStampingTrend {
  if (points.length < 2) {
    return "Stable";
  }
  const oldest = points[0]!;
  const newest = points[points.length - 1]!;
  const delta = newest.waitDays - oldest.waitDays;
  if (delta <= -15) {
    return "Improving";
  }
  if (delta >= 15) {
    return "Increasing";
  }
  return "Stable";
}

function filterHistoryPointsByRange(
  points: VisaStampingHistoryPoint[],
  range: HistoryRangeKey,
): VisaStampingHistoryPoint[] {
  if (range === "all" || points.length === 0) {
    return points;
  }

  const newest = points[points.length - 1]!;
  const newestTime = new Date(`${newest.updateDate}T12:00:00Z`).getTime();
  if (Number.isNaN(newestTime)) {
    return points;
  }

  const months = range === "6m" ? 6 : 12;
  const cutoff = newestTime - months * 30 * 24 * 60 * 60 * 1000;

  return points.filter((point) => {
    const time = new Date(`${point.updateDate}T12:00:00Z`).getTime();
    return Number.isNaN(time) || time >= cutoff;
  });
}

function DashboardCard({
  title,
  panelId,
  children,
  className = "",
  bodyClassName = "p-4",
  headerRight,
  headerClassName = "border-b border-slate-100 px-4 py-2.5",
}: {
  title?: string;
  panelId?: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerRight?: ReactNode;
  headerClassName?: string;
}) {
  return (
    <div className={`${cardClassName} ${className}`} aria-labelledby={panelId}>
      {title ? (
        <div className={`flex items-center justify-between gap-3 ${headerClassName}`}>
          <h3 id={panelId} className="text-sm font-semibold text-slate-900">
            {title}
          </h3>
          {headerRight}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

function MetricIcon({ kind }: { kind: "posts" | "average" | "shortest" | "longest" }) {
  const iconClass = "h-4 w-4";
  if (kind === "posts") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" aria-hidden="true">
        <path
          d="M4 19V5m0 14h16M8 15V9m4 6V7m4 8v-4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "average") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" aria-hidden="true">
        <path
          d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "shortest") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass} fill="none" aria-hidden="true">
        <path
          d="M12 19V5m0 0l-4 4m4-4l4 4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" aria-hidden="true">
      <path
        d="M12 5v14m0 0l-4-4m4 4l4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SummaryStatCard({
  label,
  value,
  subvalue,
  icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  subvalue?: string;
  icon: "posts" | "average" | "shortest" | "longest";
  tone?: "brand" | "emerald" | "amber" | "rose";
}) {
  const toneStyles = {
    brand: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  } as const;

  return (
    <div className={`${cardClassName} flex items-center gap-2.5 px-3 py-2.5`}>
      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toneStyles[tone]}`}>
        <MetricIcon kind={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-lg font-bold leading-tight text-slate-900">{value}</p>
        {subvalue ? <p className="truncate text-[11px] leading-tight text-slate-500">{subvalue}</p> : null}
      </div>
    </div>
  );
}

function formatChangePercent(changePercent?: number): string {
  if (changePercent === undefined) {
    return "—";
  }

  const prefix = changePercent > 0 ? "+" : "";
  return `${prefix}${changePercent.toFixed(1)}%`;
}

function formatSignedChange(changeDays?: number, changePercent?: number): string {
  if (changeDays === undefined) {
    return "No prior history";
  }

  if (changeDays === 0) {
    return `0 days (${formatChangePercent(changePercent)})`;
  }

  const sign = changeDays > 0 ? "+" : "";
  return `${sign}${changeDays} days (${formatChangePercent(changePercent)})`;
}

function formatChangeDaysOnly(changeDays?: number): string {
  if (changeDays === undefined) {
    return "No prior history";
  }

  if (changeDays === 0) {
    return "0 days";
  }

  const sign = changeDays > 0 ? "+" : "";
  return `${sign}${changeDays} days`;
}

function changeTextClass(changeDays?: number): string {
  if (changeDays === undefined || changeDays === 0) {
    return "text-slate-600";
  }
  return changeDays > 0 ? "text-red-600" : "text-emerald-600";
}

function RangeVisual({
  lowest,
  current,
  highest,
}: {
  lowest?: number;
  current: number;
  highest?: number;
}) {
  if (lowest === undefined || highest === undefined) {
    return null;
  }

  const span = Math.max(highest - lowest, 1);
  const markerPosition = ((current - lowest) / span) * 100;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-700">Wait Time Range (History)</p>
      <div className="mt-2">
        <div className="relative h-2 rounded-full bg-slate-200">
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white bg-brand-600 shadow-sm"
            style={{ left: `calc(${Math.min(100, Math.max(0, markerPosition))}% - 7px)` }}
            aria-hidden="true"
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
          <span>Lowest {lowest}d</span>
          <span>Current {current}d</span>
          <span>Highest {highest}d</span>
        </div>
      </div>
    </div>
  );
}

function HistoricalMovementCard({
  enabled,
  improvingCount,
  stableCount,
  increasingCount,
  biggestImprovement,
  biggestIncrease,
}: {
  enabled: boolean;
  improvingCount: number;
  stableCount: number;
  increasingCount: number;
  biggestImprovement?: VisaStampingPost;
  biggestIncrease?: VisaStampingPost;
}) {
  return (
    <div className={`${cardClassName} flex h-full flex-col`}>
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-1.5">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-violet-100 text-violet-700">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" aria-hidden="true">
            <path
              d="M4 16l5-5 4 4 7-9"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h3 className="text-[11px] font-semibold text-slate-900">Historical Movement (vs Last Update)</h3>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 p-2.5">
        {enabled ? (
          <>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-md border border-emerald-200/80 bg-emerald-50/70 px-1.5 py-1 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">Improving</p>
                <p className="text-sm font-bold leading-tight text-emerald-900">
                  {improvingCount} <span className="text-xs">↓</span>
                </p>
              </div>
              <div className="rounded-md border border-sky-200/80 bg-sky-50/70 px-1.5 py-1 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-sky-700">Stable</p>
                <p className="text-sm font-bold leading-tight text-sky-900">
                  {stableCount} <span className="text-xs">→</span>
                </p>
              </div>
              <div className="rounded-md border border-red-200/80 bg-red-50/70 px-1.5 py-1 text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-red-700">Increasing</p>
                <p className="text-sm font-bold leading-tight text-red-900">
                  {increasingCount} <span className="text-xs">↑</span>
                </p>
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              <div className="rounded-md border border-emerald-200/60 bg-emerald-50/40 px-2 py-1">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">Biggest Improvement</p>
                {biggestImprovement?.historyAnalysis?.changeDays !== undefined ? (
                  <p className="truncate text-[11px] font-semibold leading-snug text-slate-900">
                    {biggestImprovement.city}{" "}
                    <span className="text-emerald-700">
                      ({biggestImprovement.historyAnalysis.changeDays} days)
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-slate-700">No improving consulates yet</p>
                )}
              </div>
              <div className="rounded-md border border-red-200/60 bg-red-50/40 px-2 py-1">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-red-700">Biggest Increase</p>
                {biggestIncrease?.historyAnalysis?.changeDays !== undefined ? (
                  <p className="truncate text-[11px] font-semibold leading-snug text-slate-900">
                    {biggestIncrease.city}{" "}
                    <span className="text-red-700">
                      (+{biggestIncrease.historyAnalysis.changeDays} days)
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-slate-700">No increasing consulates yet</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="rounded-md border border-emerald-200/60 bg-emerald-50/40 px-2 py-1">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-700">Biggest Improvement</p>
              <p className="text-[11px] font-semibold text-slate-700">No improving consulates yet</p>
            </div>
            <div className="rounded-md border border-red-200/60 bg-red-50/40 px-2 py-1">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-red-700">Biggest Increase</p>
              <p className="text-[11px] font-semibold text-slate-700">No increasing consulates yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RankedPostsTable({
  posts,
  selectedPostId,
  searchQuery,
  onSearchChange,
  onSelectPost,
}: {
  posts: VisaStampingPost[];
  selectedPostId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectPost: (postId: string) => void;
}) {
  return (
    <DashboardCard
      title="Consulates (Ranked by Wait Time)"
      panelId="ranked-posts-heading"
      className="flex min-h-[420px] flex-col xl:h-[620px]"
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
      headerClassName="border-b border-slate-100 px-4 py-2.5"
      headerRight={
        <div className="min-w-0 flex-1 sm:max-w-[220px]">
          <label htmlFor="consulate-search" className="sr-only">
            Search consulate
          </label>
          <input
            id="consulate-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search city or consulate..."
            className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 sm:text-sm"
          />
        </div>
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        {posts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-600">No consulates match your filters.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Rank</th>
                <th className="px-3 py-2.5 text-left font-semibold text-slate-600">Consulates</th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-slate-600">Current Wait</th>
                <th className="hidden whitespace-nowrap px-3 py-2.5 text-left font-semibold text-slate-600 lg:table-cell">
                  Change vs Last Update
                </th>
                <th className="px-3 py-2.5 text-center font-semibold text-slate-600">Trend</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, index) => {
                const trend = post.historyAnalysis?.trend ?? getWaitTrend(post.waitDays, post.previousWaitDays);
                const isSelected = selectedPostId === post.id;
                const changeDays = post.historyAnalysis?.changeDays;
                const changeText = formatChangeDaysOnly(changeDays);

                return (
                  <tr
                    key={post.id}
                    className={`cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50/80 ${
                      isSelected ? "border-l-2 border-l-brand-500 bg-sky-50" : "bg-white"
                    }`}
                    onClick={() => onSelectPost(post.id)}
                  >
                    <td className="h-[76px] px-3 py-2 align-middle font-semibold text-slate-700">{index + 1}</td>
                    <td className="px-3 py-2 align-middle">
                      <p className="font-semibold text-slate-900">{post.city}</p>
                    </td>
                    <td className="px-3 py-2 text-right align-middle text-sm font-bold text-slate-900">
                      {post.waitDays} days
                    </td>
                    <td className={`hidden px-3 py-2 align-middle text-[11px] leading-snug lg:table-cell ${changeTextClass(changeDays)}`}>
                      {changeText}
                    </td>
                    <td className="px-3 py-2 text-center align-middle">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${TREND_STYLES[trend]}`}>
                        {trend}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardCard>
  );
}

function SelectedPostDetailsCard({
  post,
  rank,
  dataSource,
  country,
  visaType,
  appointmentType,
  onClearSelection,
}: {
  post: VisaStampingPost | null;
  rank: number | null;
  dataSource: "Google Sheets" | "Demo fallback" | undefined;
  country: CountryFilter;
  visaType: VisaStampingVisaType;
  appointmentType: VisaStampingAppointmentType;
  onClearSelection?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailsTab>("overview");
  const [historyRange, setHistoryRange] = useState<HistoryRangeKey>("12m");

  useEffect(() => {
    setActiveTab("overview");
    setHistoryRange("12m");
  }, [post?.id]);

  const historyApiUrl =
    post && activeTab === "history"
      ? buildApiUrl(country, visaType, appointmentType, {
          includeHistory: true,
          city: post.city,
        })
      : null;

  const { data: historyData, isLoading: isHistoryLoading } = useSWR<VisaStampingApiResponse>(
    historyApiUrl,
    (url) => jsonFetcher<VisaStampingApiResponse>(url, "Failed to load history trend."),
    visaStampingSwrOptions,
  );

  const historyPost =
    historyData?.data.find((entry) => entry.id === post?.id) ??
    historyData?.data.find(
      (entry) =>
        post &&
        entry.city.toLowerCase() === post.city.toLowerCase() &&
        entry.visaType === post.visaType,
    ) ??
    null;

  if (!post) {
    return (
      <div className={`${cardClassName} flex min-h-[420px] flex-col xl:h-[620px]`}>
        <div className="border-b border-slate-100 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-slate-900">Selected Consulate Details</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-slate-600">Select a consulate to view details.</p>
        </div>
      </div>
    );
  }

  const trend = post.historyAnalysis?.trend ?? getWaitTrend(post.waitDays, post.previousWaitDays);
  const status = getWaitStatus(post.waitDays);
  const history = post.historyAnalysis;
  const hasHistory = Boolean(history && history.historicalSamples > 0);
  const historyPoints = historyPost?.historyAnalysis?.historyPoints ?? [];
  const visiblePoints = filterHistoryPointsByRange(historyPoints, historyRange);
  const hasTrendSeries = visiblePoints.length > 1;
  const overallTrend = overallTrendFromPoints(visiblePoints);
  const visibleWaits = visiblePoints.map((point) => point.waitDays);
  const lowestVisible = visibleWaits.length ? Math.min(...visibleWaits) : post.waitDays;
  const highestVisible = visibleWaits.length ? Math.max(...visibleWaits) : post.waitDays;
  const averageVisible = visibleWaits.length
    ? Math.round((visibleWaits.reduce((sum, value) => sum + value, 0) / visibleWaits.length) * 10) / 10
    : post.waitDays;
  const monthlyRows = [...visiblePoints].reverse();
  const waitToneClass =
    status === "Low"
      ? "text-emerald-700"
      : status === "Moderate"
        ? "text-amber-700"
        : status === "High"
          ? "text-orange-600"
          : "text-red-600";

  const tabs: { id: DetailsTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "history", label: "History Trend" },
    { id: "source", label: "Source Notes" },
  ];

  return (
    <div className={`${cardClassName} flex min-h-[420px] flex-col xl:h-[620px]`}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
        <div className="shrink-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold text-slate-900">{post.city}</p>
                {rank !== null ? (
                  <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-semibold text-orange-800 ring-1 ring-orange-200">
                    Rank #{rank}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-600">{post.postName}</p>
            </div>
            {onClearSelection ? (
              <button
                type="button"
                onClick={onClearSelection}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close selected consulate details"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Current Wait Time</p>
              <p className={`mt-1 text-sm font-bold ${waitToneClass}`}>{post.waitDays} days</p>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS_BADGE_STYLES[status]}`}
              >
                {status}
              </span>
            </div>
            <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Last Updated</p>
              <p className="mt-1 text-xs font-semibold leading-snug text-slate-900">
                {formatDisplayDate(post.lastUpdated)}
              </p>
            </div>
          </div>

          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-white text-brand-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          {activeTab === "overview" ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                <h4 className="text-xs font-semibold text-slate-900">History Comparison (vs Last Update)</h4>
                {hasHistory && history ? (
                  <dl className="mt-2 grid gap-2 text-[11px] sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Previous Wait Time</dt>
                      <dd className="font-medium text-slate-900">{history.previousWaitDays} days</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Previous Update Date</dt>
                      <dd className="font-medium text-slate-900">
                        {history.previousUpdateDate ? formatDisplayDate(history.previousUpdateDate) : "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Change</dt>
                      <dd className={`font-medium ${changeTextClass(history.changeDays)}`}>
                        {history.changeDays !== undefined
                          ? formatSignedChange(history.changeDays, history.changePercent)
                          : "Not available"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Trend</dt>
                      <dd>
                        <span className={`inline-flex rounded-full px-2 py-0.5 font-semibold ring-1 ${TREND_STYLES[trend]}`}>
                          {trend}
                        </span>
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500">Trend Explanation</dt>
                      <dd className="font-medium text-slate-900">{history.trendLabel}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Historical Samples</dt>
                      <dd className="font-medium text-slate-900">{history.historicalSamples}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Lowest Recorded</dt>
                      <dd className="font-medium text-slate-900">{history.lowestWaitDays} days</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Highest Recorded</dt>
                      <dd className="font-medium text-slate-900">{history.highestWaitDays} days</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Average Recorded</dt>
                      <dd className="font-medium text-slate-900">{history.averageWaitDays} days</dd>
                    </div>
                  </dl>
                ) : (
                  <div className="mt-2 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-4 text-center">
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      No historical comparison is available yet. Add prior monthly rows to stamping_wait_time_history to
                      unlock trend analysis.
                    </p>
                  </div>
                )}
              </div>

              {hasHistory && history ? (
                <RangeVisual lowest={history.lowestWaitDays} current={post.waitDays} highest={history.highestWaitDays} />
              ) : null}

              <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2.5">
                <p className="text-[11px] leading-relaxed text-sky-950">
                  Historical comparison shows change since the last update. It does not predict future wait times.
                </p>
              </div>
            </div>
          ) : null}

          {activeTab === "history" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-slate-900">Wait Time Trend (History)</h4>
                <select
                  value={historyRange}
                  onChange={(event) => setHistoryRange(event.target.value as HistoryRangeKey)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  aria-label="History date range"
                >
                  <option value="6m">Last 6 Months</option>
                  <option value="12m">Last 12 Months</option>
                  <option value="all">All History</option>
                </select>
              </div>

              {isHistoryLoading ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-8 text-center text-[11px] text-slate-500">
                  Loading history for {post.city}…
                </div>
              ) : hasTrendSeries ? (
                <>
                  {visiblePoints.length < 12 && historyRange !== "all" ? (
                    <p className="text-[11px] text-slate-500">
                      Showing {visiblePoints.length} available update
                      {visiblePoints.length === 1 ? "" : "s"} in this range. More months will appear as history rows are
                      added.
                    </p>
                  ) : null}

                  <div className="rounded-xl border border-slate-200/80 bg-white p-2">
                    <VisaStampingHistoryTrendChart points={visiblePoints} />
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: "Lowest", value: `${lowestVisible} days` },
                      { label: "Highest", value: `${highestVisible} days` },
                      { label: "Average", value: `${averageVisible} days` },
                      {
                        label: "Records",
                        value:
                          visiblePoints.length === 1
                            ? "1 month"
                            : `${visiblePoints.length} months`,
                      },
                      { label: "Overall Trend", value: overallTrend },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-1.5 py-1.5 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                        {stat.label === "Overall Trend" ? (
                          <span
                            className={`mt-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${TREND_STYLES[overallTrend]}`}
                          >
                            {overallTrend}
                            {overallTrend === "Increasing" ? " ↑" : overallTrend === "Improving" ? " ↓" : " →"}
                          </span>
                        ) : (
                          <p className="mt-0.5 text-[11px] font-bold text-slate-900">{stat.value}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-200/80">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Update Date</th>
                          <th className="px-2 py-1.5 text-right font-semibold text-slate-600">Wait Time (Days)</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Change</th>
                          <th className="px-2 py-1.5 text-center font-semibold text-slate-600">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyRows.map((row) => (
                          <tr
                            key={`${row.updateDate}-${row.waitDays}-${row.isCurrent ? "current" : "hist"}`}
                            className={`border-t border-slate-100 ${row.isCurrent ? "bg-sky-50/70" : "bg-white"}`}
                          >
                            <td className="px-2 py-1.5 font-medium text-slate-900">
                              {formatDisplayDate(row.updateDate)}
                              {row.isCurrent ? (
                                <span className="ml-1 text-[10px] font-semibold text-brand-700">Current</span>
                              ) : null}
                            </td>
                            <td className="px-2 py-1.5 text-right font-semibold text-slate-900">{row.waitDays}</td>
                            <td className={`px-2 py-1.5 font-medium ${changeTextClass(row.changeDays)}`}>
                              {formatSignedChange(row.changeDays, row.changePercent)}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${TREND_STYLES[row.trend]}`}>
                                {row.trend}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-6 text-center">
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    No history trend available yet. Add monthly rows to stamping_wait_time_history.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2.5">
                <p className="text-[11px] leading-relaxed text-sky-950">
                  Historical comparison shows recorded change over time. It does not predict future wait times.
                </p>
              </div>
            </div>
          ) : null}

          {activeTab === "source" ? (
            <div className="space-y-3 text-[11px] leading-relaxed text-slate-700">
              <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                <p>
                  <span className="font-semibold text-slate-900">Data source:</span>{" "}
                  {dataSource === "Google Sheets"
                    ? "Google Sheets / Department of State manual refresh"
                    : "Demo fallback / Department of State manual refresh"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Current worksheet:</span> stamping_wait_time_current
                </p>
                <p>
                  <span className="font-semibold text-slate-900">History worksheet:</span> stamping_wait_time_history
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Metadata worksheet:</span> Stamping_City_Metadata
                </p>
              </div>
              <div className="space-y-1.5 rounded-xl border border-slate-200/80 bg-white p-3">
                <p className="font-semibold text-slate-900">Visa type mapping</p>
                <ul className="list-disc space-y-1 pl-4">
                  <li>H-1B / H-4 / L-1 / L-2 / O / P / Q use Wait Time H,L,O,P,Q</li>
                  <li>F / M / J use Wait Time F,M,J</li>
                  <li>B1/B2 uses Wait Time b1/b2</li>
                  <li>C/D uses Wait Time C,D</li>
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-amber-950">
                DOS wait times are estimates and do not guarantee appointment availability.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function VisaStampingWaitMap() {
  const [appliedCountry, setAppliedCountry] = useState<CountryFilter>(DEFAULT_VISA_STAMPING_FILTERS.country);
  const [appliedVisaType, setAppliedVisaType] = useState<VisaStampingVisaType>(DEFAULT_VISA_STAMPING_FILTERS.visaType);
  const [appliedAppointmentType, setAppliedAppointmentType] = useState<VisaStampingAppointmentType>(
    DEFAULT_VISA_STAMPING_FILTERS.appointmentType,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(DEFAULT_SELECTED_POST_ID);
  const [mapFocusPostId, setMapFocusPostId] = useState<string | null>(null);

  const apiUrl = buildApiUrl(appliedCountry, appliedVisaType, appliedAppointmentType);

  const { data, error, isLoading } = useSWR<VisaStampingApiResponse>(
    apiUrl,
    (url) => jsonFetcher<VisaStampingApiResponse>(url, "Failed to load visa stamping wait times."),
    visaStampingSwrOptions,
  );

  const rawPosts = data?.data;
  const metadata = data?.metadata;

  const countryOptions = useMemo(() => {
    const fromApi = data?.metadata.countries;
    const countries = fromApi?.length ? fromApi : [...VISA_STAMPING_COUNTRIES];
    return ["Worldwide", ...countries.sort((a, b) => a.localeCompare(b))] as CountryFilter[];
  }, [data]);

  const visiblePosts = useMemo(
    () =>
      filterVisaStampingPosts(rawPosts ?? [], {
        country: appliedCountry,
        visaType: appliedVisaType,
        appointmentType: appliedAppointmentType,
        searchQuery,
      }),
    [rawPosts, appliedCountry, appliedVisaType, appliedAppointmentType, searchQuery],
  );

  const rankedPosts = useMemo(() => sortPostsByWaitDays(visiblePosts), [visiblePosts]);

  const selectedPost =
    visiblePosts.find((post) => post.id === selectedPostId) ??
    rankedPosts.find((post) => post.id === selectedPostId) ??
    rankedPosts[0] ??
    null;

  const selectedRank = selectedPost ? rankedPosts.findIndex((post) => post.id === selectedPost.id) + 1 : null;

  const summary = getVisaStampingSummary(visiblePosts);
  const historyMetadata = metadata?.history;

  const movementSummary = useMemo(() => {
    const improving = visiblePosts.filter((post) => post.historyAnalysis?.trend === "Improving");
    const stable = visiblePosts.filter((post) => post.historyAnalysis?.trend === "Stable");
    const increasing = visiblePosts.filter((post) => post.historyAnalysis?.trend === "Increasing");
    const biggestImprovement = [...improving].sort(
      (left, right) => (left.historyAnalysis?.changeDays ?? 0) - (right.historyAnalysis?.changeDays ?? 0),
    )[0];
    const biggestIncrease = [...increasing].sort(
      (left, right) => (right.historyAnalysis?.changeDays ?? 0) - (left.historyAnalysis?.changeDays ?? 0),
    )[0];

    return {
      improvingCount: improving.length,
      stableCount: stable.length,
      increasingCount: increasing.length,
      biggestImprovement,
      biggestIncrease,
    };
  }, [visiblePosts]);

  useEffect(() => {
    if (!selectedPostId && rankedPosts[0]) {
      setSelectedPostId(rankedPosts[0].id);
      return;
    }

    if (selectedPostId && rankedPosts.length > 0 && !rankedPosts.some((post) => post.id === selectedPostId)) {
      setSelectedPostId(rankedPosts[0]!.id);
    }
  }, [rankedPosts, selectedPostId]);

  function handleSelectPost(postId: string, focusMap = true) {
    setSelectedPostId(postId);
    setMapFocusPostId(focusMap ? postId : null);
  }

  function handleCountryChange(country: CountryFilter) {
    setMapFocusPostId(null);
    setAppliedCountry(country);
  }

  function handleVisaTypeChange(visaType: VisaStampingVisaType) {
    setMapFocusPostId(null);
    setAppliedVisaType(visaType);
  }

  function handleAppointmentTypeChange(appointmentType: VisaStampingAppointmentType) {
    setMapFocusPostId(null);
    setAppliedAppointmentType(appointmentType);
  }

  function handleResetFilters() {
    setAppliedCountry(DEFAULT_VISA_STAMPING_FILTERS.country);
    setAppliedVisaType(DEFAULT_VISA_STAMPING_FILTERS.visaType);
    setAppliedAppointmentType(DEFAULT_VISA_STAMPING_FILTERS.appointmentType);
    setSearchQuery("");
    setSelectedPostId(DEFAULT_SELECTED_POST_ID);
    setMapFocusPostId(null);
  }

  return (
    <WorkspacePageShell>
      <div className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-2.5">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">{PAGE_TITLE}</h1>
                  <FavoriteStar pageLabel={PAGE_TITLE} pageHref={PAGE_HREF} />
                </div>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">{PAGE_SUBTITLE}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <select
              value={appliedCountry}
              onChange={(event) => handleCountryChange(event.target.value as CountryFilter)}
              className={filterSelectClassName}
              aria-label="Filter by country"
            >
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <select
              value={appliedVisaType}
              onChange={(event) => handleVisaTypeChange(event.target.value as VisaStampingVisaType)}
              className={filterSelectClassName}
              aria-label="Filter by visa type"
            >
              {VISA_STAMPING_VISA_TYPES.map((visaType) => (
                <option key={visaType} value={visaType}>
                  {visaType}
                </option>
              ))}
            </select>
            <select
              value={appliedAppointmentType}
              onChange={(event) => handleAppointmentTypeChange(event.target.value as VisaStampingAppointmentType)}
              className={filterSelectClassName}
              aria-label="Filter by appointment type"
            >
              {VISA_STAMPING_APPOINTMENT_TYPES.map((appointmentType) => (
                <option key={appointmentType} value={appointmentType}>
                  {appointmentType}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path
                  d="M13 3v4H9M3 13V9h4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Reset Filters
            </button>
            <Link href="/calculators" className={calculatorCloseLinkClassName} aria-label="Close and return to calculators">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </header>

        <div className="mt-3 space-y-3">
          {isLoading ? (
            <div className={`${cardClassName} p-8 text-center text-sm text-slate-600`}>Loading wait times…</div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800" role="alert">
              Could not load wait-time data. Showing cached or empty results.
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(380px,0.95fr)]">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:col-span-2 xl:col-span-2">
                  <SummaryStatCard
                    label="Total Consulates"
                    value={summary ? `${summary.postsCompared}` : "0"}
                    subvalue="consulates compared"
                    icon="posts"
                    tone="brand"
                  />
                  <SummaryStatCard
                    label="Average Wait Time"
                    value={summary ? `${summary.averageWaitDays} days` : "—"}
                    icon="average"
                    tone="brand"
                  />
                  <SummaryStatCard
                    label="Shortest Wait Time"
                    value={summary ? `${summary.fastest.waitDays} days` : "—"}
                    subvalue={summary ? summary.fastest.city : undefined}
                    icon="shortest"
                    tone="emerald"
                  />
                  <SummaryStatCard
                    label="Longest Wait Time"
                    value={summary ? `${summary.slowest.waitDays} days` : "—"}
                    subvalue={summary ? summary.slowest.city : undefined}
                    icon="longest"
                    tone="rose"
                  />
                </div>
                <div className="col-span-2 md:col-span-2 xl:col-span-1">
                  <HistoricalMovementCard
                    enabled={historyMetadata?.enabled ?? false}
                    improvingCount={movementSummary.improvingCount}
                    stableCount={movementSummary.stableCount}
                    increasingCount={movementSummary.increasingCount}
                    biggestImprovement={movementSummary.biggestImprovement}
                    biggestIncrease={movementSummary.biggestIncrease}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(380px,0.95fr)]">
                <div
                  className={`${cardClassName} flex min-h-[420px] flex-col md:col-span-2 xl:col-span-1 xl:h-[620px]`}
                  aria-labelledby="wait-map-panel-heading"
                >
                  <div className="border-b border-slate-100 px-4 py-2">
                    <h3 id="wait-map-panel-heading" className="text-sm font-semibold text-slate-900">
                      Map View
                    </h3>
                  </div>
                  <div className="relative min-h-0 flex-1">
                    <VisaStampingLeafletMap
                      posts={visiblePosts}
                      countryFilter={appliedCountry}
                      selectedPostId={selectedPost?.id ?? null}
                      mapFocusPostId={mapFocusPostId}
                      onSelectPost={(postId) => handleSelectPost(postId)}
                    />
                  </div>
                </div>

                <RankedPostsTable
                  posts={rankedPosts}
                  selectedPostId={selectedPost?.id ?? null}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectPost={(postId) => handleSelectPost(postId)}
                />

                <SelectedPostDetailsCard
                  post={selectedPost}
                  rank={selectedRank}
                  dataSource={metadata?.source}
                  country={appliedCountry}
                  visaType={appliedVisaType}
                  appointmentType={appliedAppointmentType}
                  onClearSelection={() => {
                    setSelectedPostId(rankedPosts[0]?.id ?? DEFAULT_SELECTED_POST_ID);
                    setMapFocusPostId(null);
                  }}
                />
              </div>
            </>
          )}

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="min-h-[140px] rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
              <h3 className="text-sm font-semibold text-sky-950">Important Note</h3>
              <p className="mt-2 text-sm leading-relaxed text-sky-900">
                Visa appointment wait times can change quickly. These estimates do not guarantee appointment availability.
              </p>
            </div>
            <div className="min-h-[140px] rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <h3 className="text-sm font-semibold text-amber-950">Disclaimer</h3>
              <p className="mt-2 text-xs leading-relaxed text-amber-950/90">
                This tool is educational only. Actual appointment availability depends on official scheduling systems,
                consular capacity, eligibility, and local policies. Wait times are estimates and may vary.
              </p>
            </div>
            <div className="min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Coming Soon</h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-600">
                <li>Historical trend charts for all consulates</li>
                <li>Wait-time alerts and notifications</li>
                <li>Country comparison and smart recommendations</li>
                <li>Dropbox and waiver analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </WorkspacePageShell>
  );
}
