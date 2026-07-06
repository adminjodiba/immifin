"use client";

/**
 * Visa Bulletin Movement Tracker — Design System 2.0 (S5-007).
 * Visual language aligned with Visa Bulletin History (Sprint 5).
 */

import Link from "next/link";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import { jsonFetcher, visaBulletinSwrOptions } from "@/lib/swr";
import {
  formatBulletinDate,
  parseBulletinCutoffDate,
} from "@/lib/visaBulletinData";
import type {
  MovementComparisonType,
  MovementType,
  VisaBulletinMovementRow,
} from "@/lib/visaBulletinMovement";

type TabKey = MovementComparisonType;
type CategoryKey = "EB1" | "EB2" | "EB3" | "EB4" | "EB5" | "OTHER";
type TableMovementFilter = "all" | "forward" | "retrogression" | "no-change" | "current";

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

const kpiAccent = {
  forward: {
    card: "border-emerald-200/80 bg-emerald-50/90",
    active: "ring-2 ring-emerald-400 bg-emerald-100/80",
    count: "text-emerald-800",
    label: "text-emerald-900",
    icon: "bg-emerald-100 text-emerald-700",
  },
  retrogression: {
    card: "border-red-200/80 bg-red-50/90",
    active: "ring-2 ring-red-400 bg-red-100/80",
    count: "text-red-800",
    label: "text-red-900",
    icon: "bg-red-100 text-red-700",
  },
  "no-change": {
    card: "border-slate-200/80 bg-slate-50/90",
    active: "ring-2 ring-slate-400 bg-slate-100/80",
    count: "text-slate-800",
    label: "text-slate-900",
    icon: "bg-slate-100 text-slate-600",
  },
  current: {
    card: "border-blue-200/80 bg-blue-50/90",
    active: "ring-2 ring-blue-400 bg-blue-100/80",
    count: "text-blue-800",
    label: "text-blue-900",
    icon: "bg-blue-100 text-blue-700",
  },
} as const;

const filterSelectClassName =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 lg:text-sm lg:py-2 lg:px-3";

