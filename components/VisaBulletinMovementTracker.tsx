"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RelatedImmigrationResources } from "@/components/RelatedImmigrationResources";
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

type CategoryKey = "EB1" | "EB2" | "EB3" | "OTHER";

const tabs: { key: TabKey; label: string }[] = [
  { key: "final-action", label: "Final Action Dates" },
  { key: "filing", label: "Dates for Filing" },
];

const categoryStyles: Record<
  CategoryKey,
  {
    groupRow: string;
    dataRow: string;
    dataRowHover: string;
    divider: string;
    badge: string;
    label: string;
  }
> = {
  EB1: {
    groupRow: "bg-blue-50",
    dataRow: "bg-blue-50/40",
    dataRowHover: "hover:bg-blue-100/50",
    divider: "border-blue-100",
    badge: "bg-blue-100 text-blue-900 ring-blue-200",
    label: "EB-1",
  },
  EB2: {
    groupRow: "bg-emerald-50",
    dataRow: "bg-emerald-50/40",
    dataRowHover: "hover:bg-emerald-100/50",
    divider: "border-emerald-100",
    badge: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    label: "EB-2",
  },
  EB3: {
    groupRow: "bg-amber-50",
    dataRow: "bg-amber-50/40",
    dataRowHover: "hover:bg-amber-100/50",
    divider: "border-amber-100",
    badge: "bg-amber-100 text-amber-900 ring-amber-200",
    label: "EB-3",
  },
  OTHER: {
    groupRow: "bg-slate-50",
    dataRow: "bg-slate-50/40",
    dataRowHover: "hover:bg-slate-100/50",
    divider: "border-slate-200",
    badge: "bg-slate-100 text-slate-800 ring-slate-200",
    label: "Other",
  },
};

const movementIcons: Record<MovementType, string> = {
  forward: "🟢",
  retrogression: "🔴",
  "no-change": "⚪",
  current: "🔵",
  unavailable: "⚫",
  invalid: "⚫",
};

const movementBadgeClasses: Record<VisaBulletinMovementRow["movementLabelStyle"], string> = {
  green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  red: "bg-red-50 text-red-800 ring-red-200",
  neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  current: "bg-blue-50 text-blue-800 ring-blue-200",
  unavailable: "bg-slate-100 text-slate-800 ring-slate-300",
  invalid: "bg-slate-100 text-slate-600 ring-slate-200",
};

const tabExplanations: Record<TabKey, string> = {
  "final-action":
    "Final Action Dates: The date when a green card can be approved.",
  filing:
    "Dates for Filing: The date when adjustment of status paperwork may be submitted.",
};

function normalizeCategoryKey(category: string): CategoryKey {
  const match = category.match(/eb\s*(\d)/i);
  if (!match) {
    return "OTHER";
  }

  const key = `EB${match[1]}` as CategoryKey;
  return key in categoryStyles ? key : "OTHER";
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

  const order: CategoryKey[] = ["EB1", "EB2", "EB3", "OTHER"];
  return order
    .filter((key) => grouped.has(key))
    .map((key) => [key, grouped.get(key)!]);
}

function formatCutoffDate(value: string): string {
  const parsed = parseBulletinCutoffDate(value);

  if (parsed === "C") {
    return "Current (C)";
  }

  if (parsed === "U") {
    return "Unavailable (U)";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) {
    return formatBulletinDate(parsed);
  }

  return value || "—";
}

function CategoryBadge({ categoryKey }: { categoryKey: CategoryKey }) {
  const styles = categoryStyles[categoryKey];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles.badge}`}
    >
      {styles.label}
    </span>
  );
}

function SummaryCards({ rows }: { rows: VisaBulletinMovementRow[] }) {
  const counts = useMemo(
    () => ({
      advanced: rows.filter((row) => row.movementType === "forward").length,
      retrogressed: rows.filter((row) => row.movementType === "retrogression").length,
      noChange: rows.filter((row) => row.movementType === "no-change").length,
      current: rows.filter((row) => row.movementType === "current").length,
    }),
    [rows],
  );

  const cards = [
    {
      label: "Advanced",
      value: counts.advanced,
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    },
    {
      label: "Retrogressed",
      value: counts.retrogressed,
      className: "border-red-200 bg-red-50 text-red-900",
    },
    {
      label: "No Change",
      value: counts.noChange,
      className: "border-slate-200 bg-slate-50 text-slate-900",
    },
    {
      label: "Current",
      value: counts.current,
      className: "border-blue-200 bg-blue-50 text-blue-900",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-4 shadow-sm ${card.className}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function MovementBadge({ row }: { row: VisaBulletinMovementRow }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${movementBadgeClasses[row.movementLabelStyle]}`}
    >
      <span aria-hidden="true">{movementIcons[row.movementType]}</span>
      <span>{row.movementLabel}</span>
    </span>
  );
}

