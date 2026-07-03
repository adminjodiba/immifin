import type { GreenCardJourneyData } from "@/lib/dashboard/journeyDates";

const statusStyles = {
  not_eligible_yet: {
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
  filing_window_open: {
    badge: "bg-brand-100 text-brand-800",
    dot: "bg-brand-500",
  },
  eligible_now: {
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
} as const;

type CitizenshipQuickStatusCardProps = {
  journey: GreenCardJourneyData;
};

function StatusField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

export function CitizenshipQuickStatusCard({ journey }: CitizenshipQuickStatusCardProps) {
  const styles = statusStyles[journey.eligibilityStatus];
  const daysLabel =
    journey.daysUntilEligible === 0
      ? "You can file now"
      : `${journey.daysUntilEligible} day${journey.daysUntilEligible === 1 ? "" : "s"}`;

  return (
    <section className="card-static">
      <h2 className="heading-3 text-slate-900">Citizenship Status</h2>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
          {journey.eligibilityStatusLabel}
        </span>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatusField label="Green Card Since" value={journey.greenCardIssueDateFormatted} />
        <StatusField
          label="Years as Permanent Resident"
          value={journey.yearsAsPermanentResident}
        />
        <StatusField
          label="Earliest N-400 Filing Date"
          value={journey.earliestFilingDateFormatted}
        />
        <StatusField label="Days Until Eligible" value={daysLabel} />
        <StatusField label="Eligibility Status" value={journey.eligibilityStatusLabel} />
        <StatusField
          label="Naturalization Period"
          value={`${journey.waitingPeriodYears}-year path`}
        />
      </dl>
    </section>
  );
}
