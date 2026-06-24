"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatBulletinDate,
  parseBulletinCutoffDate,
} from "@/lib/visaBulletinData";
import {
  computeVisaBulletinHistoryAnalytics,
  formatMovementDays,
} from "@/lib/visaBulletinHistoryAnalytics";
import type {
  BulletinHistoryType,
  VisaBulletinHistoryRecord,
} from "@/lib/visaBulletinHistory";
import { VisaBulletinHistoryChart } from "@/components/VisaBulletinHistoryChart";
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

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function HistoryTable({ rows }: { rows: VisaBulletinHistoryRecord[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        No historical records found for the selected filters.
      </div>
    );
  }

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
                Month
              </th>
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
                Type
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-900 sm:px-6"
              >
                Cutoff Date
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.month}-${row.category}-${row.country}-${row.type}`}
                className="border-t border-slate-100 hover:bg-slate-50/80"
              >
                <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-900 sm:px-6">
                  {formatMonthLabel(row.month)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-800 sm:px-6">
                  {row.category}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-800 sm:px-6">
                  {row.country}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-800 sm:px-6">
                  {row.type === "FinalAction" ? "Final Action" : "Dates for Filing"}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-800 sm:px-6">
                  {formatCutoffDate(row.cutoffDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCards({
  rows,
  loading,
}: {
  rows: VisaBulletinHistoryRecord[];
  loading: boolean;
}) {
  const analytics = useMemo(() => computeVisaBulletinHistoryAnalytics(rows), [rows]);

  const totalMovementClassName =
    analytics.totalMovementDays === null
      ? "text-slate-500"
      : analytics.totalMovementDays > 0
        ? "text-emerald-700"
        : analytics.totalMovementDays < 0
          ? "text-red-700"
          : "text-slate-700";

  const cards = [
    {
      title: "Current Cutoff",
      value: loading ? "Loading…" : analytics.currentCutoff ?? "—",
      valueClassName: "text-slate-900",
    },
    {
      title: "Earliest Cutoff",
      value: loading ? "Loading…" : analytics.earliestCutoff ?? "—",
      valueClassName: "text-slate-900",
    },
    {
      title: "Total Movement",
      value: loading ? "Loading…" : formatMovementDays(analytics.totalMovementDays),
      valueClassName: totalMovementClassName,
    },
    {
      title: "Largest Advancement",
      value: loading ? "Loading…" : formatMovementDays(analytics.largestAdvancementDays),
      valueClassName:
        analytics.largestAdvancementDays === null
          ? "text-slate-500"
          : "text-emerald-700",
    },
    {
      title: "Largest Retrogression",
      value: loading ? "Loading…" : formatMovementDays(analytics.largestRetrogressionDays),
      valueClassName:
        analytics.largestRetrogressionDays === null ? "text-slate-500" : "text-red-700",
    },
  ];

  return (
    <section aria-labelledby="history-summary">
      <h2 id="history-summary" className="heading-3 mb-4">
        Summary
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 sm:gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {card.title}
            </p>
            <p className={`mt-2 text-lg font-bold leading-snug ${card.valueClassName}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VisaBulletinHistoricalTrends() {
  const [category, setCategory] = useState("EB2");
  const [country, setCountry] = useState("India");
  const [type, setType] = useState<BulletinHistoryType>("FinalAction");
  const [rows, setRows] = useState<VisaBulletinHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      category,
      country,
      type,
    });

    try {
      const response = await fetch(`/api/visa-bulletin-history?${params.toString()}`);

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Failed to load visa bulletin history.");
      }

      const data = (await response.json()) as VisaBulletinHistoryRecord[];
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load visa bulletin history.");
    } finally {
      setLoading(false);
    }
  }, [category, country, type]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

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
              <li className="font-medium text-brand-700">Visa Bulletin Historical Trends</li>
            </ol>
          </nav>
          <h1 className="heading-1 text-brand-900">Visa Bulletin Historical Trends</h1>
          <p className="mt-4 max-w-3xl text-lead">
            Explore archived visa bulletin cutoff dates by category, country, and date type over time.
          </p>
        </div>
      </section>

      <section className="section-padding !pt-10 sm:!pt-14">
        <div className="container-main space-y-8">
          <section aria-labelledby="history-filters">
            <h2 id="history-filters" className="heading-3 mb-4">
              Filters
            </h2>
            <div className="card-static grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="history-category" className="block text-sm font-semibold text-slate-900">
                  Category
                </label>
                <select
                  id="history-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="history-country" className="block text-sm font-semibold text-slate-900">
                  Country
                </label>
                <select
                  id="history-country"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  {countryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="history-type" className="block text-sm font-semibold text-slate-900">
                  Type
                </label>
                <select
                  id="history-type"
                  value={type}
                  onChange={(event) => setType(event.target.value as BulletinHistoryType)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <SummaryCards rows={rows} loading={loading} />

          <section aria-labelledby="history-chart">
            <h2 id="history-chart" className="heading-3 mb-4">
              Trend Chart
            </h2>
            <VisaBulletinHistoryChart rows={rows} loading={loading} />
          </section>

          <section aria-labelledby="history-table">
            <h2 id="history-table" className="heading-3 mb-4">
              Historical Table
            </h2>

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                Loading historical records…
              </div>
            ) : error ? (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
                role="alert"
              >
                {error}
              </div>
            ) : (
              <HistoryTable rows={rows} />
            )}
          </section>

          <p className="text-sm leading-relaxed text-slate-500">
            Historical data is sourced from archived visa bulletin records. This page is for
            informational purposes only and does not constitute legal advice.
          </p>
        </div>
      </section>
    </>
  );
}
