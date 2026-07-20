"use client";

/**
 * Visa Bulletin Dashboard — Design System 2.0 (S5-008).
 * Visual language aligned with Visa Bulletin Movement Tracker (Sprint 5).
 */

import Link from "next/link";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { jsonFetcher, visaBulletinSwrOptions } from "@/lib/swr";
import { bulletinDateTypeTabClassName } from "@/lib/visa/bulletinDateTypeTabs";
import { parseBulletinCutoffDate, type VisaBulletinDataType, type VisaBulletinRow } from "@/lib/visaBulletinData";

type TabKey = VisaBulletinDataType;
type CategoryKey = "EB1" | "EB2" | "EB3" | "EB4" | "EB5" | "OTHER";

const tabs: { key: TabKey; label: string }[] = [
  { key: "final-action", label: "Final Action Dates" },
  { key: "filing", label: "Dates for Filing" },
];

const categoryOrder: CategoryKey[] = ["EB1", "EB2", "EB3", "EB4", "EB5", "OTHER"];

const categoryLabels: Record<CategoryKey, string> = {
  EB1: "EB-1",
  EB2: "EB-2",
  EB3: "EB-3",
  EB4: "EB-4",
  EB5: "EB-5",
  OTHER: "Other",
};

const categoryStyles: Record<
  CategoryKey,
  { badge: string; groupRow: string; divider: string }
> = {
  EB1: {
    badge: "bg-blue-100 text-blue-900 ring-blue-200",
    groupRow: "bg-blue-50",
    divider: "border-blue-100",
  },
  EB2: {
    badge: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    groupRow: "bg-emerald-50",
    divider: "border-emerald-100",
  },
  EB3: {
    badge: "bg-amber-100 text-amber-900 ring-amber-200",
    groupRow: "bg-amber-50",
    divider: "border-amber-100",
  },
  EB4: {
    badge: "bg-violet-100 text-violet-900 ring-violet-200",
    groupRow: "bg-violet-50",
    divider: "border-violet-100",
  },
  EB5: {
    badge: "bg-orange-100 text-orange-900 ring-orange-200",
    groupRow: "bg-orange-50",
    divider: "border-orange-100",
  },
  OTHER: {
    badge: "bg-slate-100 text-slate-800 ring-slate-200",
    groupRow: "bg-slate-50",
    divider: "border-slate-200",
  },
};

const filterSelectClassName =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 lg:text-sm lg:py-2 lg:px-3";

const tableHeadCellClass = "px-3 py-1.5 text-[11px] font-semibold text-slate-600";
const tableBodyCellClass = "px-3 py-1.5 text-slate-700";

