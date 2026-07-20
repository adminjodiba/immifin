import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { BulletinTimelineCardData } from "@/lib/dashboard/employmentJourney";
import { resolveJourneyChartType } from "@/components/dashboard/JourneyStatusMessageCard";

type VisaBulletinJourneyCardProps = {
  timeline: BulletinTimelineCardData;
};

type SegmentColor = "red" | "green" | "gray";

type TimelineSegment = {
  from: number;
  to: number;
  color: SegmentColor;
};

type MarkerKind = "cutoff" | "priority" | "today";

/** Snap long marker labels to card edges so they are not clipped by overflow-hidden. */
const LABEL_EDGE_INSET_PERCENT = 12;

/** Precise placement for track dots and connectors. */
function markerPositionStyle(percent: number): CSSProperties {
  if (percent <= 0) {
    return { left: "0%" };
  }

  if (percent >= 100) {
    return { right: "0%", left: "auto" };
  }

  return { left: `${percent}%`, transform: "translateX(-50%)" };
}

/** Edge-safe placement for labels (avoids clipping near card borders). */
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

function getCardTitle(title: string): string {
  if (title === "Dates for Filing") {
    return "Dates for Filing (Form I-485)";
  }

  if (title === "Final Action Date") {
    return "Final Action Date (Green Card Approval)";
  }

  return title;
}

function getCardSubtitle(title: string, fallback: string): string | null {
  if (title === "Dates for Filing" || title === "Final Action Date") {
    return null;
  }

  return fallback;
}

function buildSegments(timeline: BulletinTimelineCardData): TimelineSegment[] {
  if (timeline.status === "unavailable") {
    return [{ from: 0, to: 100, color: "gray" }];
  }

  const left = Math.min(timeline.cutoffMarkerPercent, timeline.priorityMarkerPercent);
  const right = Math.max(timeline.cutoffMarkerPercent, timeline.priorityMarkerPercent);
  const activeColor: SegmentColor = timeline.isPositive ? "green" : "red";
  const segments: TimelineSegment[] = [];

  if (left > 0) {
    segments.push({ from: 0, to: left, color: "gray" });
  }

  segments.push({ from: left, to: right, color: activeColor });
  segments.push({ from: right, to: 100, color: "gray" });

  return segments;
}

function segmentClass(color: SegmentColor): string {
  if (color === "red") {
    return "bg-red-500";
  }

  if (color === "green") {
    return "bg-emerald-500";
  }

  return "bg-slate-300";
}

function markerDotClass(kind: MarkerKind, timeline: BulletinTimelineCardData): string {
  if (kind === "today") {
    return "bg-brand-600 ring-brand-100";
  }

  if (kind === "priority") {
    return timeline.status === "unavailable"
      ? "bg-slate-400 ring-slate-200"
      : "bg-emerald-600 ring-emerald-100";
  }

  if (timeline.status === "unavailable") {
    return "bg-slate-400 ring-slate-200";
  }

  return timeline.isPositive
    ? "bg-emerald-600 ring-emerald-100"
    : "bg-red-600 ring-red-100";
}

function statusBadgePresentation(timeline: BulletinTimelineCardData) {
  if (timeline.status === "unavailable") {
    return {
      wrapper: "bg-slate-100 text-slate-700",
      dot: "bg-slate-400",
    };
  }

  if (timeline.isPositive) {
    return {
      wrapper: "bg-emerald-100 text-emerald-800",
      dot: "bg-emerald-500",
    };
  }

  return {
    wrapper: "bg-red-100 text-red-800",
    dot: "bg-red-500",
  };
}

function cardBorderClass(timeline: BulletinTimelineCardData): string {
  if (timeline.status === "unavailable") {
    return "border-slate-200";
  }

  return timeline.isPositive ? "border-emerald-200" : "border-red-200";
}

function cutoffLabelTitle(timeline: BulletinTimelineCardData): string {
  if (timeline.title === "Dates for Filing") {
    return "Current Filing Date Cutoff";
  }

  return "Current Final Action Cutoff";
}

function cutoffLabelTitleClass(timeline: BulletinTimelineCardData): string {
  if (timeline.status === "unavailable") {
    return "text-slate-600";
  }

  return timeline.isPositive ? "text-emerald-700" : "text-red-700";
}

