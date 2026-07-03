import type { LivePriorityDateStatus } from "@/lib/visaBulletinData";

type JourneyChartType = "filing" | "final-action";

type JourneyStatusMessageCardProps = {
  status: LivePriorityDateStatus;
  isPositive: boolean;
  chartType: JourneyChartType;
};

type StatusPresentation = {
  containerClass: string;
  icon: string;
  heading: string;
  message: string;
};

export function resolveJourneyChartType(title: string): JourneyChartType {
  return title === "Dates for Filing" ? "filing" : "final-action";
}

function getStatusPresentation(
  status: LivePriorityDateStatus,
  isPositive: boolean,
  chartType: JourneyChartType,
): StatusPresentation {
  if (status === "unavailable") {
    return {
      containerClass:
        "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
      icon: "ℹ️",
      heading: "Status Unavailable",
      message:
        "We could not determine this status from the current Visa Bulletin data. Please check your profile details or try again later.",
    };
  }

  if (isPositive) {
    return {
      containerClass:
        "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
      icon: "🎉",
      heading: "Great News!",
      message:
        chartType === "filing"
          ? "The Dates for Filing Visa Bulletin has reached your Priority Date. You may now be eligible to file Form I-485, subject to current USCIS filing guidance."
          : "The Final Action Date has reached your Priority Date. Your Green Card approval may now be possible once all required processing is complete.",
    };
  }

  return {
    containerClass: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    icon: "📈",
    heading: "You're Making Progress",
    message:
      chartType === "filing"
        ? "The Dates for Filing cutoff has not reached your Priority Date yet. IMMIFIN will continue helping you track monthly movement."
        : "The Final Action Date has not reached your Priority Date yet. IMMIFIN will continue helping you monitor when your category becomes current.",
  };
}

export function JourneyStatusMessageCard({
  status,
  isPositive,
  chartType,
}: JourneyStatusMessageCardProps) {
  const presentation = getStatusPresentation(status, isPositive, chartType);

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${presentation.containerClass}`}>
      <div className="flex gap-3">
        <span className="text-lg leading-none" aria-hidden="true">
          {presentation.icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{presentation.heading}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{presentation.message}</p>
        </div>
      </div>
    </div>
  );
}
