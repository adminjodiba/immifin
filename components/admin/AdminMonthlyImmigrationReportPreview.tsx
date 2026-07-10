import {
  buildMonthlyImmigrationReportSubject,
  renderMonthlyImmigrationReportEmail,
} from "@/emails/templates/monthly-immigration-report-email";
import type { EmploymentJourneyData } from "@/lib/dashboard/employmentJourney";
import {
  mapMonthlyImmigrationReportEmailProps,
  type MonthlyImmigrationReportDashboardSource,
} from "@/lib/notifications/mappers/map-monthly-immigration-report-email";

/**
 * Safe sample dashboard-shaped data for development preview only.
 * Mirrors EmploymentJourneyData + movement snapshots — does not call sheets
 * or recalculate eligibility/movement.
 */
const SAMPLE_EMPLOYMENT_JOURNEY: EmploymentJourneyData = {
  priorityDate: "2015-01-15",
  priorityDateFormatted: "January 15, 2015",
  categoryLabel: "EB-2",
  countryLabel: "India",
  preferredBulletinTypeLabel: "Final Action Date",
  bulletinMonthLabel: "July 2026",
  todayFormatted: "July 10, 2026",
  daysSincePriorityDate: 4194,
  daysSincePriorityDuration: "11 years, 5 months, 25 days",
  priorityDateAgoLabel: "11 years, 5 months, 25 days",
  datesForFiling: {
    title: "Dates for Filing",
    subtitle:
      "This compares your Priority Date, the Visa Bulletin cutoff, and today on a real calendar timeline.",
    cutoffMarkerTitle: "Current Filing Date Cutoff",
    timelineStartFormatted: "January 15, 2015",
    priorityDateFormatted: "January 15, 2015",
    todayFormatted: "July 10, 2026",
    daysSincePriorityDate: 4194,
    daysSincePriorityLabel: "4,194 days since priority date",
    cutoffFormatted: "January 1, 2013",
    status: "waiting",
    statusLabel: "Waiting",
    isPositive: false,
    priorityMarkerPercent: 20,
    cutoffMarkerPercent: 10,
    todayMarkerPercent: 100,
    priorityLabelPercent: 20,
    cutoffLabelPercent: 10,
    fillPercent: 100,
    statusExplanation:
      "Your Priority Date is still behind the Dates for Filing cutoff.",
    meaningMessage:
      "The Dates for Filing cutoff has not reached your Priority Date yet.",
    error: null,
  },
  finalAction: {
    title: "Final Action Date",
    subtitle:
      "This compares your Priority Date, the Visa Bulletin cutoff, and today on a real calendar timeline.",
    cutoffMarkerTitle: "Current Final Action Cutoff",
    timelineStartFormatted: "January 15, 2015",
    priorityDateFormatted: "January 15, 2015",
    todayFormatted: "July 10, 2026",
    daysSincePriorityDate: 4194,
    daysSincePriorityLabel: "4,194 days since priority date",
    cutoffFormatted: "December 1, 2012",
    status: "waiting",
    statusLabel: "Waiting",
    isPositive: false,
    priorityMarkerPercent: 20,
    cutoffMarkerPercent: 8,
    todayMarkerPercent: 100,
    priorityLabelPercent: 20,
    cutoffLabelPercent: 8,
    fillPercent: 100,
    statusExplanation:
      "Your Priority Date is still behind the Final Action Date for your category and country.",
    meaningMessage:
      "The Final Action Date has not reached your Priority Date yet.",
    error: null,
  },
};

const SAMPLE_DASHBOARD_SOURCE: MonthlyImmigrationReportDashboardSource = {
  journeyType: "employment_gc_waiting",
  firstName: "Samar",
  dashboardUrl: "http://localhost:3000/dashboard",
  journey: SAMPLE_EMPLOYMENT_JOURNEY,
  comparisonMonthLabel: "June 2026",
  finalActionMovement: {
    movementType: "forward",
    movementDays: 30,
    movementLabel: "+1 Month",
  },
  datesForFilingMovement: {
    movementType: "no-change",
    movementDays: 0,
    movementLabel: "No Change",
  },
};

/**
 * Development-only visual preview of the Monthly Immigration Update template.
 * Uses dashboard-shaped sample data → mapper → template. Does not send email.
 */
export async function AdminMonthlyImmigrationReportPreview() {
  const reportProps = mapMonthlyImmigrationReportEmailProps(
    SAMPLE_DASHBOARD_SOURCE
  );
  const rendered = await renderMonthlyImmigrationReportEmail({
    ...reportProps,
    contentMaxWidth: "100%",
  });
  const subject = buildMonthlyImmigrationReportSubject(
    reportProps.updateMonthLabel
  );

  return (
    <section className="card-static w-full space-y-5">
      <div>
        <h2 className="heading-2">Monthly Immigration Update Preview</h2>
        <p className="mt-2 text-sm text-slate-600">
          Development-only. Sample dashboard data mapped through{" "}
          <code className="text-xs">mapMonthlyImmigrationReportEmailProps</code>{" "}
          — no email is sent.
        </p>
      </div>

      <div className="w-full space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Subject
        </h3>
        <p className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
          {subject}
        </p>
      </div>

      <div className="w-full space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          HTML preview
        </h3>
        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <iframe
            title="Monthly Immigration Update HTML preview"
            srcDoc={rendered.html}
            className="h-[900px] w-full bg-white"
            sandbox=""
          />
        </div>
      </div>

      <div className="w-full space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Plain-text fallback
        </h3>
        <pre className="max-h-[400px] w-full overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-800">
          {rendered.text}
        </pre>
      </div>
    </section>
  );
}