function MovementTable({ rows }: { rows: VisaBulletinMovementRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/80">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
              >
                Category
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
              >
                Country
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
              >
                Previous Date
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
              >
                Current Date
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
              >
                Movement
              </th>
            </tr>
          </thead>
          {groupRowsByCategory(rows).map(([categoryKey, groupRows]) => {
            const styles = categoryStyles[categoryKey];

            return (
              <tbody key={categoryKey} className={`border-t-2 ${styles.divider}`}>
                <tr className={styles.groupRow}>
                  <th colSpan={5} scope="colgroup" className="px-4 py-3 text-left sm:px-6">
                    <CategoryBadge categoryKey={categoryKey} />
                  </th>
                </tr>
                {groupRows.map((row) => (
                  <tr
                    key={`${row.category}-${row.country}`}
                    className={`border-t ${styles.divider} ${styles.dataRow} ${styles.dataRowHover}`}
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500 sm:px-6">
                      <span className="sr-only">{row.category}</span>
                      <span aria-hidden="true">—</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900 sm:px-6">
                      {row.country}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-800 sm:px-6">
                      {formatCutoffDate(row.previousDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-800 sm:px-6">
                      {formatCutoffDate(row.currentDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <MovementBadge row={row} />
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

export function VisaBulletinMovementTracker() {
  const [activeTab, setActiveTab] = useState<TabKey>("final-action");
  const [rows, setRows] = useState<VisaBulletinMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMovement = useCallback(async (type: TabKey) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/visa-bulletin-movement?type=${type}`);

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to load visa bulletin movement data.");
      }

      const data = (await response.json()) as VisaBulletinMovementRow[];
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load visa bulletin movement data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMovement(activeTab);
  }, [activeTab, loadMovement]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-50/80 via-white to-white" />
        <div className="container-main relative py-10 sm:py-14 lg:py-16">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <li>
                <Link href="/" className="transition-colors hover:text-brand-700">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-300">
                /
              </li>
              <li>
                <Link href="/immigration" className="transition-colors hover:text-brand-700">
                  Immigration
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-300">
                /
              </li>
              <li className="font-medium text-brand-700">Visa Bulletin Movement Tracker</li>
            </ol>
          </nav>
          <h1 className="heading-1 text-brand-900">Visa Bulletin Movement Tracker</h1>
          <p className="mt-4 max-w-3xl text-lead">
            Track month-over-month movement in employment-based visa bulletin dates.
          </p>
        </div>
      </section>

      <section className="section-padding !pt-10 sm:!pt-14">
        <div className="container-main space-y-8">
          <div
            className="flex flex-col gap-2 sm:flex-row sm:gap-3"
            role="tablist"
            aria-label="Visa bulletin date type"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-brand-700 text-white shadow-sm"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              Loading movement data…
            </div>
          ) : error ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : (
            <>
              <SummaryCards rows={rows} />

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700 sm:p-5">
                {tabExplanations[activeTab]}
              </div>

              <MovementTable rows={rows} />
            </>
          )}

          <RelatedImmigrationResources
            resources={[
              {
                title: "Visa Bulletin Dashboard",
                description:
                  "View the latest employment-based visa bulletin dates and priority date cutoffs.",
                buttonLabel: "Open Dashboard",
                href: "/immigration/visa-bulletin",
              },
              {
                title: "Visa Bulletin Historical Trends",
                description:
                  "Explore archived cutoff dates, trend charts, and month-over-month movement analysis.",
                buttonLabel: "View Trends",
                href: "/immigration/visa-bulletin-history",
              },
              {
                title: "Green Card Wait Time Calculator",
                description:
                  "Estimate how long you may wait based on your priority date and category.",
                buttonLabel: "Open Calculator",
                href: "/calculators/green-card-wait-time",
              },
              {
                title: "Citizenship Eligibility Calculator",
                description:
                  "Check whether you may be eligible to apply for U.S. citizenship based on your timeline.",
                buttonLabel: "Open Calculator",
                href: "/calculators/citizenship-eligibility",
              },
            ]}
          />

          <p className="text-sm leading-relaxed text-slate-500">
            Movement data compares the current and previous visa bulletin publications. This page is
            for informational purposes only and does not constitute legal advice.
          </p>
        </div>
      </section>
    </>
  );
}
