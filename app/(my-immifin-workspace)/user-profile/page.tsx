import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { UserProfileHub } from "@/components/profile/UserProfileHub";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "My Profile",
  description: "Manage your personal information, immigration details, and preferences.",
  path: "/user-profile",
});

export default function ManageProfilePage() {
  return (
    <ContactOnboardingGuard>
      <UserProfileHub />
    </ContactOnboardingGuard>
  );
}
