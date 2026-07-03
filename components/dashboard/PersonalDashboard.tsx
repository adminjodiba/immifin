import { EmploymentBasedJourneyDashboard } from "@/components/dashboard/EmploymentBasedJourneyDashboard";
import { GreenCardHolderDashboard } from "@/components/dashboard/GreenCardHolderDashboard";
import type { PersonalDashboardData } from "@/lib/dashboard/getPersonalDashboardData";

type PersonalDashboardProps = PersonalDashboardData;

export function PersonalDashboard({
  journeyStage,
  greenCardJourney,
  immigrationProfile,
  needsInternalProfileSetup,
  hasCompleteImmigrationProfile,
  employmentJourney,
}: PersonalDashboardProps) {
  if (journeyStage === "green_card_holder" && greenCardJourney) {
    return <GreenCardHolderDashboard journey={greenCardJourney} />;
  }

  return (
    <EmploymentBasedJourneyDashboard
      immigrationProfile={immigrationProfile}
      needsInternalProfileSetup={needsInternalProfileSetup}
      hasCompleteImmigrationProfile={hasCompleteImmigrationProfile}
      employmentJourney={employmentJourney}
    />
  );
}
