"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildHistoryMovementChartData,
  formatMovementChartLabel,
  type HistoryMovementChartPoint,
} from "@/lib/visaBulletinHistoryAnalytics";
import type { VisaBulletinHistoryRecord } from "@/lib/visaBulletinHistory";

type VisaBulletinHistoryMovementChartProps = {
  rows: VisaBulletinHistoryRecord[];
  loading: boolean;
};

const BAR_COLORS = {
  positive: "#16a34a",
  neutral: "#94a3b8",
  negative: "#dc2626",
} as const;

function getBarColor(movementDays: number): string {
  if (movementDays > 0) {
    return BAR_COLORS.positive;
  }

  if (movementDays < 0) {
    return BAR_COLORS.negative;
  }

  return BAR_COLORS.neutral;
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: { payload: HistoryMovementChartPoint }[];
};

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{point.monthLabel}</p>
      <p className="text-sm text-slate-600">Current: {point.currentCutoffLabel}</p>
      <p className="text-sm text-slate-600">Previous: {point.previousCutoffLabel}</p>
      <p className="text-sm font-medium text-slate-800">
        {formatMovementChartLabel(point.movementDays)}
      </p>
    </div>
  );
}

function formatYAxisTick(days: number): string {
  if (days === 0) {
    return "0";
  }

  const sign = days > 0 ? "+" : "-";
  return `${sign}${Math.abs(days)}`;
}

export function VisaBulletinHistoryMovementChart({
  rows,
  loading,
}: VisaBulletinHistoryMovementChartProps) {
  const chartData = useMemo(() => buildHistoryMovementChartData(rows), [rows]);

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
          Not enough chartable months to show month-over-month movement. At least two months with
          valid cutoff dates are required, excluding Current (C) and Unavailable (U).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <p className="mb-4 text-sm text-slate-600">
        Change in cutoff date compared with the previous month.
      </p>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 12, fill: "#475569" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              dataKey="movementDays"
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12, fill: "#475569" }}
              tickLine={false}
              axisLine={{ stroke: "#cbd5e1" }}
              width={48}
              label={{
                value: "Movement days",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fill: "#64748b" },
              }}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="movementDays" minPointSize={3} radius={[4, 4, 4, 4]}>
              {chartData.map((point) => (
                <Cell key={point.month} fill={getBarColor(point.movementDays)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
