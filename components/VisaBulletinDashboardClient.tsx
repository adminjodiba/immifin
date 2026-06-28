"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { jsonFetcher, visaBulletinSwrOptions } from "@/lib/swr";
import {
  formatBulletinDate,
  parseBulletinCutoffDate,
  type VisaBulletinDataType,
  type VisaBulletinRow,
} from "@/lib/visaBulletinData";

type TabKey = VisaBulletinDataType;

type BulletinStatus = {
  label: string;
  badgeClass: string;
};

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

function normalizeCategoryKey(category: string): CategoryKey {
  const match = category.match(/eb\s*(\d)/i);
  if (!match) {
    return "OTHER";
  }

  const key = `EB${match[1]}` as CategoryKey;
  return key in categoryStyles ? key : "OTHER";
}

function groupRowsByCategory(rows: VisaBulletinRow[]): [CategoryKey, VisaBulletinRow[]][] {
  const grouped = new Map<CategoryKey, VisaBulletinRow[]>();

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

function getStatus(finalActionDate: string): BulletinStatus {
  const normalized = finalActionDate.trim().toUpperCase();

  if (normalized === "C") {
    return {
      label: "🟢 Current",
      badgeClass: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    };
  }

  if (normalized === "U") {
    return {
      label: "🔴 Unavailable",
      badgeClass: "bg-red-50 text-red-800 ring-red-200",
    };
  }

  return {
    label: "🟡 Waiting Queue",
    badgeClass: "bg-amber-50 text-amber-900 ring-amber-200",
  };
}

function formatFinalActionDate(value: string): string {
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

  return value;
}

function getCurrentMonthLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
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

function BulletinTable({ rows, activeTab }: { rows: VisaBulletinRow[]; activeTab: TabKey }) {
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
                {activeTab === "final-action" ? "Final Action Date" : "Date for Filing"}
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
              >
                Status
              </th>
            </tr>
          </thead>
          {groupRowsByCategory(rows).map(([categoryKey, groupRows]) => {
            const styles = categoryStyles[categoryKey];

            return (
              <tbody key={categoryKey} className={`border-t-2 ${styles.divider}`}>
                <tr className={styles.groupRow}>
                  <th colSpan={4} scope="colgroup" className="px-4 py-3 text-left sm:px-6">
                    <CategoryBadge categoryKey={categoryKey} />
                  </th>
                </tr>
                {groupRows.map((row) => {
                  const status = getStatus(row.finalActionDate);

                  return (
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
                        {formatFinalActionDate(row.finalActionDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status.badgeClass}`}
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
      </div>
    </div>
  );
}

export function VisaBulletinDashboardClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("final-action");

  const key = `/api/visa-bulletin?type=${activeTab}`;
  const { data, error: swrError, isLoading } = useSWR<VisaBulletinRow[]>(
    key,
    (url) => jsonFetcher(url, "Failed to load visa bulletin data."),
    visaBulletinSwrOptions,
  );

  const rows = data ?? [];
  const error =
    swrError instanceof Error
      ? swrError.message
      : swrError
        ? "Failed to load visa bulletin data."
        : null;

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
              <li className="font-medium text-brand-700">Visa Bulletin Dashboard</li>
            </ol>
          </nav>
          <h1 className="heading-1 text-brand-900">Visa Bulletin Dashboard</h1>
          <p className="mt-4 max-w-3xl text-lead">
            Live employment-based visa bulletin data updated from the U.S. Department of State.
          </p>
        </div>
      </section>

      <section className="section-padding !pt-10 sm:!pt-14">
        <div className="container-main space-y-8">
          <div className="card-static grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Data source
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {activeTab === "final-action"
                  ? "U.S. Department of State Visa Bulletin (Final Action Dates)"
                  : "U.S. Department of State Visa Bulletin (Dates for Filing)"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Last updated
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">{getCurrentMonthLabel()}</p>
            </div>
          </div>

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

          {isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              {activeTab === "final-action"
                ? "Loading Final Action Dates..."
                : "Loading Dates for Filing..."}
            </div>
          ) : error ? (
            <div
              className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : (
            <BulletinTable rows={rows} activeTab={activeTab} />
          )}

          <section aria-labelledby="related-tools">
            <h2 id="related-tools" className="heading-3 mb-4">
              Related Tools
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/immigration/visa-bulletin-movement" className="btn-primary">
                Visa Bulletin Movement Tracker
              </Link>
              <Link href="/immigration/visa-bulletin-history" className="btn-secondary">
                Visa Bulletin History
              </Link>
              <Link href="/calculators/green-card-wait-time" className="btn-secondary">
                Green Card Wait Time Calculator
              </Link>
              <Link href="/calculators/citizenship-eligibility" className="btn-secondary">
                Citizenship Eligibility Calculator
              </Link>
            </div>
          </section>

          <p className="text-sm leading-relaxed text-slate-500">
            This dashboard is for informational purposes only and does not constitute legal advice.
            Final action dates can change each month when a new visa bulletin is published.
          </p>
        </div>
      </section>
    </>
  );
}
