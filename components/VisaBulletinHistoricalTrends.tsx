"use client";

/**
 * Visa Bulletin History — Design System 2.0 (S5-005).
 */

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import useSWR from "swr";
import { jsonFetcher, visaBulletinSwrOptions } from "@/lib/swr";
import {
  formatBulletinDate,
  parseBulletinCutoffDate,
} from "@/lib/visaBulletinData";
import {
  buildHistoryMovementChartData,
  computeVisaBulletinHistoryAnalytics,
  formatMovementDays,
} from "@/lib/visaBulletinHistoryAnalytics";
import type {
  BulletinHistoryType,
  VisaBulletinHistoryRecord,
} from "@/lib/visaBulletinHistory";
import { VisaBulletinHistoryChart } from "@/components/VisaBulletinHistoryChart";
import { VisaBulletinHistoryMovementChart } from "@/components/VisaBulletinHistoryMovementChart";
import {
  isHistoryScrollableDateRange,
  HISTORY_INITIAL_VISIBLE_MONTHS,
  useHistoryScrollToTop,
} from "@/components/VisaBulletinHistoryTimelineScroll";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";

const categoryOptions = [
  { value: "EB1", label: "EB-1" },
  { value: "EB2", label: "EB-2" },
  { value: "EB3", label: "EB-3" },
] as const;

const countryOptions = [
  { value: "China", label: "China" },
  { value: "India", label: "India" },
  { value: "Mexico", label: "Mexico" },
  { value: "Philippines", label: "Philippines" },
  { value: "Rest of the World", label: "Rest of the World" },
] as const;

const typeOptions: { value: BulletinHistoryType; label: string }[] = [
  { value: "FinalAction", label: "Final Action" },
  { value: "Filing", label: "Dates for Filing" },
];

const dateRangeOptions = [
  { value: "6", label: "6 Months" },
  { value: "12", label: "12 Months" },
  { value: "24", label: "24 Months" },
  { value: "60", label: "5 Years" },
  { value: "all", label: "All Time" },
] as const;

type DateRangeKey = (typeof dateRangeOptions)[number]["value"];

const DATE_RANGE_MONTHS: Record<Exclude<DateRangeKey, "all">, number> = {
  "6": 6,
  "12": 12,
  "24": 24,
  "60": 60,
};

/** Matches chart height in the analysis workspace for vertical alignment. */
const WORKSPACE_CHART_HEIGHT = 280;

