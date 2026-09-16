import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { PersonalizationPage } from "@/components/personalization/PersonalizationPage";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Personalization",
  description: "Choose what you want to see when you sign in to IMMIFIN.",
  path: "/user-profile/personalization",
});

export default function PersonalizationRoutePage() {
  return (
    <ContactOnboardingGuard>
      <PersonalizationPage />
    </ContactOnboardingGuard>
  );
}
