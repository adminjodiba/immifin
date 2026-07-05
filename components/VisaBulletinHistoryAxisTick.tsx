"use client";

type AxisTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
  index?: number;
  axisTickLabels: string[];
};

/** Renders compact or quarter axis labels without overlapping empty ticks. */
export function HistoryAxisTick({ x = 0, y = 0, index = 0, axisTickLabels }: AxisTickProps) {
  const label = axisTickLabels[index] ?? "";
  if (!label) return null;

  const xPos = typeof x === "number" ? x : Number(x);
  const yPos = typeof y === "number" ? y : Number(y);

  return (
    <text x={xPos} y={yPos + 12} textAnchor="middle" fontSize={11} fill="#64748b">
      {label}
    </text>
  );
}
