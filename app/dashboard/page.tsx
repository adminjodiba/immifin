import { DashboardAccessGate } from "@/components/dashboard/DashboardAccessGate";
import { MyImmifinWorkspaceHeader } from "@/components/dashboard/MyImmifinWorkspaceHeader";
import { PersonalDashboard } from "@/components/dashboard/PersonalDashboard";
import { workspaceContainerClass, WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { getPersonalDashboardData } from "@/lib/dashboard/getPersonalDashboardData";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "My Immifin",
  description: "Your personalized Dashboard",
  path: "/dashboard",
});

export default async function DashboardPage() {
  const dashboardData = await getPersonalDashboardData();

  return (
    <ContactOnboardingGuard>
      <WorkspacePageShell wide>
        <div className={`${workspaceContainerClass(true)} space-y-3 py-4 sm:py-5`}>
          <MyImmifinWorkspaceHeader welcomeName={dashboardData.welcomeName} />
          <DashboardAccessGate>
            <PersonalDashboard {...dashboardData} />
          </DashboardAccessGate>
        </div>
      </WorkspacePageShell>
    </ContactOnboardingGuard>
  );
}