function TimelineDot({
  kind,
  timeline,
  style,
}: {
  kind: MarkerKind;
  timeline: BulletinTimelineCardData;
  style?: CSSProperties;
}) {
  const edgeClass =
    kind === "today"
      ? "right-0"
      : style?.left === "0%" || style?.left === 0
        ? "left-0"
        : "-translate-x-1/2";

  return (
    <span
      className={`absolute top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full ring-2 ${edgeClass} ${markerDotClass(kind, timeline)}`}
      style={style}
      aria-hidden="true"
    />
  );
}

function PositionedBlock({
  percent,
  children,
  className = "",
}: {
  percent: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute max-w-[9.5rem] px-0.5 sm:max-w-[10.5rem] ${labelAlignClass(percent)} ${className}`}
      style={labelPositionStyle(percent)}
    >
      {children}
    </div>
  );
}

function MarkerConnector({
  percent,
  span = false,
  extendIntoBar = false,
  placement = "below",
}: {
  percent: number;
  span?: boolean;
  extendIntoBar?: boolean;
  placement?: "above" | "below";
}) {
  const positionClass =
    percent <= 0
      ? "ml-[6px]"
      : percent >= 100
        ? "right-0 mr-[6px]"
        : "-translate-x-1/2";

  const sizeClass = span
    ? extendIntoBar && placement === "below"
      ? "-top-1 h-[calc(100%+0.25rem)]"
      : extendIntoBar && placement === "above"
        ? "top-0 h-[calc(100%+0.25rem)]"
        : "top-0 h-full"
    : "top-0 h-3";

  return (
    <span
      className={`absolute block w-px border-l border-dashed border-slate-400 ${positionClass} ${sizeClass}`}
      style={percent > 0 && percent < 100 ? markerPositionStyle(percent) : undefined}
      aria-hidden="true"
    />
  );
}

function TimelineMarkerLabel({
  title,
  date,
  titleClassName,
}: {
  title: string;
  date: string;
  titleClassName: string;
}) {
  return (
    <p className="text-[0.625rem] leading-tight sm:text-[0.6875rem]">
      <span className={`font-bold uppercase tracking-wide ${titleClassName}`}>{title}</span>
      <span className="mx-1 text-slate-300" aria-hidden="true">
        ·
      </span>
      <span className="font-medium text-slate-700">{date}</span>
    </p>
  );
}

function EbTimelineTrack({ timeline }: { timeline: BulletinTimelineCardData }) {
  const segments = buildSegments(timeline);

  return (
    <div className="w-full">
      <div className="relative h-7">
        <PositionedBlock percent={timeline.priorityMarkerPercent}>
          <TimelineMarkerLabel
            title="Priority Date"
            date={timeline.priorityDateFormatted}
            titleClassName="text-emerald-700"
          />
        </PositionedBlock>

        <PositionedBlock percent={timeline.todayMarkerPercent}>
          <TimelineMarkerLabel
            title="Today"
            date={timeline.todayFormatted}
            titleClassName="text-brand-700"
          />
        </PositionedBlock>
      </div>

      <div className="relative mb-1 h-3">
        <MarkerConnector
          percent={timeline.priorityMarkerPercent}
          span
          extendIntoBar
          placement="above"
        />
        <MarkerConnector
          percent={timeline.todayMarkerPercent}
          span
          extendIntoBar
          placement="above"
        />
      </div>

      <div className="relative">
        <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-200">
          {segments.map((segment, index) => (
            <div
              key={`${segment.from}-${segment.to}-${index}`}
              className={`absolute inset-y-0 ${segmentClass(segment.color)}`}
              style={{ left: `${segment.from}%`, width: `${segment.to - segment.from}%` }}
            />
          ))}
        </div>

        <TimelineDot
          kind="cutoff"
          timeline={timeline}
          style={markerPositionStyle(timeline.cutoffMarkerPercent)}
        />
        <TimelineDot
          kind="priority"
          timeline={timeline}
          style={markerPositionStyle(timeline.priorityMarkerPercent)}
        />
        <TimelineDot kind="today" timeline={timeline} />
      </div>

      <div className="relative mt-1 h-3">
        <MarkerConnector
          percent={timeline.cutoffMarkerPercent}
          span
          extendIntoBar
          placement="below"
        />
      </div>

      <div className="relative h-7 pt-0.5">
        <PositionedBlock percent={timeline.cutoffMarkerPercent}>
          <TimelineMarkerLabel
            title={cutoffLabelTitle(timeline)}
            date={timeline.cutoffFormatted}
            titleClassName={cutoffLabelTitleClass(timeline)}
          />
        </PositionedBlock>
      </div>
    </div>
  );
}

function DaysSincePriorityHeaderStat({ timeline }: { timeline: BulletinTimelineCardData }) {
  const daysColor =
    timeline.status === "unavailable"
      ? "text-slate-700"
      : timeline.isPositive
        ? "text-emerald-700"
        : "text-red-700";

  return (
    <div className="text-center">
      <p className="text-[0.625rem] font-bold uppercase tracking-wide text-slate-500 sm:text-[0.6875rem]">
        Days Since Priority Date
      </p>
      <p className={`mt-0.5 text-base font-bold leading-none sm:text-lg ${daysColor}`}>
        {timeline.daysSincePriorityDate.toLocaleString()} days
      </p>
    </div>
  );
}

function EbTimelineStatusCard({ timeline }: { timeline: BulletinTimelineCardData }) {
  const chartType = resolveJourneyChartType(timeline.title);

  if (timeline.status === "unavailable") {
    return (
      <div className="rounded-lg border border-brand-200 bg-brand-50/70 px-3 py-2.5">
        <div className="flex gap-2.5">
          <span className="text-sm leading-none" aria-hidden="true">
            ℹ️
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Data Unavailable</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {timeline.title === "Final Action Date"
                ? "Final Action Date is unavailable for your category and country right now."
                : "We could not determine this status from the current Visa Bulletin data."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (timeline.isPositive) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-2.5">
            <span className="text-sm leading-none" aria-hidden="true">
              🎉
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Great News!</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {chartType === "filing"
                  ? "The Dates for Filing cutoff has reached your Priority Date. You may be eligible to file Form I-485."
                  : "The Final Action Date has reached your Priority Date. Green Card approval may now be possible."}
              </p>
            </div>
          </div>
          <Link
            href="/immigration/visa-bulletin"
            className="inline-flex shrink-0 text-xs font-semibold text-brand-700 hover:text-brand-800 sm:pt-0.5"
          >
            View Visa Bulletin →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-2.5">
          <span className="text-sm leading-none" aria-hidden="true">
            📈
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Still Waiting</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {chartType === "filing"
                ? "The Dates for Filing cutoff has not reached your Priority Date yet."
                : "The Final Action Date has not reached your Priority Date yet."}
            </p>
          </div>
        </div>
        <Link
          href="/immigration/visa-bulletin"
          className="inline-flex shrink-0 text-xs font-semibold text-brand-700 hover:text-brand-800 sm:pt-0.5"
        >
          View Visa Bulletin →
        </Link>
      </div>
    </div>
  );
}

export function VisaBulletinJourneyCard({ timeline }: VisaBulletinJourneyCardProps) {
  const badge = statusBadgePresentation(timeline);
  const cardSubtitle = getCardSubtitle(timeline.title, timeline.subtitle);

  return (
    <section className={`card-static overflow-hidden border !py-3 sm:!py-4 ${cardBorderClass(timeline)}`}>
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg sm:justify-self-start">
          {getCardTitle(timeline.title)}
        </h2>

        {timeline.title === "Dates for Filing" ? (
          <DaysSincePriorityHeaderStat timeline={timeline} />
        ) : (
          <span className="hidden sm:block" aria-hidden="true" />
        )}

        <span
          className={`inline-flex w-fit items-center gap-1.5 justify-self-start rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold sm:justify-self-end sm:px-3 sm:py-1 sm:text-xs ${badge.wrapper}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2 ${badge.dot}`} aria-hidden="true" />
          {timeline.statusLabel}
        </span>
      </div>

      {cardSubtitle ? (
        <p className="mt-1 max-w-3xl text-xs leading-snug text-slate-600 sm:text-sm">{cardSubtitle}</p>
      ) : null}

      <div className="mt-2">
        <EbTimelineTrack timeline={timeline} />
      </div>

      <div className="mt-2.5">
        <EbTimelineStatusCard timeline={timeline} />
      </div>
    </section>
  );
}
