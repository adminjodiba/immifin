import type { Metadata } from "next";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { LandingV3AnnouncementBar } from "@/components/landing-v3/LandingV3AnnouncementBar";
import { LandingV3Nav } from "@/components/landing-v3/LandingV3Nav";
import { LandingV3PageContent } from "@/components/landing-v3/LandingV3PageContent";
import { createMetadata } from "@/lib/metadata";

const previewMetadata = createMetadata({
  title: "Landing Page V3 Preview",
  description:
    "Design System 2.0 working copy of the locked Landing V2 baseline. Not the current homepage.",
  path: "/landing-v3",
});

export const metadata: Metadata = {
  ...previewMetadata,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

/**
 * Design System 2.0 working copy — preview chrome and preview metadata stay here.
 * Production `/` reuses LandingV3PageContent with S7A-SEO-006 metadata.
 */
export default function LandingV3PreviewPage() {
  return (
    <ContactOnboardingGuard publicLanding>
      <div className="flex flex-col bg-white">
        <LandingV3AnnouncementBar />
        <LandingV3Nav />
        <LandingV3PageContent />
      </div>
    </ContactOnboardingGuard>
  );
}
