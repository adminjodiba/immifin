import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { ExploreCapabilityCard } from "@/components/landing-v3/ExploreCapabilityCard";
import { LandingV3SectionHeader } from "@/components/landing-v3/LandingV3SectionHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { landingV2ExploreCapabilities } from "@/lib/data/landing-v2";

type LandingV3ExploreProps = {
  title?: string;
};

export function LandingV3Explore({ title = "Tools For Immigration" }: LandingV3ExploreProps) {
  return (
    <WorkspaceSection id="explore-immifin" aria-labelledby="explore-immifin-heading">
      <LandingV3SectionHeader
        titleId="explore-immifin-heading"
        title={title}
        description="Explore our free immigration tools and stay informed about your options and next steps."
        nowrapTitle
        action={
          <ProtectedLink href="/calculators" className="link-arrow shrink-0 self-start sm:self-auto">
            View all immigration tools
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </ProtectedLink>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3">
        {landingV2ExploreCapabilities.map((capability) => (
          <ExploreCapabilityCard key={capability.href} capability={capability} />
        ))}
      </div>
    </WorkspaceSection>
  );
}
