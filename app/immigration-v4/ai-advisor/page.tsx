import type { Metadata } from "next";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { IntelligenceAccessGate } from "@/components/intelligence/IntelligenceAccessGate";
import { IntelligenceBetaServerGate } from "@/components/intelligence/IntelligenceBetaServerGate";
import { createMetadata } from "@/lib/metadata";

/**
 * V4 workspace body for IMMIFIN AI Advisor.
 * Reuses the existing Advisor gates + workspace. Does not import the
 * production page or Ds2WorkspacePageShell.
 */
const previewMetadata = createMetadata({
  title: "Immigration V4 — IMMIFIN AI Advisor",
  description:
    "Temporary Product Owner preview of IMMIFIN AI Advisor inside Immigration V4. Not a public page.",
  path: "/immigration-v4/ai-advisor",
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

export default function ImmigrationV4AiAdvisorPage() {
  return (
    <div className="ds2-imm-v4-body">
      <ContactOnboardingGuard>
        <IntelligenceAccessGate>
          <IntelligenceBetaServerGate />
        </IntelligenceAccessGate>
      </ContactOnboardingGuard>
    </div>
  );
}