const relatedTools = [
  {
    title: "Visa Bulletin Movement Tracker",
    description: "Month-over-month movement and change analysis.",
    href: "/immigration/visa-bulletin-movement",
    iconClass: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path
          d="M4 16l5-5 4 4 7-9"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Visa Bulletin History",
    description: "Explore archived cutoff dates and trend analysis.",
    href: "/immigration/visa-bulletin-history",
    iconClass: "bg-violet-50 text-violet-700 group-hover:bg-violet-100",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Green Card Calculator",
    description: "Estimate wait based on priority date.",
    href: "/calculators/green-card-wait-time",
    iconClass: "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 10h4M7 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

function normalizeCategoryKey(category: string): CategoryKey {
  const match = category.match(/eb\s*(\d)/i);
  if (!match) return "OTHER";
  const key = `EB${match[1]}` as CategoryKey;
  return key in categoryLabels ? key : "OTHER";
}

function formatTableCutoffDate(value: string): string {
  const parsed = parseBulletinCutoffDate(value);
  if (parsed === "C") return "Current";
  if (parsed === "U") return "Unavailable";
  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
    return new Date(`${parsed}T00:00:00`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return value || "—";
}

function getStatus(cutoffDate: string): { label: string; badgeClass: string } {
  const normalized = cutoffDate.trim().toUpperCase();

  if (normalized === "C") {
    return {
      label: "Current",
      badgeClass: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    };
  }

  if (normalized === "U") {
    return {
      label: "Unavailable",
      badgeClass: "bg-red-50 text-red-800 ring-red-200",
    };
  }

  return {
    label: "Waiting Queue",
    badgeClass: "bg-amber-50 text-amber-900 ring-amber-200",
  };
}

function groupRowsByCategory(
  rows: VisaBulletinRow[],
): [CategoryKey, VisaBulletinRow[]][] {
  const grouped = new Map<CategoryKey, VisaBulletinRow[]>();

  for (const row of rows) {
    const key = normalizeCategoryKey(row.category);
    const existing = grouped.get(key) ?? [];
    existing.push(row);
    grouped.set(key, existing);
  }

  return categoryOrder
    .filter((key) => grouped.has(key))
    .map((key) => [key, [...grouped.get(key)!].sort((a, b) => a.country.localeCompare(b.country))]);
}

function filterTableRows(
  rows: VisaBulletinRow[],
  categoryFilter: string,
  countryFilter: string,
): VisaBulletinRow[] {
  return rows.filter((row) => {
    if (categoryFilter !== "all" && normalizeCategoryKey(row.category) !== categoryFilter) {
      return false;
    }
    if (countryFilter !== "all" && row.country !== countryFilter) {
      return false;
    }
    return true;
  });
}

function CategoryBadge2({ categoryKey }: { categoryKey: CategoryKey }) {
  const styles = categoryStyles[categoryKey];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${styles.badge}`}
    >
      {categoryLabels[categoryKey]}
    </span>
  );
}

function BulletinTable2({
  rows,
  dateColumnLabel,
  embedded = false,
}: {
  rows: VisaBulletinRow[];
  dateColumnLabel: string;
  embedded?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div
        className={`p-8 text-center text-sm text-slate-500 ${
          embedded ? "" : "rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm"
        }`}
      >
        No records match the selected filters.
      </div>
    );
  }

  const table = (
    <table className="w-full table-fixed text-xs">
      <colgroup>
        <col className="w-[34%]" />
        <col className="w-[38%]" />
        <col className="w-[28%]" />
      </colgroup>
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50/80">
          <th className={`${tableHeadCellClass} text-left`}>Country</th>
          <th className={`${tableHeadCellClass} text-left`}>{dateColumnLabel}</th>
          <th className={`${tableHeadCellClass} text-center`}>Status</th>
        </tr>
      </thead>
      {groupRowsByCategory(rows).map(([categoryKey, groupRows]) => {
        const styles = categoryStyles[categoryKey];
        return (
          <tbody key={categoryKey}>
            <tr className={`${styles.groupRow} border-t-2 ${styles.divider}`}>
              <th colSpan={3} scope="colgroup" className="px-3 py-1.5 text-left">
                <CategoryBadge2 categoryKey={categoryKey} />
              </th>
            </tr>
            {groupRows.map((row) => {
              const status = getStatus(row.finalActionDate);

              return (
                <tr
                  key={`${row.category}-${row.country}`}
                  className={`border-t ${styles.divider} bg-white transition-colors hover:bg-slate-50/60`}
                >
                  <td
                    className={`${tableBodyCellClass} truncate text-left font-medium text-slate-900`}
                    title={row.country}
                  >
                    {row.country}
                  </td>
                  <td className={`${tableBodyCellClass} whitespace-nowrap text-left`}>
                    {formatTableCutoffDate(row.finalActionDate)}
                  </td>
                  <td className={`${tableBodyCellClass} text-center`}>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${status.badgeClass}`}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        );
      })}
    </table>
  );

  if (embedded) {
    return <div className="overflow-x-auto">{table}</div>;
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">{table}</div>
    </div>
  );
}

function BulletinPanel({
  title,
  rows,
  dateColumnLabel,
  panelId,
  variant,
}: {
  title: string;
  rows: VisaBulletinRow[];
  dateColumnLabel: string;
  panelId: string;
  variant: TabKey;
}) {
  const headerClass =
    variant === "final-action"
      ? "border-blue-100 bg-blue-50/90 text-brand-800"
      : "border-emerald-100 bg-emerald-50/90 text-emerald-800";

  return (
    <div
      className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm"
      aria-labelledby={panelId}
    >
      <h3
        id={panelId}
        className={`border-b px-3 py-2 text-sm font-bold tracking-tight ${headerClass}`}
      >
        {title}
      </h3>
      <BulletinTable2 rows={rows} dateColumnLabel={dateColumnLabel} embedded />
    </div>
  );
}

function getSectionTitle(bulletinMonthLabel: string | null): string {
  if (!bulletinMonthLabel) {
    return "Current Visa Bulletin";
  }

  return `${bulletinMonthLabel} Visa Bulletin`;
}

