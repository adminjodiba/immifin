import { PageHeader } from "@/components/PageHeader";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { UserProfileCloseAction } from "@/components/profile/UserProfileCloseAction";
import { UserProfileHub } from "@/components/profile/UserProfileHub";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Manage Profile",
  description: "Manage your Immifin account, security settings, and profile details.",
  path: "/user-profile",
});

export default function ManageProfilePage() {
  return (
    <ContactOnboardingGuard>
      <>
        <PageHeader
          breadcrumb="Profile"
          title="Manage Profile"
          description="Update your Clerk account details, security settings, and IMMIFIN immigration planning fields."
        />

        <section className="section-padding !pt-10 sm:!pt-16">
          <div className="container-main">
            <div className="mx-auto max-w-5xl min-w-0">
              <div className="mb-4 flex justify-end">
                <UserProfileCloseAction />
              </div>
              <UserProfileHub />
            </div>
          </div>
        </section>
      </>
    </ContactOnboardingGuard>
  );
}
