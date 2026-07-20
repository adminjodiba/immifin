import type { CSSProperties } from "react";
import type { GreenCardJourneyData } from "@/lib/dashboard/journeyDates";

type JourneyProgressCardProps = {
  journey: GreenCardJourneyData;
};

const LABEL_EDGE_INSET_PERCENT = 12;

function labelPositionStyle(percent: number): CSSProperties {
  if (percent <= LABEL_EDGE_INSET_PERCENT) {
    return { left: "0%" };
  }

  if (percent >= 100 - LABEL_EDGE_INSET_PERCENT) {
    return { right: "0%", left: "auto" };
  }

  return { left: `${percent}%`, transform: "translateX(-50%)" };
}

function labelAlignClass(percent: number): string {
  if (percent <= LABEL_EDGE_INSET_PERCENT) {
    return "text-left";
  }

  if (percent >= 100 - LABEL_EDGE_INSET_PERCENT) {
    return "text-right";
  }

  return "-translate-x-1/2 text-center";
}

function markerDotStyle(percent: number): CSSProperties {
  if (percent <= 0) {
    return { left: "0%" };
  }

  if (percent >= 100) {
    return { right: "0%", left: "auto" };
  }

  return { left: `${percent}%`, transform: "translateX(-50%)" };
}

function MarkerLabel({
  title,
  date,
  detail,
  titleClassName,
}: {
  title: string;
  date: string;
  detail?: string;
  titleClassName: string;
}) {
  return (
    <p className="text-[0.625rem] leading-tight sm:text-[0.6875rem]">
      <span className={`font-bold uppercase tracking-wide ${titleClassName}`}>{title}</span>
      <span className="mx-1 text-slate-300" aria-hidden="true">
        ·
      </span>
      <span className="font-medium text-slate-700">{date}</span>
      {detail ? (
        <>
          <br />
          <span className="text-slate-500">{detail}</span>
        </>
      ) : null}
    </p>
  );
}

function TrackDot({
  className,
  style,
  edge,
}: {
  className: string;
  style?: CSSProperties;
  edge?: "start" | "end";
}) {
  const edgeClass =
    edge === "start"
      ? "left-0"
      : edge === "end"
        ? "right-0"
        : style?.left === "0%" || style?.left === 0
          ? "left-0"
          : style?.right === "0%"
            ? "right-0"
            : "-translate-x-1/2";

  return (
    <span
      className={`absolute top-1/2 z-20 h-2.5 w-2.5 -translate-y-1/2 rounded-full ring-[3px] ${edgeClass} ${className}`}
      style={edge ? undefined : style}
      aria-hidden="true"
    />
  );
}

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 px-2.5 py-2">
      <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900 sm:text-base">{value}</p>
      {detail ? <p className="mt-0.5 text-[0.6875rem] leading-snug text-slate-600">{detail}</p> : null}
    </div>
  );
}

