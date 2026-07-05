"use client";

/**
 * Cutoff date trend chart with retrogression highlighting and scrollable timeline.
 */

import { useMemo, useRef, type ReactNode } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
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
import { enrichChartPointsWithAxisLabels } from "@/components/VisaBulletinHistoryAxisFormat";
import { HistoryAxisTick } from "@/components/VisaBulletinHistoryAxisTick";
import {
  isHistoryHorizontallyScrollable,
  HistoryScrollableTimeline,
  useHistoryScrollToRecent,
  useHistoryTimelineLayout,
  type HistoryDateRangeKey,
} from "@/components/VisaBulletinHistoryTimelineScroll";

const BLUE_STROKE = "#2563eb";
const RED_STROKE = "#dc2626";

export type { HistoryDateRangeKey };

type VisaBulletinHistoryChartProps = {
  rows: VisaBulletinHistoryRecord[];
  loading: boolean;
  dateRange: HistoryDateRangeKey;
  embedded?: boolean;
  title?: string;
  chartHeight?: number;
};

type EnrichedChartPoint = HistoryChartPoint & {
  isRetrogressionMonth: boolean;
  axisTickLabel: string;
  [segmentKey: `segment${number}`]: number | null | undefined;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: { payload: EnrichedChartPoint }[];
};

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: EnrichedChartPoint;
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
      <p className="text-sm text-slate-500">{formatDaysFromStart(point.daysFromStart)}</p>
      {point.isRetrogressionMonth ? (
        <p className="mt-1 text-xs font-medium text-red-600">Retrogression</p>
      ) : null}
    </div>
  );
}

function formatDaysFromStart(days: number): string {
  const absolute = Math.abs(days);
  const unit = absolute === 1 ? "day" : "days";

  if (days === 0) {
    return "0 days from start";
  }

  const sign = days > 0 ? "+" : "-";
  return `${sign}${absolute} ${unit} from start`;
}

function formatYAxisTick(days: number): string {
  if (days === 0) {
    return "0";
  }

  const sign = days > 0 ? "+" : "-";
  return `${sign}${Math.abs(days)}`;
}

function TrendDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) {
    return null;
  }

  const fill = payload.isRetrogressionMonth ? RED_STROKE : BLUE_STROKE;

  return <circle cx={cx} cy={cy} r={3} fill={fill} strokeWidth={0} />;
}

function ActiveTrendDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) {
    return null;
  }

  const fill = payload.isRetrogressionMonth ? RED_STROKE : BLUE_STROKE;

  return <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#fff" strokeWidth={2} />;
}

function buildEnrichedChartData(
  rows: VisaBulletinHistoryRecord[],
  dateRange: HistoryDateRangeKey,
): EnrichedChartPoint[] {
  const base = buildHistoryChartData(rows);

  return enrichChartPointsWithAxisLabels(
    base.map((point, index) => {
      const isRetrogressionMonth =
        index > 0 && point.daysFromStart < base[index - 1].daysFromStart;

      const enriched: EnrichedChartPoint = {
        ...point,
        isRetrogressionMonth,
        axisTickLabel: "",
      };

      for (let seg = 1; seg < base.length; seg += 1) {
        enriched[`segment${seg}`] = index === seg - 1 || index === seg ? point.daysFromStart : null;
      }

      return enriched;
    }),
    dateRange,
  );
}

function buildSegmentLines(chartData: HistoryChartPoint[]) {
  return chartData.slice(1).map((point, index) => {
    const previous = chartData[index];
    const segmentIndex = index + 1;
    const isRetrogression = point.daysFromStart < previous.daysFromStart;

    return {
      key: segmentIndex,
      dataKey: `segment${segmentIndex}` as const,
      stroke: isRetrogression ? RED_STROKE : BLUE_STROKE,
    };
  });
}

function ChartSeries({
  segmentLines,
  axisTickLabels,
}: {
  segmentLines: ReturnType<typeof buildSegmentLines>;
  axisTickLabels: string[];
}) {
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
        dataKey="daysFromStart"
        tickFormatter={formatYAxisTick}
        tick={{ fontSize: 11, fill: "#64748b" }}
        tickLine={false}
        axisLine={{ stroke: "#e2e8f0" }}
        width={44}
        label={{
          value: "Days from start",
          angle: -90,
          position: "insideLeft",
          style: { fontSize: 10, fill: "#94a3b8" },
        }}
      />
      <Tooltip content={<ChartTooltip />} />
      {segmentLines.map((segment) => (
        <Line
          key={segment.key}
          type="monotone"
          dataKey={segment.dataKey}
          stroke={segment.stroke}
          strokeWidth={2}
          dot={false}
          activeDot={false}
          connectNulls
          isAnimationActive={false}
        />
      ))}
      <Line
        type="monotone"
        dataKey="daysFromStart"
        stroke="transparent"
        strokeWidth={0}
        dot={<TrendDot />}
        activeDot={<ActiveTrendDot />}
        isAnimationActive={false}
      />
    </>
  );
}