const relatedTools = [
  {
    title: "Visa Bulletin Dashboard",
    description: "Latest cutoff dates and priority date data.",
    href: "/immigration/visa-bulletin",
    iconClass: "bg-blue-50 text-blue-700 group-hover:bg-blue-100",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M4 18V6M10 18V10M16 18V4M20 18v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
    title: "Green Card Wait Time",
    description: "Estimate wait based on priority date.",
    href: "/calculators/green-card-wait-time",
    iconClass: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100",
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

function formatCategoryCountry(row: VisaBulletinMovementRow): string {
  return `${categoryLabels[normalizeCategoryKey(row.category)]} ${row.country}`;
}

function formatCutoffDate(value: string): string {
  const parsed = parseBulletinCutoffDate(value);
  if (parsed === "C") return "Current (C)";
  if (parsed === "U") return "Unavailable (U)";
  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) return formatBulletinDate(parsed);
  return value || "—";
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

const tableHeadCellClass = "px-3 py-2 text-[11px] font-semibold text-slate-600";
const tableBodyCellClass = "px-3 py-2 text-slate-700";

function approxMonths(days: number): number {
  return Math.max(1, Math.round(Math.abs(days) / 30));
}

function movementBadgeLabel(movementType: MovementType): string {
  switch (movementType) {
    case "forward":
      return "Advanced";
    case "retrogression":
      return "Retrogressed";
    case "no-change":
      return "No Change";
    case "current":
      return "Current";
    case "unavailable":
      return "Unavailable";
    case "invalid":
      return "Invalid";
  }
}

function movementBadgeClasses(movementType: MovementType): string {
  switch (movementType) {
    case "forward":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "retrogression":
      return "bg-red-50 text-red-800 ring-red-200";
    case "no-change":
      return "bg-slate-50 text-slate-700 ring-slate-200";
    case "current":
      return "bg-blue-50 text-blue-800 ring-blue-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function groupRowsByCategory(
  rows: VisaBulletinMovementRow[],
): [CategoryKey, VisaBulletinMovementRow[]][] {
  const grouped = new Map<CategoryKey, VisaBulletinMovementRow[]>();

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
  rows: VisaBulletinMovementRow[],
  movementFilter: TableMovementFilter,
  categoryFilter: string,
  countryFilter: string,
): VisaBulletinMovementRow[] {
  return rows.filter((row) => {
    if (movementFilter !== "all" && row.movementType !== movementFilter) return false;
    if (categoryFilter !== "all" && normalizeCategoryKey(row.category) !== categoryFilter) return false;
    if (countryFilter !== "all" && row.country !== countryFilter) return false;
    return true;
  });
}

type ChangePanelKey = "forward" | "retrogression" | "current";

function buildChangePanels(rows: VisaBulletinMovementRow[]): Record<
  ChangePanelKey,
  VisaBulletinMovementRow[]
> {
  return {
    forward: [...rows]
      .filter((row) => row.movementType === "forward")
      .sort((a, b) => (b.movementDays ?? 0) - (a.movementDays ?? 0)),
    retrogression: [...rows]
      .filter((row) => row.movementType === "retrogression")
      .sort((a, b) => (a.movementDays ?? 0) - (b.movementDays ?? 0)),
    current: [...rows]
      .filter((row) => row.movementType === "current")
      .sort((a, b) => a.country.localeCompare(b.country)),
  };
}

const changePanelStyles: Record<
  ChangePanelKey,
  { title: string; header: string; border: string; bg: string; metric: string }
> = {
  forward: {
    title: "Advanced",
    header: "text-emerald-800",
    border: "border-emerald-100",
    bg: "bg-emerald-50/40",
    metric: "text-emerald-700",
  },
  retrogression: {
    title: "Retrogressed",
    header: "text-red-800",
    border: "border-red-100",
    bg: "bg-red-50/40",
    metric: "text-red-700",
  },
  current: {
    title: "Became Current",
    header: "text-blue-800",
    border: "border-blue-100",
    bg: "bg-blue-50/40",
    metric: "text-blue-700",
  },
};

function getWhatChangedSectionTitle(bulletinMonthLabel: string | null): string {
  if (!bulletinMonthLabel) {
    return "What changed in Visa Bulletin ?";
  }

  return `What changed in ${bulletinMonthLabel} Visa Bulletin ?`;
}

/** Max glance rows per column before scrolling; sorted by magnitude (advances/retro) or country. */
const WHAT_CHANGED_MAX_VISIBLE = 5;
/** Fixed scroll height for each What Changed column (~5 compact rows). */
const WHAT_CHANGED_LIST_MAX_HEIGHT = 260;
/** Fixed height for the 3-column glance grid so KPI + table stay on screen. */
const WHAT_CHANGED_GRID_HEIGHT = 300;

function formatChangeHeadline(row: VisaBulletinMovementRow, panelKey: ChangePanelKey): string {
  const label = formatCategoryCountry(row);

  if (panelKey === "current") {
    return label;
  }

  const days = row.movementDays ?? 0;
  const sign = days > 0 ? "+" : "";
  const months =
    row.movementMonths !== null ? Math.abs(row.movementMonths) : approxMonths(Math.abs(days));
  const monthSuffix =
    months > 0 ? ` ≈ ${months} ${months === 1 ? "month" : "months"}` : "";

  return `${label} ${sign}${days} days${monthSuffix}`;
}

function formatChangeDateRange(row: VisaBulletinMovementRow, panelKey: ChangePanelKey): string {
  if (panelKey === "current") {
    return `From ${formatCutoffDate(row.previousDate)} to Current`;
  }

  return `From ${formatCutoffDate(row.previousDate)} to ${formatCutoffDate(row.currentDate)}`;
}

function ChangePanelList({
  panelKey,
  rows,
}: {
  panelKey: ChangePanelKey;
  rows: VisaBulletinMovementRow[];
}) {
  const styles = changePanelStyles[panelKey];
  const hasOverflow = rows.length > WHAT_CHANGED_MAX_VISIBLE;

  return (
    <div className={`flex h-full min-h-0 flex-col rounded-xl border p-3 ${styles.border} ${styles.bg}`}>
      <div className="shrink-0">
        <h3 className={`text-[10px] font-bold uppercase tracking-wide ${styles.header}`}>
          {styles.title} ({rows.length})
        </h3>
        {hasOverflow ? (
          <p className="mt-0.5 text-[9px] font-medium text-slate-500">
            Top {WHAT_CHANGED_MAX_VISIBLE} shown — scroll for more
          </p>
        ) : null}
      </div>
      <ul
        className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-0.5"
        style={{ maxHeight: WHAT_CHANGED_LIST_MAX_HEIGHT }}
        tabIndex={hasOverflow ? 0 : undefined}
        aria-label={
          hasOverflow
            ? `${styles.title} changes, scroll for more`
            : `${styles.title} changes`
        }
      >
        {rows.length === 0 ? (
          <li className="text-xs text-slate-500">None this month</li>
        ) : (
          rows.map((row) => (
            <li
              key={`${row.category}-${row.country}-${panelKey}`}
              className="mb-2 rounded-lg border border-white/60 bg-white/70 px-2.5 py-2 last:mb-0"
            >
              <p className={`text-xs font-semibold leading-snug ${styles.metric}`}>
                {formatChangeHeadline(row, panelKey)}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                {formatChangeDateRange(row, panelKey)}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function WhatChangedThisMonthSection2({
  rows,
  bulletinMonthLabel,
}: {
  rows: VisaBulletinMovementRow[];
  bulletinMonthLabel: string | null;
}) {
  const panels = useMemo(() => buildChangePanels(rows), [rows]);
  const sectionTitle = getWhatChangedSectionTitle(bulletinMonthLabel);
  const hasChanges =
    panels.forward.length > 0 || panels.retrogression.length > 0 || panels.current.length > 0;

  return (
    <section
      aria-labelledby="what-changed-heading"
      className="rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
    >
      <h2 id="what-changed-heading" className="text-sm font-semibold text-slate-900">
        {sectionTitle}
      </h2>

      {!hasChanges ? (
        <p className="mt-3 text-xs text-slate-500">No movement changes for this comparison.</p>
      ) : (
        <div
          className="mt-3 grid grid-cols-3 gap-2 sm:gap-3"
          style={{ height: WHAT_CHANGED_GRID_HEIGHT }}
        >
          <ChangePanelList panelKey="forward" rows={panels.forward} />
          <ChangePanelList panelKey="retrogression" rows={panels.retrogression} />
          <ChangePanelList panelKey="current" rows={panels.current} />
        </div>
      )}
    </section>
  );
}

function KpiFilterButton2({
  filterKey,
  label,
  count,
  active,
  onSelect,
  icon,
}: {
  filterKey: Exclude<TableMovementFilter, "all">;
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
  icon: ReactNode;
}) {
  const accent = kpiAccent[filterKey];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      title={`${count} ${label.toLowerCase()} categories / countries — filter table`}
      className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left shadow-sm transition ${
        active ? accent.active : `${accent.card} hover:shadow-md`
      }`}
    >
      <span
        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${accent.icon}`}
      >
        {icon}
      </span>
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className={`text-lg font-bold tabular-nums leading-none ${accent.count}`}>
          {count}
        </span>
        <span className={`truncate text-xs font-semibold ${accent.label}`}>{label}</span>
      </span>
    </button>
  );
}

function KpiCardsRow2({
  rows,
  movementFilter,
  onSelect,
}: {
  rows: VisaBulletinMovementRow[];
  movementFilter: TableMovementFilter;
  onSelect: (filter: TableMovementFilter) => void;
}) {
  const counts = useMemo(
    () => ({
      forward: rows.filter((row) => row.movementType === "forward").length,
      retrogression: rows.filter((row) => row.movementType === "retrogression").length,
      "no-change": rows.filter((row) => row.movementType === "no-change").length,
      current: rows.filter((row) => row.movementType === "current").length,
    }),
    [rows],
  );

  const cards: Array<{
    key: Exclude<TableMovementFilter, "all">;
    label: string;
    icon: ReactNode;
  }> = [
    {
      key: "forward",
      label: "Advanced",
      icon: (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M8 12V4M5 7l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "retrogression",
      label: "Retrogressed",
      icon: (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M8 4v8M5 9l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "no-change",
      label: "No Change",
      icon: (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "current",
      label: "Current",
      icon: (
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cards.map((card) => (
        <KpiFilterButton2
          key={card.key}
          filterKey={card.key}
          label={card.label}
          count={counts[card.key]}
          active={movementFilter === card.key}
          onSelect={() => onSelect(movementFilter === card.key ? "all" : card.key)}
          icon={card.icon}
        />
      ))}
    </div>
  );
}

function ChangeDaysCell({ row }: { row: VisaBulletinMovementRow }) {
  if (row.movementType === "current") {
    return <span className="font-semibold text-blue-700">Current</span>;
  }
  if (row.movementType === "no-change") {
    return <span className="text-slate-500">—</span>;
  }
  if (row.movementType === "unavailable" || row.movementType === "invalid") {
    return <span className="text-slate-500">—</span>;
  }

  const days = row.movementDays;
  if (days === null || days === 0) return <span className="text-slate-500">—</span>;

  const sign = days > 0 ? "+" : "";
  const months = row.movementMonths ?? approxMonths(Math.abs(days));
  const color = days > 0 ? "text-emerald-700" : "text-red-700";
  const monthSuffix =
    months !== 0
      ? ` ≈ ${Math.abs(months)} ${Math.abs(months) === 1 ? "month" : "months"}`
      : "";

  return (
    <span className={`font-semibold tabular-nums ${color}`}>
      {sign}
      {days} days{monthSuffix}
    </span>
  );
}

function MovementBadge2({ row, compact = false }: { row: VisaBulletinMovementRow; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ${movementBadgeClasses(row.movementType)} ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      {movementBadgeLabel(row.movementType)}
    </span>
  );
}

function CategoryBadge2({ categoryKey, compact = false }: { categoryKey: CategoryKey; compact?: boolean }) {
  const styles = categoryStyles[categoryKey];
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ring-1 ${styles.badge} ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      {categoryLabels[categoryKey]}
    </span>
  );
}

function MovementTable2({ rows }: { rows: VisaBulletinMovementRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No records match the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[26%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className={`${tableHeadCellClass} text-left`}>Country</th>
              <th className={`${tableHeadCellClass} text-left`}>Previous</th>
              <th className={`${tableHeadCellClass} text-left`}>Current</th>
              <th className={`${tableHeadCellClass} text-center`}>Movement</th>
              <th className={`${tableHeadCellClass} text-right`}>
                <span className="inline-flex items-center justify-end gap-1">
                  Change
                  <span
                    className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-500"
                    title="Movement difference shown primarily in days"
                    aria-label="Movement difference shown primarily in days"
                  >
                    i
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          {groupRowsByCategory(rows).map(([categoryKey, groupRows]) => {
            const styles = categoryStyles[categoryKey];
            return (
              <tbody key={categoryKey}>
                <tr className={`${styles.groupRow} border-t-2 ${styles.divider}`}>
                  <th colSpan={5} scope="colgroup" className="px-3 py-2 text-left">
                    <CategoryBadge2 categoryKey={categoryKey} compact />
                  </th>
                </tr>
                {groupRows.map((row) => (
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
                      {formatTableCutoffDate(row.previousDate)}
                    </td>
                    <td className={`${tableBodyCellClass} whitespace-nowrap text-left`}>
                      {formatTableCutoffDate(row.currentDate)}
                    </td>
                    <td className={`${tableBodyCellClass} text-center`}>
                      <MovementBadge2 row={row} compact />
                    </td>
                    <td className={`${tableBodyCellClass} whitespace-nowrap text-right`}>
                      <ChangeDaysCell row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>
    </div>
  );
}

const filterChipConfig: Array<{
  key: TableMovementFilter;
  label: string;
  icon?: ReactNode;
  inactiveClass?: string;
}> = [
  { key: "all", label: "Show All" },
  {
    key: "forward",
    label: "Advanced",
    inactiveClass: "text-emerald-700",
    icon: (
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
        <path d="M6 9V3M4 5l2-2 2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "retrogression",
    label: "Retrogressed",
    inactiveClass: "text-red-700",
    icon: (
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
        <path d="M6 3v6M4 7l2 2 2-2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "no-change",
    label: "No Change",
    inactiveClass: "text-slate-600",
    icon: (
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
        <path d="M2 6h8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "current",
    label: "Current",
    inactiveClass: "text-blue-700",
    icon: <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />,
  },
];

export function VisaBulletinMovementTracker2({
  bulletinMonthLabel = null,
}: {
  bulletinMonthLabel?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("final-action");
  const [movementFilter, setMovementFilter] = useState<TableMovementFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const key = `/api/visa-bulletin-movement?type=${activeTab}`;
  const { data, error: swrError, isLoading } = useSWR<VisaBulletinMovementRow[]>(
    key,
    (url) => jsonFetcher(url, "Failed to load visa bulletin movement data."),
    visaBulletinSwrOptions,
  );

  const rows = useMemo(() => data ?? [], [data]);
  const loading = isLoading;
  const error =
    swrError instanceof Error
      ? swrError.message
      : swrError
        ? "Failed to load visa bulletin movement data."
        : null;

  const counts = useMemo(
    () => ({
      all: rows.length,
      forward: rows.filter((row) => row.movementType === "forward").length,
      retrogression: rows.filter((row) => row.movementType === "retrogression").length,
      "no-change": rows.filter((row) => row.movementType === "no-change").length,
      current: rows.filter((row) => row.movementType === "current").length,
    }),
    [rows],
  );

  const categoryOptions = useMemo(() => {
    const keys = new Set(rows.map((row) => normalizeCategoryKey(row.category)));
    return [
      { value: "all", label: "All EB Categories" },
      ...categoryOrder
        .filter((key) => keys.has(key))
        .map((key) => ({ value: key, label: categoryLabels[key] })),
    ];
  }, [rows]);

  const countryOptions = useMemo(() => {
    const countries = [...new Set(rows.map((row) => row.country))].sort((a, b) =>
      a.localeCompare(b),
    );
    return [{ value: "all", label: "All Countries" }, ...countries.map((c) => ({ value: c, label: c }))];
  }, [rows]);

  const filteredRows = useMemo(
    () => filterTableRows(rows, movementFilter, categoryFilter, countryFilter),
    [rows, movementFilter, categoryFilter, countryFilter],
  );

  const resetFilters = () => {
    setMovementFilter("all");
    setCategoryFilter("all");
    setCountryFilter("all");
  };

  return (
    <WorkspacePageShell>
      <div className="container-main py-5 sm:py-6 lg:py-7">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M4 16l5-5 4 4 7-9"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl">
                    Visa Bulletin Movement Tracker
                  </h1>
                  <FavoriteStar
                    pageLabel="Visa Bulletin Movement Tracker"
                    pageHref="/immigration/visa-bulletin-movement"
                  />
                </div>
                <p className="mt-1 max-w-xl text-sm text-slate-600">
                  Compare Visa Bulletin movements between two consecutive months.
                </p>
              </div>
            </div>
          </div>

          <div
            className="flex flex-wrap items-center gap-2 xl:justify-end"
            aria-label="Visa bulletin date type"
          >
            <div
              className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              role="tablist"
            >
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                      isActive
                        ? "bg-brand-700 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    } ${index > 0 ? "border-l border-slate-200" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="mt-4 space-y-4 sm:mt-5">
          {loading ? (
            <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
              Loading movement data…
            </div>
          ) : error ? (
            <div
              className="rounded-[1.25rem] border border-red-200 bg-red-50 p-5 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : (
            <>
              <KpiCardsRow2
                rows={rows}
                movementFilter={movementFilter}
                onSelect={setMovementFilter}
              />

              <WhatChangedThisMonthSection2 rows={rows} bulletinMonthLabel={bulletinMonthLabel} />

              <section aria-labelledby="all-changes-heading">
                <h2
                  id="all-changes-heading"
                  className="mb-3 text-base font-semibold text-slate-900"
                >
                  All Changes This Month
                </h2>

                <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {filterChipConfig.map((chip) => {
                      const isActive = movementFilter === chip.key;
                      const count = counts[chip.key];
                      return (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => setMovementFilter(chip.key)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                            isActive
                              ? "bg-brand-700 text-white shadow-sm"
                              : `bg-white ring-1 ring-slate-200 hover:bg-slate-50 ${chip.inactiveClass ?? "text-slate-700"}`
                          }`}
                        >
                          {chip.icon}
                          {chip.label} ({count})
                        </button>
                      );
                    })}
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

                <MovementTable2 rows={filteredRows} />
              </section>
            </>
          )}

          <section aria-labelledby="related-tools">
            <h2 id="related-tools" className="mb-3 text-sm font-semibold text-slate-800">
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

          <p className="rounded-xl border border-slate-200/60 bg-white/60 px-4 py-3 text-xs leading-relaxed text-slate-500">
            Movement data compares the current and previous visa bulletin publications. This page is
            for informational purposes only and does not constitute legal advice.
          </p>
        </div>
      </div>
    </WorkspacePageShell>
  );
}
