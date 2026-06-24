"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildHistoryChartData,
  type HistoryChartPoint,
} from "@/lib/visaBulletinHistoryAnalytics";
import type { VisaBulletinHistoryRecord } from "@/lib/visaBulletinHistory";

type VisaBulletinHistoryChartProps = {
  rows: VisaBulletinHistoryRecord[];
  loading: boolean;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: { payload: HistoryChartPoint }[];
};

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{point.monthLabel}</p>
      <p className="text-sm text-slate-600">{point.cutoffLabel}</p>
    </div>
  );
}

function formatYAxisTick(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "2-digit",
    month: "short",
  });
}

export function VisaBulletinHistoryChart({ rows, loading }: VisaBulletinHistoryChartProps) {
  const chartData = useMemo(() => buildHistoryChartData(rows), [rows]);

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
        Loading chart data…
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/80 p-8 text-center">
        <p className="max-w-md text-sm leading-relaxed text-slate-600">
          No chartable cutoff dates for the selected filters. Rows marked Current (C) or
          Unavailable (U) are excluded from the trend chart.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 12, fill: "#475569" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              dataKey="cutoffTimestamp"
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12, fill: "#475569" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              width={72}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="cutoffTimestamp"
              stroke="#1d4ed8"
              strokeWidth={2}
              dot={{ r: 4, fill: "#1d4ed8", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
