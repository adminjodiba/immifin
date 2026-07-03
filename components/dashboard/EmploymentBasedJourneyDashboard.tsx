import Link from "next/link";
import { DashboardProfileSetupBanner } from "@/components/dashboard/DashboardProfileSetupBanner";
import { DashboardSummaryCard } from "@/components/dashboard/DashboardSummaryCard";
import { JourneyDashboardLayout } from "@/components/dashboard/JourneyDashboardLayout";
import { JourneyDashboardSidebar } from "@/components/dashboard/JourneyDashboardSidebar";
import { JourneyExplanationCard } from "@/components/dashboard/JourneyExplanationCard";
import { VisaBulletinJourneyCard } from "@/components/dashboard/VisaBulletinJourneyCard";
import type { EmploymentJourneyData } from "@/lib/dashboard/employmentJourney";
import type { ImmigrationProfile } from "@/lib/supabase/types";

type EmploymentBasedJourneyDashboardProps = {
  immigrationProfile: ImmigrationProfile | null;
  needsInternalProfileSetup: boolean;
  hasCompleteImmigrationProfile: boolean;
  employmentJourney: EmploymentJourneyData | null;
};

function ImmigrationJourneySectionTitle() {
  return (
    <header>
      <h2 className="heading-3 text-slate-900">Immigration Journey</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
        Track your path from Priority Date to Green Card using the latest Visa Bulletin.
      </p>
    </header>
  );
}

export function EmploymentBasedJourneyDashboard({
  immigrationProfile,
  needsInternalProfileSetup,
  hasCompleteImmigrationProfile,
  employmentJourney,
}: EmploymentBasedJourneyDashboardProps) {
  if (
    needsInternalProfileSetup ||
    !hasCompleteImmigrationProfile ||
    !employmentJourney ||
    !immigrationProfile
  ) {
    return (
      <div className="space-y-6">
        <ImmigrationJourneySectionTitle />

        <DashboardProfileSetupBanner needsInternalProfileSetup={needsInternalProfileSetup} />

        {!needsInternalProfileSetup && !hasCompleteImmigrationProfile ? (
          <section className="card-static">
            <h3 className="heading-3 text-slate-900">Complete your immigration profile</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Add your priority date, category, and country of chargeability to unlock your
              personalized immigration journey dashboard.
            </p>
            <Link href="/user-profile#/immigration" className="btn-primary mt-5 w-fit">
              Create / Update Profile
            </Link>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <JourneyDashboardLayout
      header={<ImmigrationJourneySectionTitle />}
      main={
        <>
          <JourneyExplanationCard />
          <VisaBulletinJourneyCard timeline={employmentJourney.datesForFiling} />
          <VisaBulletinJourneyCard timeline={employmentJourney.finalAction} />

          <div className="grid gap-4 md:grid-cols-3">
            <DashboardSummaryCard
              title="Priority Date"
              value={employmentJourney.priorityDateFormatted}
              detail={employmentJourney.priorityDateAgoLabel}
            />
            <DashboardSummaryCard
              title="Total Wait So Far"
              value={`${employmentJourney.daysSincePriorityDate.toLocaleString()} days`}
              detail={employmentJourney.daysSincePriorityDuration}
            />
            <DashboardSummaryCard
              title="Current Status"
              value={`Filing: ${employmentJourney.datesForFiling.statusLabel}`}
              detail={`Final Action: ${employmentJourney.finalAction.statusLabel}. Estimated approval depends on future Visa Bulletin movement and USCIS processing.`}
            />
          </div>
        </>
      }
      sidebar={
        <JourneyDashboardSidebar
          variant="employment"
          immigrationProfile={immigrationProfile}
          journey={employmentJourney}
        />
      }
    />
  );
}
