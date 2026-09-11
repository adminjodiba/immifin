import type { Metadata } from "next";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { LandingV2ArticleCard } from "@/components/landing-v2/LandingV2ArticleCard";
import { LandingV2Explore } from "@/components/landing-v2/LandingV2Explore";
import { LandingV2SectionHeader } from "@/components/landing-v2/LandingV2SectionHeader";
import { LandingV2Hero } from "@/components/landing-v2/LandingV2Hero";
import { LandingV2Nav } from "@/components/landing-v2/LandingV2Nav";
import { LandingV2ProductShowcase } from "@/components/landing-v2/LandingV2ProductShowcase";
import { LandingV2AnnouncementBar } from "@/components/landing-v2/LandingV2AnnouncementBar";
import { landingV2BodyShellClass } from "@/components/landing-v2/landingV2Layout";
import { landingV2JourneyPoints, landingV2TrustPoints } from "@/lib/data/landing-v2";
import { WHY_WE_BUILT_IMMIFIN } from "@/lib/data/public-articles";
import { createMetadata } from "@/lib/metadata";

const previewMetadata = createMetadata({
  title: "Landing Page V2 Preview",
  description:
    "Locked commercial landing baseline (approved Landing V7). Not the current homepage.",
  path: "/landing-v2",
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

function DenseStaticCard({
  title,
  description,
  centered = false,
}: {
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4 ${
        centered ? "text-center sm:text-left" : ""
      }`}
    >
      <h3 className="text-sm font-semibold leading-snug text-slate-900 sm:text-[0.9375rem]">{title}</h3>
      <p className="mt-1.5 text-xs leading-snug text-slate-600">{description}</p>
    </div>
  );
}

/**
 * LOCKED — Product Owner approved Landing V7, promoted to /landing-v2 baseline.
 * Do not redesign, restyle, or experiment here. Design System work is /landing-v3.
 */
export default function LandingV2PreviewPage() {
  return (
    <ContactOnboardingGuard publicLanding>
      <div className="flex flex-col bg-white">
        <LandingV2AnnouncementBar />
        <LandingV2Nav />
        <LandingV2Hero />
        <LandingV2ProductShowcase />

        <div className={landingV2BodyShellClass}>
          <WorkspacePageShell>
            <LandingV2Explore title="U.S. Immigration Tools" />

            <WorkspaceSection alt aria-labelledby="more-than-tools-heading">
              <LandingV2SectionHeader
                titleId="more-than-tools-heading"
                title="More than just tools"
                description="IMMIFIN brings your immigration tools, information, and journey together in one trusted place."
              />
              <div className="grid gap-3 sm:grid-cols-3 sm:gap-3.5">
                {landingV2JourneyPoints.map((point) => (
                  <DenseStaticCard key={point.title} title={point.title} description={point.description} />
                ))}
              </div>
            </WorkspaceSection>

            <WorkspaceSection aria-labelledby="latest-article-heading">
              <LandingV2SectionHeader
                titleId="latest-article-heading"
                title="Latest IMMIFIN Article"
                description="A common IMMIFIN article — the start of a shared library, not a pillar-specific collection."
              />
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-4">
                <LandingV2ArticleCard article={WHY_WE_BUILT_IMMIFIN} />
              </div>
            </WorkspaceSection>

            <WorkspaceSection alt aria-labelledby="what-to-expect-heading">
              <LandingV2SectionHeader
                titleId="what-to-expect-heading"
                title="What you can expect"
                description="A restrained set of commitments we can stand behind today."
              />
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-4">
                {landingV2TrustPoints.map((point) => (
                  <DenseStaticCard
                    key={point.title}
                    title={point.title}
                    description={point.description}
                    centered
                  />
                ))}
              </div>
            </WorkspaceSection>
          </WorkspacePageShell>
        </div>
      </div>
    </ContactOnboardingGuard>
  );
}
