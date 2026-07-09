"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDisplayDate, type VisaStampingHistoryPoint } from "@/lib/visa/visaStampingWaitTimes";

type ChartPoint = {
  updateDate: string;
  label: string;
  waitDays: number;
  isCurrent?: boolean;
  rising?: boolean;
};

type VisaStampingHistoryTrendChartProps = {
  points: VisaStampingHistoryPoint[];
};

function shortMonthLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  const month = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${month} '${year}`;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]!.payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
      <p className="text-xs font-semibold text-slate-900">{formatDisplayDate(point.updateDate)}</p>
      <p className="text-xs text-slate-600">{point.waitDays} days</p>
      {point.isCurrent ? <p className="text-[10px] font-medium text-brand-700">Current</p> : null}
    </div>
  );
}

function CurrentDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
}) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) {
    return null;
  }

  if (!payload.isCurrent) {
    return <circle cx={cx} cy={cy} r={4} fill="#2563eb" stroke="#fff" strokeWidth={1.5} />;
  }

  const fill = payload.rising ? "#ea580c" : "#2563eb";
  return <circle cx={cx} cy={cy} r={5.5} fill={fill} stroke="#fff" strokeWidth={2} />;
}

export function VisaStampingHistoryTrendChart({ points }: VisaStampingHistoryTrendChartProps) {
  const chartData: ChartPoint[] = points.map((point, index) => {
    const previous = points[index - 1];
    return {
      updateDate: point.updateDate,
      label: shortMonthLabel(point.updateDate),
      waitDays: point.waitDays,
      isCurrent: point.isCurrent,
      rising: Boolean(point.isCurrent && previous && point.waitDays > previous.waitDays),
    };
  });

  const waits = chartData.map((point) => point.waitDays);
  const minWait = waits.length ? Math.min(...waits) : 0;
  const maxWait = waits.length ? Math.max(...waits) : 0;
  const pad = Math.max(15, Math.round((maxWait - minWait) * 0.2) || 15);
  const yDomain: [number, number] = [Math.max(0, minWait - pad), maxWait + pad];
  const sparse = chartData.length <= 3;

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 18, right: sparse ? 28 : 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            interval={0}
            padding={sparse ? { left: 28, right: 28 } : { left: 8, right: 8 }}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 10, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#cbd5e1" }}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="waitDays"
            stroke="#2563eb"
            strokeWidth={2.25}
            connectNulls
            dot={<CurrentDot />}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="waitDays"
              position="top"
              offset={8}
              style={{ fill: "#475569", fontSize: 10, fontWeight: 600 }}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
