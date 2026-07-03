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

type TimelineMarker = {
  kind: MarkerKind;
  percent: number;
};

const LABEL_COLLISION_THRESHOLD = 12;

function markerPositionStyle(percent: number): CSSProperties {
  if (percent <= 0) {
    return { left: "0%" };
  }

  if (percent >= 100) {
    return { right: "0%", left: "auto" };
  }

  return { left: `${percent}%`, transform: "translateX(-50%)" };
}

function markerAlignClass(percent: number): string {
  if (percent <= 0) {
    return "text-left";
  }

  if (percent >= 100) {
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

function getCardSubtitle(title: string, fallback: string): string {
  if (title === "Dates for Filing") {
    return "We compare the Visa Bulletin Dates for Filing with your Priority Date.";
  }

  if (title === "Final Action Date") {
    return "We compare the Visa Bulletin Final Action Date with your Priority Date.";
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

function resolveLabelRow(timeline: BulletinTimelineCardData): {
  cutoffOffset: "upper" | "lower";
  priorityOffset: "upper" | "lower";
} {
  const isCollision =
    Math.abs(timeline.cutoffMarkerPercent - timeline.priorityMarkerPercent) <
    LABEL_COLLISION_THRESHOLD;

  if (!isCollision) {
    return { cutoffOffset: "upper", priorityOffset: "upper" };
  }

  if (timeline.cutoffMarkerPercent <= timeline.priorityMarkerPercent) {
    return { cutoffOffset: "upper", priorityOffset: "lower" };
  }

  return { cutoffOffset: "lower", priorityOffset: "upper" };
}

function InfoIcon() {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700"
      aria-hidden="true"
    >
      i
    </span>
  );
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
      className={`absolute top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-full ring-4 ${edgeClass} ${markerDotClass(kind, timeline)}`}
      style={style}
      aria-hidden="true"
    />
  );
}

function PositionedBlock({
  percent,
  rowOffset,
  children,
  className = "",
}: {
  percent: number;
  rowOffset?: "upper" | "lower";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute max-w-[9.5rem] px-0.5 sm:max-w-[10.5rem] ${rowOffset === "lower" ? "top-[2.75rem]" : "top-0"} ${markerAlignClass(percent)} ${className}`}
      style={markerPositionStyle(percent)}
    >
      {children}
    </div>
  );
}

function EbTimelineTrack({ timeline }: { timeline: BulletinTimelineCardData }) {
  const segments = buildSegments(timeline);
  const markers: TimelineMarker[] = [
    { kind: "cutoff", percent: timeline.cutoffMarkerPercent },
    { kind: "priority", percent: timeline.priorityMarkerPercent },
    { kind: "today", percent: timeline.todayMarkerPercent },
  ];
  const { cutoffOffset, priorityOffset } = resolveLabelRow(timeline);
  const hasLowerRow = cutoffOffset === "lower" || priorityOffset === "lower";

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className={`relative ${hasLowerRow ? "min-h-[4rem]" : "min-h-[3rem]"}`}>
        <PositionedBlock percent={timeline.cutoffMarkerPercent} rowOffset={cutoffOffset}>
          <p
            className={`text-[0.65rem] font-bold uppercase leading-snug tracking-wide sm:text-xs ${cutoffLabelTitleClass(timeline)}`}
          >
            {cutoffLabelTitle(timeline)}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-700">{timeline.cutoffFormatted}</p>
        </PositionedBlock>

        <PositionedBlock percent={timeline.priorityMarkerPercent} rowOffset={priorityOffset}>
          <p className="text-[0.65rem] font-bold uppercase leading-snug tracking-wide text-emerald-700 sm:text-xs">
            Your Priority Date
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-700">
            {timeline.priorityDateFormatted}
          </p>
        </PositionedBlock>

        <PositionedBlock percent={timeline.todayMarkerPercent}>
          <p className="text-[0.65rem] font-bold uppercase leading-snug tracking-wide text-brand-700 sm:text-xs">
            Today
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-700">{timeline.todayFormatted}</p>
        </PositionedBlock>
      </div>

      <div className="relative mt-1 h-2.5">
        {markers.map((marker) => (
          <span
            key={`${marker.kind}-connector`}
            className={`absolute top-0 block h-3 w-px border-l border-dashed border-slate-300 ${
              marker.percent <= 0
                ? "ml-[6px]"
                : marker.percent >= 100
                  ? "right-0 mr-[6px]"
                  : "-translate-x-1/2"
            }`}
            style={
              marker.percent > 0 && marker.percent < 100
                ? markerPositionStyle(marker.percent)
                : undefined
            }
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="relative py-0.5">
        <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
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
    </div>
  );
}

function DaysSincePriorityCard({ timeline }: { timeline: BulletinTimelineCardData }) {
  const daysColor =
    timeline.status === "unavailable"
      ? "text-slate-700"
      : timeline.isPositive
        ? "text-emerald-700"
        : "text-red-700";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Days Since Priority Date
      </p>
      <p className={`mt-1.5 text-2xl font-bold sm:text-3xl ${daysColor}`}>
        {timeline.daysSincePriorityDate.toLocaleString()} days
      </p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        From your priority date ({timeline.priorityDateFormatted}) to today
      </p>
    </div>
  );
}

function EbTimelineStatusCard({ timeline }: { timeline: BulletinTimelineCardData }) {
  const chartType = resolveJourneyChartType(timeline.title);

  if (timeline.status === "unavailable") {
    return (
      <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-3.5 sm:p-4">
        <div className="flex gap-3">
          <span className="text-lg leading-none" aria-hidden="true">
            ℹ️
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Data Unavailable</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {timeline.title === "Final Action Date"
                ? "The Final Action Date is currently unavailable for your category and country. IMMIFIN will update this chart when bulletin data becomes available."
                : "We could not determine this status from the current Visa Bulletin data. Please check your profile details or try again later."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (timeline.isPositive) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-3.5 sm:p-4">
        <div className="flex gap-3">
          <span className="text-lg leading-none" aria-hidden="true">
            🎉
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Great News!</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {chartType === "filing"
                ? "The Dates for Filing cutoff has reached your Priority Date. You may now be eligible to file Form I-485, subject to current USCIS filing guidance."
                : "The Final Action Date has reached your Priority Date. Your Green Card approval may now be possible once all required processing is complete."}
            </p>
            <Link
              href="/immigration/visa-bulletin"
              className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              View Visa Bulletin Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3.5 sm:p-4">
      <div className="flex gap-3">
        <span className="text-lg leading-none" aria-hidden="true">
          📈
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Still Waiting</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {chartType === "filing"
              ? "The Dates for Filing cutoff has not reached your Priority Date yet. IMMIFIN will continue helping you track monthly movement."
              : "The Final Action Date has not reached your Priority Date yet. IMMIFIN will continue helping you monitor when your category becomes current."}
          </p>
          <Link
            href="/immigration/visa-bulletin"
            className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            View Visa Bulletin Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function VisaBulletinJourneyCard({ timeline }: VisaBulletinJourneyCardProps) {
  const badge = statusBadgePresentation(timeline);

  return (
    <section className={`card-static overflow-hidden border !py-4 sm:!py-5 ${cardBorderClass(timeline)}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <h2 className="heading-3 text-slate-900">{getCardTitle(timeline.title)}</h2>
          <InfoIcon />
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.wrapper}`}
        >
          <span className={`h-2 w-2 rounded-full ${badge.dot}`} aria-hidden="true" />
          {timeline.statusLabel}
        </span>
      </div>

      <p className="mt-1 max-w-3xl text-sm leading-snug text-slate-600">
        {getCardSubtitle(timeline.title, timeline.subtitle)}
      </p>

      <div className="mt-3">
        <EbTimelineTrack timeline={timeline} />
      </div>

      {timeline.status === "unavailable" ? (
        <div className="mt-3.5">
          <EbTimelineStatusCard timeline={timeline} />
        </div>
      ) : (
        <div className="mt-3.5 grid gap-3 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <DaysSincePriorityCard timeline={timeline} />
          <EbTimelineStatusCard timeline={timeline} />
        </div>
      )}
    </section>
  );
}
