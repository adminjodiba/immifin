import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { WorkspacePageShell, workspaceContainerClass } from "@/components/layout/WorkspacePageShell";
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
      <WorkspacePageShell>
        <div className={`${workspaceContainerClass()} py-4 sm:py-5`}>
          <UserProfileHub />
        </div>
      </WorkspacePageShell>
    </ContactOnboardingGuard>
  );
}
