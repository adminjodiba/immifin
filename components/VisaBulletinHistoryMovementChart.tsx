"use client";

/**
 * Monthly movement bar chart with shared timeline scroll and quarter axis labels.
 */

import { useMemo, useRef } from "react";
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
import { enrichChartPointsWithAxisLabels } from "@/components/VisaBulletinHistoryAxisFormat";
import { HistoryAxisTick } from "@/components/VisaBulletinHistoryAxisTick";
import {
  isHistoryHorizontallyScrollable,
  HistoryScrollableTimeline,
  useHistoryScrollToRecent,
  useHistoryTimelineLayout,
  type HistoryDateRangeKey,
} from "@/components/VisaBulletinHistoryTimelineScroll";

const BAR_COLORS = {
  positive: "#16a34a",
  neutral: "#94a3b8",
  negative: "#dc2626",
} as const;

type MovementChartPoint = HistoryMovementChartPoint & { axisTickLabel: string };

type VisaBulletinHistoryMovementChartProps = {
  rows: VisaBulletinHistoryRecord[];
  loading: boolean;
  dateRange: HistoryDateRangeKey;
  embedded?: boolean;
  title?: string;
  chartHeight?: number;
};

function getBarColor(movementDays: number): string {
  if (movementDays > 0) return BAR_COLORS.positive;
  if (movementDays < 0) return BAR_COLORS.negative;
  return BAR_COLORS.neutral;
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: { payload: MovementChartPoint }[];
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
  if (days === 0) return "0";
  const sign = days > 0 ? "+" : "-";
  return `${sign}${Math.abs(days)}`;
}

function MovementChartSeries({ axisTickLabels }: { axisTickLabels: string[] }) {
  return (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
      <XAxis
        dataKey="monthLabel"
        tick={(props) => <HistoryAxisTick {...props} axisTickLabels={axisTickLabels} />}
        tickLine={false}
        axisLine={{ stroke: "#e2e8f0" }}
        interval={0}
        height={36}
      />
      <YAxis
        dataKey="movementDays"
        tickFormatter={formatYAxisTick}
        tick={{ fontSize: 11, fill: "#64748b" }}
        tickLine={false}
        axisLine={{ stroke: "#e2e8f0" }}
        width={44}
        label={{
          value: "Movement days",
          angle: -90,
          position: "insideLeft",
          style: { fontSize: 10, fill: "#94a3b8" },
        }}
      />
      <ReferenceLine y={0} stroke="#e2e8f0" />
      <Tooltip content={<ChartTooltip />} />
    </>
  );
}

function MovementBars({ chartData }: { chartData: MovementChartPoint[] }) {
  return (
    <Bar dataKey="movementDays" minPointSize={3} radius={[4, 4, 4, 4]}>
      {chartData.map((point) => (
        <Cell key={point.month} fill={getBarColor(point.movementDays)} />
      ))}
    </Bar>
  );
}

export function VisaBulletinHistoryMovementChart({
  rows,
  loading,
  dateRange,
  embedded = false,
  title = "Monthly Movement",
  chartHeight = 320,
}: VisaBulletinHistoryMovementChartProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartData = useMemo(
    () => enrichChartPointsWithAxisLabels(buildHistoryMovementChartData(rows), dateRange),
    [rows, dateRange],
  );
  const axisTickLabels = useMemo(() => chartData.map((point) => point.axisTickLabel), [chartData]);
  const isScrollable = isHistoryHorizontallyScrollable(dateRange, chartData.length);
  const timelineKey = `${dateRange}-${chartData.length}`;
  const { chartWidth, isLayoutReady } = useHistoryTimelineLayout(
    viewportRef,
    chartData.length,
    isScrollable,
    timelineKey,
  );

  useHistoryScrollToRecent(scrollRef, isScrollable && isLayoutReady, timelineKey);

  const shellClassName = embedded
    ? "flex h-full flex-col"
    : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6";

  const loadingShellClassName = embedded
    ? "flex flex-1 items-center justify-center text-sm text-slate-600"
    : "flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600";

  if (loading) {
    return <div className={loadingShellClassName}>Loading chart data…</div>;
  }

  if (chartData.length === 0) {
    return (
      <div
        className={
          embedded
            ? "flex flex-1 items-center justify-center p-3 text-center text-xs text-slate-600"
            : "flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/80 p-8 text-center"
        }
      >
        <p className="max-w-md text-sm leading-relaxed text-slate-600">
          Not enough chartable months to show month-over-month movement. At least two months with
          valid cutoff dates are required, excluding Current (C) and Unavailable (U).
        </p>
      </div>
    );
  }

  return (
    <div className={shellClassName}>
      {!embedded || title ? (
        <>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {!embedded ? (
            <p className="mb-4 mt-1 text-sm text-slate-600">
              Change in cutoff date compared with the previous month.
            </p>
          ) : title ? (
            <p className="mb-2 mt-0.5 text-xs text-slate-500">Month-over-month change</p>
          ) : null}
        </>
      ) : null}
      <div ref={viewportRef} className="w-full flex-1">
        {isScrollable ? (
          isLayoutReady ? (
            <HistoryScrollableTimeline
              scrollRef={scrollRef}
              chartWidth={chartWidth}
              chartHeight={chartHeight}
              ariaLabel="Scrollable monthly movement chart timeline"
            >
              <BarChart
                data={chartData}
                width={chartWidth}
                height={chartHeight}
                margin={{ top: 8, right: 16, left: 8, bottom: 20 }}
              >
                <MovementChartSeries axisTickLabels={axisTickLabels} />
                <MovementBars chartData={chartData} />
              </BarChart>
            </HistoryScrollableTimeline>
          ) : (
            <div style={{ height: chartHeight, minHeight: chartHeight }} aria-hidden="true" />
          )
        ) : (
          <div className="w-full" style={{ height: chartHeight, minHeight: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 20 }}>
                <MovementChartSeries axisTickLabels={axisTickLabels} />
                <MovementBars chartData={chartData} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