export function VisaBulletinDashboard2({
  bulletinMonthLabel,
}: {
  bulletinMonthLabel: string | null;
}) {
  const [mobileTab, setMobileTab] = useState<TabKey>("final-action");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const finalActionKey = "/api/visa-bulletin?type=final-action";
  const filingKey = "/api/visa-bulletin?type=filing";

  const {
    data: finalActionData,
    error: finalActionError,
    isLoading: finalActionLoading,
  } = useSWR<VisaBulletinRow[]>(
    finalActionKey,
    (url) => jsonFetcher(url, "Failed to load final action dates."),
    visaBulletinSwrOptions,
  );

  const {
    data: filingData,
    error: filingError,
    isLoading: filingLoading,
  } = useSWR<VisaBulletinRow[]>(
    filingKey,
    (url) => jsonFetcher(url, "Failed to load dates for filing."),
    visaBulletinSwrOptions,
  );

  const finalActionRows = useMemo(() => finalActionData ?? [], [finalActionData]);
  const filingRows = useMemo(() => filingData ?? [], [filingData]);
  const allRows = useMemo(
    () => [...finalActionRows, ...filingRows],
    [finalActionRows, filingRows],
  );

  const loading = finalActionLoading || filingLoading;
  const error =
    finalActionError instanceof Error
      ? finalActionError.message
      : filingError instanceof Error
        ? filingError.message
        : finalActionError || filingError
          ? "Failed to load visa bulletin data."
          : null;

  const categoryOptions = useMemo(() => {
    const keys = new Set(allRows.map((row) => normalizeCategoryKey(row.category)));
    return [
      { value: "all", label: "All EB Categories" },
      ...categoryOrder
        .filter((key) => keys.has(key))
        .map((key) => ({ value: key, label: categoryLabels[key] })),
    ];
  }, [allRows]);

  const countryOptions = useMemo(() => {
    const countries = [...new Set(allRows.map((row) => row.country))].sort((a, b) =>
      a.localeCompare(b),
    );
    return [{ value: "all", label: "All Countries" }, ...countries.map((c) => ({ value: c, label: c }))];
  }, [allRows]);

  const filteredFinalActionRows = useMemo(
    () => filterTableRows(finalActionRows, categoryFilter, countryFilter),
    [finalActionRows, categoryFilter, countryFilter],
  );

  const filteredFilingRows = useMemo(
    () => filterTableRows(filingRows, categoryFilter, countryFilter),
    [filingRows, categoryFilter, countryFilter],
  );

  const filteredMobileRows =
    mobileTab === "final-action" ? filteredFinalActionRows : filteredFilingRows;

  const resetFilters = () => {
    setCategoryFilter("all");
    setCountryFilter("all");
  };

  return (
    <WorkspacePageShell>
      <div className="container-main py-4 sm:py-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M4 18V6M10 18V10M16 18V4M20 18v-4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">
                    Visa Bulletin Dashboard
                  </h1>
                  <FavoriteStar pageLabel="Visa Bulletin Dashboard" pageHref="/immigration/visa-bulletin" />
                </div>
              </div>
            </div>
          <DashboardCloseAction />
        </header>

        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
              Loading visa bulletin data…
            </div>
          ) : error ? (
            <div
              className="rounded-[1.25rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : (
            <section aria-labelledby="bulletin-table-heading">
              <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h2
                    id="bulletin-table-heading"
                    className="text-base font-semibold text-slate-900"
                  >
                    {getSectionTitle(bulletinMonthLabel)}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    (Data source : U.S. Department of State Visa Bulletin)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className={filterSelectClassName}
                    aria-label="Filter by EB category"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={countryFilter}
                    onChange={(event) => setCountryFilter(event.target.value)}
                    className={filterSelectClassName}
                    aria-label="Filter by country"
                  >
                    {countryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:text-sm"
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
                </div>
              </div>

              <div className="hidden gap-2 xl:grid xl:grid-cols-2 xl:items-start">
                <BulletinPanel
                  panelId="final-action-panel-heading"
                  title="Final Action Dates"
                  rows={filteredFinalActionRows}
                  dateColumnLabel="Final Action Date"
                  variant="final-action"
                />
                <BulletinPanel
                  panelId="filing-panel-heading"
                  title="Dates for Filing"
                  rows={filteredFilingRows}
                  dateColumnLabel="Date for Filing"
                  variant="filing"
                />
              </div>

              <div className="xl:hidden">
                <div
                  className="mb-3 flex flex-wrap items-center gap-3"
                  role="tablist"
                  aria-label="Visa bulletin date type"
                >
                  {tabs.map((tab) => {
                    const isActive = mobileTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={bulletinDateTypeTabClassName(tab.key, { compact: true })}
                        onClick={() => setMobileTab(tab.key)}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <BulletinTable2
                  rows={filteredMobileRows}
                  dateColumnLabel={
                    mobileTab === "final-action" ? "Final Action Date" : "Date for Filing"
                  }
                />
              </div>
            </section>
          )}

          <section aria-labelledby="related-tools" className="pt-1">
            <h2 id="related-tools" className="mb-2 text-sm font-semibold text-slate-800">
              Related Tools
            </h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:border-brand-200 hover:shadow-md"
                >
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tool.iconClass}`}
                  >
                    {tool.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-900 group-hover:text-brand-800">
                      {tool.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-600">
                      {tool.description}
                    </span>
                  </span>
                  <svg
                    viewBox="0 0 16 16"
                    className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-brand-600"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </section>

          <p className="rounded-xl border border-slate-200/60 bg-white/60 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            This dashboard is for informational purposes only and does not constitute legal advice.
            Final action dates can change each month when a new visa bulletin is published.
          </p>
        </div>
      </div>
    </WorkspacePageShell>
  );
}