export function JourneyProgressCard({ journey }: JourneyProgressCardProps) {
  const { progress, summary, eligibilityStatusLabel } = journey;
  const todayPercent = progress.todayMarkerPercent;
  const todayAtEnd = todayPercent >= 100 - LABEL_EDGE_INSET_PERCENT;

  const totalDaysLabel = `${summary.totalRequiredDays.toLocaleString()} day${
    summary.totalRequiredDays === 1 ? "" : "s"
  }`;
  const daysCompletedLabel = `${summary.daysCompleted.toLocaleString()} day${
    summary.daysCompleted === 1 ? "" : "s"
  } completed`;
  const daysRemainingLabel =
    summary.daysRemaining === 0
      ? "You can file now"
      : `${summary.daysRemaining.toLocaleString()} day${
          summary.daysRemaining === 1 ? "" : "s"
        }`;

  const canFile = summary.daysRemaining === 0;
  const statusBadgeClass = canFile
    ? "bg-emerald-100 text-emerald-800"
    : "bg-brand-100 text-brand-800";
  const statusDotClass = canFile ? "bg-emerald-500" : "bg-brand-500";

  return (
    <section className="card-static overflow-hidden border border-emerald-200 !py-3 sm:!py-4">
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg sm:justify-self-start">
          Your Citizenship Journey
        </h2>

        <div className="text-center">
          <p className="text-[0.625rem] font-bold uppercase tracking-wide text-slate-500 sm:text-[0.6875rem]">
            Journey Progress
          </p>
          <p className="mt-0.5 text-base font-bold leading-none text-emerald-700 sm:text-lg">
            {summary.progressPercent}%
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-1.5 justify-self-start rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold sm:justify-self-end sm:px-3 sm:py-1 sm:text-xs ${statusBadgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${statusDotClass}`} aria-hidden="true" />
          {eligibilityStatusLabel}
        </span>
      </div>

      <p className="mt-1 text-xs leading-snug text-slate-600 sm:text-sm">
        From Green Card to your earliest N-400 filing window.
      </p>

      <div className="mt-2.5 hidden sm:block">
        <div className="relative h-7">
          <div
            className={`absolute top-0 z-40 max-w-[10.5rem] px-0.5 ${labelAlignClass(todayPercent)}`}
            style={labelPositionStyle(todayPercent)}
          >
            <MarkerLabel
              title="Today"
              date={journey.todayFormatted}
              detail={daysCompletedLabel}
              titleClassName="text-brand-700"
            />
          </div>
        </div>

        <div className="relative mb-1 h-3">
          <span
            className={`absolute bottom-0 top-0 z-30 w-px border-l border-dashed border-slate-300 ${
              todayAtEnd ? "right-0" : todayPercent <= LABEL_EDGE_INSET_PERCENT ? "left-0" : "-translate-x-1/2"
            }`}
            style={
              todayAtEnd || todayPercent <= LABEL_EDGE_INSET_PERCENT
                ? undefined
                : markerDotStyle(todayPercent)
            }
            aria-hidden="true"
          />
        </div>

        <div className="relative z-0 h-1.5">
          <div className="relative z-0 h-1.5 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="absolute inset-y-0 left-0 z-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
              style={{ width: `${progress.fillPercent}%` }}
              role="progressbar"
              aria-valuenow={summary.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress toward earliest N-400 filing date"
            />
          </div>

          <TrackDot edge="start" className="z-20 bg-emerald-600 ring-emerald-100" />
          {todayAtEnd ? (
            <TrackDot edge="end" className="z-30 bg-brand-600 ring-brand-100" />
          ) : (
            <TrackDot className="z-30 bg-brand-600 ring-brand-100" style={markerDotStyle(todayPercent)} />
          )}
          {!todayAtEnd ? (
            <TrackDot edge="end" className="z-20 bg-emerald-600 ring-emerald-100" />
          ) : null}
        </div>

        <div className="relative mt-1 h-3">
          <span
            className="absolute bottom-0 left-0 top-0 z-20 w-px border-l border-dashed border-slate-300"
            aria-hidden="true"
          />
          <span
            className="absolute bottom-0 right-0 top-0 z-20 w-px border-l border-dashed border-slate-300"
            aria-hidden="true"
          />
        </div>

        <div className="relative z-40 grid grid-cols-2 gap-3 pt-0.5">
          <div className="min-w-0 text-left">
            <MarkerLabel
              title="Green Card Granted"
              date={journey.greenCardIssueDateFormatted}
              detail="Day 0"
              titleClassName="text-emerald-700"
            />
          </div>
          <div className="min-w-0 text-right">
            <MarkerLabel
              title="Earliest N-400 Filing Date"
              date={journey.earliestFilingDateFormatted}
              detail={totalDaysLabel}
              titleClassName="text-emerald-700"
            />
          </div>
        </div>
      </div>

      <div className="mt-2.5 sm:hidden">
        <div className="relative h-1.5 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{ width: `${progress.fillPercent}%` }}
            role="progressbar"
            aria-valuenow={summary.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progress toward earliest N-400 filing date"
          />
        </div>

        <div className="mt-3 space-y-2.5">
          <MarkerLabel
            title="Green Card Granted"
            date={journey.greenCardIssueDateFormatted}
            detail="Day 0"
            titleClassName="text-emerald-700"
          />
          <div className="rounded-lg border border-brand-100 bg-brand-50/40 px-3 py-2 text-left">
            <MarkerLabel
              title="Today"
              date={journey.todayFormatted}
              detail={daysCompletedLabel}
              titleClassName="text-brand-700"
            />
          </div>
          <MarkerLabel
            title="Earliest N-400 Filing Date"
            date={journey.earliestFilingDateFormatted}
            detail={totalDaysLabel}
            titleClassName="text-emerald-700"
          />
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <SummaryMetric
          label="Days Completed"
          value={summary.daysCompleted.toLocaleString()}
          detail={`(${summary.daysCompletedDuration})`}
        />
        <SummaryMetric
          label="Progress"
          value={`${summary.progressPercent}%`}
          detail="to eligibility"
        />
        <SummaryMetric
          label="Remaining"
          value={daysRemainingLabel}
          detail="until filing date"
        />
      </div>
    </section>
  );
}
