import { DashboardAccessGate } from "@/components/dashboard/DashboardAccessGate";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import { formatWelcomeBack } from "@/components/dashboard/MyImmifinWorkspaceHeader";
import { PersonalDashboard } from "@/components/dashboard/PersonalDashboard";
import { Ds2WorkspacePageShell } from "@/components/ds2/Ds2WorkspacePageShell";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { getPersonalDashboardData } from "@/lib/dashboard/getPersonalDashboardData";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Immigration Dashboard",
  description: "Your personalized immigration dashboard",
  path: "/dashboard",
});

function DashboardWorkspaceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M4 19V5M9 19V9M14 19V3M20 19v-7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function DashboardPage() {
  const dashboardData = await getPersonalDashboardData();

  return (
    <ContactOnboardingGuard>
      <Ds2WorkspacePageShell
        eyebrow="MY IMMIFIN"
        title={formatWelcomeBack(dashboardData.welcomeName)}
        description="Your personalized immigration dashboard"
        icon={<DashboardWorkspaceIcon />}
        titleAccessory={<FavoriteStar pageLabel="Immigration Dashboard" pageHref="/dashboard" />}
        actions={<DashboardCloseAction />}
      >
        <DashboardAccessGate>
          <PersonalDashboard {...dashboardData} />
        </DashboardAccessGate>
      </Ds2WorkspacePageShell>
    </ContactOnboardingGuard>
  );
}
