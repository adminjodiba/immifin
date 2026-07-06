import Link from "next/link";
import { DashboardActionCenterCard } from "@/components/dashboard/DashboardActionCenterCard";
import { DashboardProfileSetupBanner } from "@/components/dashboard/DashboardProfileSetupBanner";
import { JourneyDashboardLayout } from "@/components/dashboard/JourneyDashboardLayout";
import { JourneyDashboardSidebar } from "@/components/dashboard/JourneyDashboardSidebar";
import { VisaBulletinJourneyCard } from "@/components/dashboard/VisaBulletinJourneyCard";
import { resolveEmploymentTodaysFocus } from "@/lib/dashboard/dashboardFocusAndActions";
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
          <section className="rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-base font-semibold text-slate-900">Complete your immigration profile</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Add your priority date, category, and country of chargeability to unlock your
              personalized immigration journey dashboard. Your saved details are kept if your plan
              changes.
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
          <VisaBulletinJourneyCard timeline={employmentJourney.datesForFiling} />
          <VisaBulletinJourneyCard timeline={employmentJourney.finalAction} />
          <DashboardActionCenterCard
            journeyStage="employment"
            focusId={resolveEmploymentTodaysFocus(employmentJourney).id}
          />
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
