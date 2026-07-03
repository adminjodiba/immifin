import { CitizenshipLockedAiCard } from "@/components/dashboard/greenCard/CitizenshipLockedAiCard";
import { CitizenshipQuickStatusCard } from "@/components/dashboard/greenCard/CitizenshipQuickStatusCard";
import { GreenCardCongratulationsBanner } from "@/components/dashboard/greenCard/GreenCardCongratulationsBanner";
import { JourneyProgressCard } from "@/components/dashboard/greenCard/JourneyProgressCard";
import { JourneyDashboardLayout } from "@/components/dashboard/JourneyDashboardLayout";
import { JourneyDashboardSidebar } from "@/components/dashboard/JourneyDashboardSidebar";
import type { GreenCardJourneyData } from "@/lib/dashboard/journeyDates";

type GreenCardHolderDashboardProps = {
  journey: GreenCardJourneyData;
};

function ImmigrationJourneySectionTitle() {
  return (
    <header>
      <h2 className="heading-3 text-slate-900">Immigration Journey</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
        Track your progress from Green Card to naturalization eligibility.
      </p>
    </header>
  );
}

export function GreenCardHolderDashboard({ journey }: GreenCardHolderDashboardProps) {
  return (
    <JourneyDashboardLayout
      header={<ImmigrationJourneySectionTitle />}
      main={
        <>
          <GreenCardCongratulationsBanner />
          <JourneyProgressCard journey={journey} />
          <CitizenshipQuickStatusCard journey={journey} />
          <CitizenshipLockedAiCard />
        </>
      }
      sidebar={<JourneyDashboardSidebar variant="green_card" journey={journey} />}
    />
  );
}
