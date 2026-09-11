import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { LandingV3PageContent } from "@/components/landing-v3/LandingV3PageContent";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "IMMIFIN | U.S. Immigration Tools & Insights",
  description:
    "Know where you stand. Stay informed when things change. Explore trusted U.S. immigration tools for Green Cards, citizenship, H-1B and visa planning.",
  path: "",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <ContactOnboardingGuard publicLanding>
      <LandingV3PageContent />
    </ContactOnboardingGuard>
  );
}
