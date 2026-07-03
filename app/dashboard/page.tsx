import { DashboardAccessGate } from "@/components/dashboard/DashboardAccessGate";
import { MyImmifinWorkspaceHeader } from "@/components/dashboard/MyImmifinWorkspaceHeader";
import { PersonalDashboard } from "@/components/dashboard/PersonalDashboard";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { getPersonalDashboardData } from "@/lib/dashboard/getPersonalDashboardData";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "My Immifin",
  description: "Your personalized IMMIFIN workspace — immigration journey, profile, and next steps.",
  path: "/dashboard",
});

export default async function DashboardPage() {
  const dashboardData = await getPersonalDashboardData();

  return (
    <ContactOnboardingGuard>
      <section className="section-padding !pt-10 sm:!pt-16">
        <div className="container-dashboard">
          <MyImmifinWorkspaceHeader welcomeName={dashboardData.welcomeName} />
          <DashboardAccessGate>
            <PersonalDashboard {...dashboardData} />
          </DashboardAccessGate>
        </div>
      </section>
    </ContactOnboardingGuard>
  );
}
