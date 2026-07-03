import type { CSSProperties } from "react";
import type { GreenCardJourneyData } from "@/lib/dashboard/journeyDates";

type JourneyProgressCardProps = {
  journey: GreenCardJourneyData;
};

function EndpointMarker({ className }: { className: string }) {
  return (
    <span
      className={`absolute top-1/2 z-10 h-3 w-3 -translate-y-1/2 rounded-full ring-4 ${className}`}
      aria-hidden="true"
    />
  );
}

function TodayMarker() {
  return (
    <span
      className="h-3 w-3 rounded-full bg-brand-600 ring-4 ring-brand-100"
      aria-hidden="true"
    />
  );
}

function VerticalConnector({ className }: { className?: string }) {
  return (
    <span
      className={`mx-auto block w-px border-l border-dashed border-slate-300 ${className ?? "h-5"}`}
      aria-hidden="true"
    />
  );
}

type EndpointLabelProps = {
  title: string;
  date: string;
  detail: string;
  align: "left" | "right";
};

function EndpointLabel({ title, date, detail, align }: EndpointLabelProps) {
  const alignmentClass = align === "left" ? "text-left" : "text-right";
  const connectorClass = align === "left" ? "mr-auto ml-[5px]" : "ml-auto mr-[5px]";

  return (
    <div className={alignmentClass}>
      <span
        className={`mb-2 block h-4 w-px border-l border-dashed border-slate-300 ${connectorClass}`}
        aria-hidden="true"
      />
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{title}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-700">{date}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function TodayLabelBlock({
  journey,
  showMarker = true,
}: {
  journey: GreenCardJourneyData;
  showMarker?: boolean;
}) {
  const daysLabel = `${journey.summary.daysCompleted.toLocaleString()} day${
    journey.summary.daysCompleted === 1 ? "" : "s"
  } completed`;

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Today</p>
      <p className="mt-0.5 text-xs font-medium text-slate-700">{journey.todayFormatted}</p>
      <p className="mt-1 text-xs text-slate-500">{daysLabel}</p>
      {showMarker ? (
        <>
          <VerticalConnector className="mt-2 h-5" />
          <div className="flex justify-center">
            <TodayMarker />
          </div>
        </>
      ) : null}
    </div>
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
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{detail}</p> : null}
    </div>
  );
}

export function JourneyProgressCard({ journey }: JourneyProgressCardProps) {
  const { progress, summary, waitingPeriodDescription } = journey;
  const todayMarkerStyle: CSSProperties = { left: `${progress.todayMarkerPercent}%` };

  const totalDaysLabel = `${summary.totalRequiredDays.toLocaleString()} day${
    summary.totalRequiredDays === 1 ? "" : "s"
  }`;
  const daysRemainingLabel =
    summary.daysRemaining === 0
      ? "You can file now"
      : `${summary.daysRemaining.toLocaleString()} day${
          summary.daysRemaining === 1 ? "" : "s"
        }`;

  return (
    <section className="card-static overflow-hidden">
      <h2 className="heading-3 text-slate-900">Your Citizenship Journey</h2>
      <p className="mt-2 text-sm text-slate-600">
        Track your path from Green Card to your earliest N-400 filing window.
      </p>

      <div className="mt-8 hidden sm:block">
        <div className="relative pb-2 pt-20">
          <div
            className="absolute top-0 max-w-[11rem] -translate-x-1/2 px-2"
            style={todayMarkerStyle}
          >
            <TodayLabelBlock journey={journey} />
          </div>

          <div className="relative">
            <div className="relative h-3 overflow-hidden rounded-full bg-emerald-100">
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

            <EndpointMarker className="left-0 bg-emerald-600 ring-emerald-100" />
            <EndpointMarker className="right-0 bg-emerald-600 ring-emerald-100" />
          </div>

          <div className="relative mt-1 min-h-[5.5rem]">
            <div className="absolute left-0 top-0 max-w-[44%] pr-3">
              <EndpointLabel
                align="left"
                title="Green Card Granted"
                date={journey.greenCardIssueDateFormatted}
                detail="Day 0"
              />
            </div>

            <div className="absolute right-0 top-0 max-w-[44%] pl-3">
              <EndpointLabel
                align="right"
                title="Earliest N-400 Filing Date"
                date={journey.earliestFilingDateFormatted}
                detail={`${totalDaysLabel}\n(${waitingPeriodDescription})`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:hidden">
        <div className="relative h-3 overflow-hidden rounded-full bg-emerald-100">
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

        <div className="mt-6 space-y-5">
          <EndpointLabel
            align="left"
            title="Green Card Granted"
            date={journey.greenCardIssueDateFormatted}
            detail="Day 0"
          />
          <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4 text-left">
            <TodayLabelBlock journey={journey} showMarker={false} />
          </div>
          <EndpointLabel
            align="left"
            title="Earliest N-400 Filing Date"
            date={journey.earliestFilingDateFormatted}
            detail={`${totalDaysLabel} (${waitingPeriodDescription})`}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryMetric
          label="Days Completed"
          value={summary.daysCompleted.toLocaleString()}
          detail={`(${summary.daysCompletedDuration})`}
        />
        <SummaryMetric
          label="Journey Progress"
          value={`${summary.progressPercent}%`}
          detail="of the way to eligibility"
        />
        <SummaryMetric
          label="Days Remaining"
          value={daysRemainingLabel}
          detail="until earliest filing date"
        />
      </div>
    </section>
  );
}