function ChartLegend() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-brand-600" aria-hidden="true" />
        <span className="h-0.5 w-3 rounded bg-brand-600" aria-hidden="true" />
        Advancement / No Change
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-600" aria-hidden="true" />
        <span className="h-0.5 w-3 rounded bg-red-600" aria-hidden="true" />
        Retrogression
      </span>
    </div>
  );
}

function ScrollableChartPlot({
  chartData,
  segmentLines,
  axisTickLabels,
  chartHeight,
  chartWidth,
  scrollRef,
}: {
  chartData: EnrichedChartPoint[];
  segmentLines: ReturnType<typeof buildSegmentLines>;
  axisTickLabels: string[];
  chartHeight: number;
  chartWidth: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <HistoryScrollableTimeline
      scrollRef={scrollRef}
      chartWidth={chartWidth}
      chartHeight={chartHeight}
      ariaLabel="Scrollable chart timeline"
    >
      <ComposedChart
        data={chartData}
        width={chartWidth}
        height={chartHeight}
        margin={{ top: 8, right: 16, left: 8, bottom: 20 }}
      >
        <ChartSeries segmentLines={segmentLines} axisTickLabels={axisTickLabels} />
      </ComposedChart>
    </HistoryScrollableTimeline>
  );
}

function FixedChartPlot({
  chartData,
  segmentLines,
  axisTickLabels,
  chartHeight,
}: {
  chartData: EnrichedChartPoint[];
  segmentLines: ReturnType<typeof buildSegmentLines>;
  axisTickLabels: string[];
  chartHeight: number;
}) {
  return (
    <div className="w-full" style={{ height: chartHeight, minHeight: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 20 }}>
          <ChartSeries segmentLines={segmentLines} axisTickLabels={axisTickLabels} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VisaBulletinHistoryChart({
  rows,
  loading,
  dateRange,
  embedded = false,
  title = "Cutoff Date Over Time",
  chartHeight = 320,
}: VisaBulletinHistoryChartProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartData = useMemo(() => buildEnrichedChartData(rows, dateRange), [rows, dateRange]);
  const segmentLines = useMemo(() => buildSegmentLines(chartData), [chartData]);
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

  let body: ReactNode;

  if (loading) {
    body = <div className={loadingShellClassName}>Loading chart data…</div>;
  } else if (chartData.length === 0) {
    body = (
      <div
        className={
          embedded
            ? "flex flex-1 items-center justify-center p-4 text-center text-sm text-slate-600"
            : "flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/80 p-8 text-center"
        }
      >
        <p className="max-w-md text-sm leading-relaxed text-slate-600">
          No chartable cutoff dates for the selected filters. Rows marked Current (C) or
          Unavailable (U) are excluded from the trend chart.
        </p>
      </div>
    );
  } else {
    body = (
      <>
        {!embedded || title ? (
          <>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {!embedded ? (
              <p className="mb-4 mt-1 text-sm text-slate-600">
                Movement relative to the earliest cutoff date in the selected history period.
              </p>
            ) : title ? (
              <p className="mb-2 mt-0.5 text-xs text-slate-500">Relative to earliest cutoff in period</p>
            ) : null}
          </>
        ) : null}
        <div ref={viewportRef} className="w-full flex-1">
          {isScrollable ? (
            isLayoutReady ? (
              <ScrollableChartPlot
                chartData={chartData}
                segmentLines={segmentLines}
                axisTickLabels={axisTickLabels}
                chartHeight={chartHeight}
                chartWidth={chartWidth}
                scrollRef={scrollRef}
              />
            ) : (
              <div style={{ height: chartHeight, minHeight: chartHeight }} aria-hidden="true" />
            )
          ) : (
            <FixedChartPlot
              chartData={chartData}
              segmentLines={segmentLines}
              axisTickLabels={axisTickLabels}
              chartHeight={chartHeight}
            />
          )}
        </div>
        <ChartLegend />
      </>
    );
  }

  return <div className={shellClassName}>{body}</div>;
}
