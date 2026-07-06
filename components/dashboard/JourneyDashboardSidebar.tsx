import { DashboardTodaysFocusCard } from "@/components/dashboard/DashboardTodaysFocusCard";
import { HowItWorksCard } from "@/components/dashboard/HowItWorksCard";
import { YourJourneySidebarCard } from "@/components/dashboard/YourJourneySidebarCard";
import {
  resolveEmploymentTodaysFocus,
  resolveGreenCardTodaysFocus,
} from "@/lib/dashboard/dashboardFocusAndActions";
import type { EmploymentJourneyData } from "@/lib/dashboard/employmentJourney";
import type { GreenCardJourneyData } from "@/lib/dashboard/journeyDates";
import type { ImmigrationProfile } from "@/lib/supabase/types";

type EmploymentSidebarProps = {
  variant: "employment";
  immigrationProfile: ImmigrationProfile;
  journey: EmploymentJourneyData;
};

type GreenCardSidebarProps = {
  variant: "green_card";
  journey: GreenCardJourneyData;
};

type JourneyDashboardSidebarProps = EmploymentSidebarProps | GreenCardSidebarProps;

export function JourneyDashboardSidebar(props: JourneyDashboardSidebarProps) {
  if (props.variant === "employment") {
    const focus = resolveEmploymentTodaysFocus(props.journey);

    return (
      <>
        <YourJourneySidebarCard
          variant="employment"
          immigrationProfile={props.immigrationProfile}
          journey={props.journey}
        />
        <DashboardTodaysFocusCard focus={focus} />
        <HowItWorksCard variant="employment" />
      </>
    );
  }

  const focus = resolveGreenCardTodaysFocus(props.journey);

  return (
    <>
      <YourJourneySidebarCard variant="green_card" journey={props.journey} />
      <DashboardTodaysFocusCard focus={focus} />
      <HowItWorksCard variant="green_card" />
    </>
  );
}
