import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { LandingV3ArticleCard } from "@/components/landing-v3/LandingV3ArticleCard";
import { LandingV3Explore } from "@/components/landing-v3/LandingV3Explore";
import { LandingV3SectionHeader } from "@/components/landing-v3/LandingV3SectionHeader";
import { LandingV3Hero } from "@/components/landing-v3/LandingV3Hero";
import { LandingV3ProductShowcase } from "@/components/landing-v3/LandingV3ProductShowcase";
import { landingV3BodyShellClass } from "@/components/landing-v3/landingV3Layout";
import { landingV2JourneyPoints, landingV2TrustPoints } from "@/lib/data/landing-v2";
import { WHY_WE_BUILT_IMMIFIN } from "@/lib/data/public-articles";

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
 * Approved Landing V3 body — announcement/nav stay in the route chrome.
 * Used by production `/` and preview `/landing-v3`.
 */
export function LandingV3PageContent() {
  return (
    <div className="flex flex-col bg-white">
      <LandingV3Hero />
      <LandingV3ProductShowcase />

      <div className={landingV3BodyShellClass}>
        <WorkspacePageShell>
          <LandingV3Explore title="U.S. Immigration Tools" />

          <WorkspaceSection alt aria-labelledby="more-than-tools-heading">
            <LandingV3SectionHeader
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
            <LandingV3SectionHeader
              titleId="latest-article-heading"
              title="Latest IMMIFIN Article"
              description="A common IMMIFIN article — the start of a shared library, not a pillar-specific collection."
            />
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-4">
              <LandingV3ArticleCard article={WHY_WE_BUILT_IMMIFIN} />
            </div>
          </WorkspaceSection>

          <WorkspaceSection alt aria-labelledby="what-to-expect-heading">
            <LandingV3SectionHeader
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
  );
}