const relatedTools = [
  {
    title: "Visa Bulletin Dashboard",
    description: "Latest cutoff dates and priority date data.",
    href: "/immigration/visa-bulletin",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M4 5h16v14H4V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Movement Tracker",
    description: "Compare cutoff dates month over month.",
    href: "/immigration/visa-bulletin-movement",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M4 16l5-5 4 4 7-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Green Card Wait Time",
    description: "Estimate wait based on priority date.",
    href: "/calculators/green-card-wait-time",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Citizenship Eligibility",
    description: "Check citizenship timeline eligibility.",
    href: "/calculators/citizenship-eligibility",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M12 3l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 15.8 7.2 17.6l.9-5.3L4.3 8.6l5.3-.8L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

function formatCutoffDate(value: string): string {
  const parsed = parseBulletinCutoffDate(value);
  if (parsed === "C") return "Current (C)";
  if (parsed === "U") return "Unavailable (U)";
  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) return formatBulletinDate(parsed);
  return value || "—";
}

function formatMonthShort(month: string): string {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function parseHistoryCutoffToDate(value: string): Date | null {
  const parsed = parseBulletinCutoffDate(value.trim());
  if (parsed === "C" || parsed === "U" || !/^\d{4}-\d{2}-\d{2}$/.test(parsed)) return null;
  const date = new Date(`${parsed}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function subtractMonths(month: string, count: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 - count, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function filterRowsByDateRange(rows: VisaBulletinHistoryRecord[], range: DateRangeKey) {
  if (range === "all" || rows.length === 0) return rows;
  const sorted = [...rows].sort((a, b) => b.month.localeCompare(a.month));
  const latestMonth = sorted[0]?.month;
  if (!latestMonth) return rows;
  const cutoffMonth = subtractMonths(latestMonth, DATE_RANGE_MONTHS[range]);
  return rows.filter((row) => row.month >= cutoffMonth);
}

function computeTrendStrength(totalMovementDays: number | null) {
  if (totalMovementDays === null) return { label: "N/A", accent: "slate" as const };
  if (totalMovementDays > 365) return { label: "Strong", accent: "amber" as const };
  if (totalMovementDays > 90) return { label: "Moderate", accent: "amber" as const };
  if (totalMovementDays > 0) return { label: "Slow", accent: "amber" as const };
  if (totalMovementDays < 0) return { label: "Retrogressing", accent: "amber" as const };
  return { label: "Stable", accent: "slate" as const };
}

/**
 * TODO(product): "Change vs Last Year" compares the latest parseable cutoff in the
 * filtered range to the cutoff from the first bulletin month at or before 12 months
 * earlier. Needs product review — rolling 12-month window vs calendar year.
 */
function computeYearOverYearChange(rows: VisaBulletinHistoryRecord[]): number | null {
  const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month));
  const datedRows = sorted
    .map((row) => ({ month: row.month, date: parseHistoryCutoffToDate(row.cutoffDate) }))
    .filter((row): row is { month: string; date: Date } => row.date !== null);
  if (datedRows.length < 2) return null;
  const latest = datedRows[datedRows.length - 1];
  const yearAgo = [...datedRows].reverse().find((row) => row.month <= subtractMonths(latest.month, 12));
  if (!yearAgo) return null;
  return Math.round((latest.date.getTime() - yearAgo.date.getTime()) / (1000 * 60 * 60 * 24));
}

type RowMovement = { days: number | null; label: string };

function computeRowMovements(rows: VisaBulletinHistoryRecord[]) {
  const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month));
  const movements = new Map<string, RowMovement>();
  for (let index = 0; index < sorted.length; index += 1) {
    const row = sorted[index];
    const key = `${row.month}-${row.category}-${row.country}-${row.type}`;
    if (index === 0) {
      movements.set(key, { days: null, label: "—" });
      continue;
    }
    const previousDate = parseHistoryCutoffToDate(sorted[index - 1].cutoffDate);
    const currentDate = parseHistoryCutoffToDate(row.cutoffDate);
    if (!previousDate || !currentDate) {
      movements.set(key, { days: null, label: "—" });
      continue;
    }
    const days = Math.round((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
    movements.set(key, { days, label: formatMovementDays(days) });
  }
  return movements;
}

function movementDotClass(days: number | null) {
  if (days === null) return "bg-slate-300";
  if (days > 0) return "bg-emerald-500";
  if (days < 0) return "bg-red-500";
  return "bg-slate-400";
}

const accentStyles = {
  brand: { icon: "bg-brand-50 text-brand-700", value: "text-brand-800" },
  green: { icon: "bg-emerald-50 text-emerald-700", value: "text-emerald-700" },
  red: { icon: "bg-red-50 text-red-700", value: "text-red-700" },
  amber: { icon: "bg-amber-50 text-amber-700", value: "text-amber-700" },
  slate: { icon: "bg-slate-100 text-slate-600", value: "text-slate-700" },
} as const;

function KpiIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
      {children}
    </span>
  );
}

function MetricCard({
  title,
  value,
  accent,
  icon,
  loading,
}: {
  title: string;
  value: string;
  accent: keyof typeof accentStyles;
  icon: ReactNode;
  loading: boolean;
}) {
  const styles = accentStyles[accent];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm">
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className={`truncate text-sm font-bold leading-tight ${styles.value}`}>
          {loading ? "…" : value}
        </p>
      </div>
    </div>
  );
}

function KpiSummaryRow({ rows, loading }: { rows: VisaBulletinHistoryRecord[]; loading: boolean }) {
  const analytics = useMemo(() => computeVisaBulletinHistoryAnalytics(rows), [rows]);
  const movementData = useMemo(() => buildHistoryMovementChartData(rows), [rows]);
  const changeVsLastMonth = movementData[movementData.length - 1]?.movementDays ?? null;
  const changeVsLastYear = useMemo(() => computeYearOverYearChange(rows), [rows]);
  const trendStrength = computeTrendStrength(analytics.totalMovementDays);

  const monthAccent =
    changeVsLastMonth === null ? "slate" : changeVsLastMonth > 0 ? "green" : changeVsLastMonth < 0 ? "red" : "slate";
  const yearAccent =
    changeVsLastYear === null ? "slate" : changeVsLastYear > 0 ? "green" : changeVsLastYear < 0 ? "red" : "slate";
  const totalAccent =
    analytics.totalMovementDays === null
      ? "slate"
      : analytics.totalMovementDays > 0
        ? "green"
        : analytics.totalMovementDays < 0
          ? "red"
          : "slate";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
      <MetricCard
        title="Current Cutoff"
        value={analytics.currentCutoff ?? "—"}
        accent="brand"
        loading={loading}
        icon={
          <KpiIcon>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
              <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 6h12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </KpiIcon>
        }
      />
      <MetricCard
        title="Change vs Last Month"
        value={formatMovementDays(changeVsLastMonth)}
        accent={monthAccent}
        loading={loading}
        icon={
          <KpiIcon>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M8 12V4M5 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </KpiIcon>
        }
      />
      <MetricCard
        title="Change vs Last Year"
        value={formatMovementDays(changeVsLastYear)}
        accent={yearAccent}
        loading={loading}
        icon={
          <KpiIcon>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M3 8h10M11 5l2 3-2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </KpiIcon>
        }
      />
      <MetricCard
        title="Total Movement"
        value={formatMovementDays(analytics.totalMovementDays)}
        accent={totalAccent}
        loading={loading}
        icon={
          <KpiIcon>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M2 12l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </KpiIcon>
        }
      />
      <MetricCard
        title="Trend Strength"
        value={trendStrength.label}
        accent={trendStrength.accent}
        loading={loading}
        icon={
          <KpiIcon>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M3 13V8M7 13V5M11 13V9M15 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </KpiIcon>
        }
      />
    </div>
  );
}

function ScrollableHistoricalTable({
  rows,
  loading,
  dateRange,
}: {
  rows: VisaBulletinHistoryRecord[];
  loading: boolean;
  dateRange: DateRangeKey;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => b.month.localeCompare(a.month)),
    [rows],
  );
  const movements = useMemo(() => computeRowMovements(rows), [rows]);
  const resetTableScroll =
    isHistoryScrollableDateRange(dateRange) && sortedRows.length > HISTORY_INITIAL_VISIBLE_MONTHS;

  useHistoryScrollToTop(scrollRef, resetTableScroll, `${dateRange}-${sortedRows.length}`);

  if (loading) {
    return <p className="text-xs text-slate-500">Loading…</p>;
  }

  if (rows.length === 0) {
    return <p className="text-xs text-slate-500">No records for selected filters.</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h3 className="shrink-0 text-sm font-semibold text-slate-900">Historical Data</h3>
      <div
        ref={scrollRef}
        className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-1"
        style={{ height: WORKSPACE_CHART_HEIGHT, maxHeight: WORKSPACE_CHART_HEIGHT }}
        tabIndex={0}
        aria-label="Historical data table, scroll for more months"
      >
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="pb-1.5 pr-1 font-semibold">Month</th>
              <th className="pb-1.5 pr-1 font-semibold">Cutoff</th>
              <th className="pb-1.5 font-semibold">Move</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => {
              const key = `${row.month}-${row.category}-${row.country}-${row.type}`;
              const movement = movements.get(key);
              return (
                <tr key={key} className="border-b border-slate-50">
                  <td className="py-1.5 pr-1 font-medium text-slate-800">{formatMonthShort(row.month)}</td>
                  <td className="py-1.5 pr-1 text-slate-700">{formatCutoffDate(row.cutoffDate)}</td>
                  <td className="py-1.5">
                    <span className="inline-flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${movementDotClass(movement?.days ?? null)}`} aria-hidden="true" />
                      <span className="text-slate-600">{movement?.label ?? "—"}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const filterSelectClassName =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 lg:text-sm lg:py-2 lg:px-3";

export function VisaBulletinHistoricalTrends() {
  const [category, setCategory] = useState("EB2");
  const [country, setCountry] = useState("India");
  const [type, setType] = useState<BulletinHistoryType>("FinalAction");
  const [dateRange, setDateRange] = useState<DateRangeKey>("6");
  const { tier } = useEffectiveSubscriptionTier();

  const params = new URLSearchParams({ category, country, type });
  const key = `/api/visa-bulletin-history?${params.toString()}`;
  const { data, error: swrError, isLoading } = useSWR<VisaBulletinHistoryRecord[]>(
    key,
    (url) => jsonFetcher(url, "Failed to load visa bulletin history."),
    visaBulletinSwrOptions,
  );

  const rows = useMemo(() => filterRowsByDateRange(data ?? [], dateRange), [data, dateRange]);
  const loading = isLoading;
  const error =
    swrError instanceof Error ? swrError.message : swrError ? "Failed to load visa bulletin history." : null;

  return (
    <div className="min-h-screen bg-[#eef4fb]">
      <div className="container-main py-5 sm:py-6 lg:py-7">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-2">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <li><Link href="/" className="hover:text-brand-700">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href="/immigration" className="hover:text-brand-700">Immigration</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href="/immigration/visa-bulletin" className="hover:text-brand-700">Visa Bulletin</Link></li>
                <li aria-hidden="true">/</li>
                <li className="font-medium text-brand-700">History</li>
              </ol>
            </nav>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">Visa Bulletin History</h1>
            </div>
            <p className="mt-1 max-w-xl text-sm text-slate-600">
              Track historical cutoff dates and identify trends for your immigration journey.
            </p>
          </div>

          <div className="flex flex-col gap-2 lg:items-end" aria-label="Filters">
            <div className="flex flex-wrap items-end gap-2 lg:justify-end">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Category</span>
                <select id="history-category" value={category} onChange={(e) => setCategory(e.target.value)} className={filterSelectClassName}>
                  {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Country</span>
                <select id="history-country" value={country} onChange={(e) => setCountry(e.target.value)} className={filterSelectClassName}>
                  {countryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Type</span>
                <select id="history-type" value={type} onChange={(e) => setType(e.target.value as BulletinHistoryType)} className={filterSelectClassName}>
                  {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Date Range</span>
                <select id="history-date-range" value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRangeKey)} className={filterSelectClassName}>
                  {dateRangeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
          </div>
        </header>

        <div className="mt-4 space-y-4 sm:mt-5">
          <KpiSummaryRow rows={rows} loading={loading} />

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              {error}
            </div>
          ) : null}

          <section
            aria-label="Analysis workspace"
            className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm"
          >
            <div className="grid divide-y divide-slate-100 xl:grid-cols-12 xl:divide-x xl:divide-y-0">
              <div className="p-4 xl:col-span-5 xl:p-5">
                <VisaBulletinHistoryChart
                  rows={rows}
                  loading={loading}
                  dateRange={dateRange}
                  embedded
                  title="Cutoff Date Over Time"
                  chartHeight={WORKSPACE_CHART_HEIGHT}
                />
              </div>

              <div className="p-4 xl:col-span-4 xl:p-4">
                <VisaBulletinHistoryMovementChart
                  rows={rows}
                  loading={loading}
                  dateRange={dateRange}
                  embedded
                  title="Monthly Movement"
                  chartHeight={WORKSPACE_CHART_HEIGHT}
                />
              </div>

              <div className="flex min-h-[320px] flex-col p-4 xl:col-span-3 xl:p-4">
                <ScrollableHistoricalTable rows={rows} loading={loading} dateRange={dateRange} />
              </div>
            </div>
          </section>

          <section aria-labelledby="related-tools">
            <h2 id="related-tools" className="mb-3 text-sm font-semibold text-slate-800">
              Related Tools
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:border-brand-200 hover:shadow-md"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 group-hover:bg-brand-100">
                    {tool.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900 group-hover:text-brand-800">{tool.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-600">{tool.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {tier === "free" ? (
            <section className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-brand-200/60 bg-gradient-to-r from-brand-50 to-white px-5 py-4 shadow-sm sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-bold text-slate-900">Unlock More with Pro</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  History, movement tracking, alerts, and personalized dashboard tools.
                </p>
              </div>
              <Link href="/pricing" className="btn-primary shrink-0 px-5 py-2 text-sm">
                Upgrade to Pro
              </Link>
            </section>
          ) : null}

          <p className="rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 text-xs leading-relaxed text-slate-500">
            Historical data is sourced from archived visa bulletin records. This page is informational and does not constitute legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
