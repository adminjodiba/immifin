import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { IntelligenceAccessGate } from "@/components/intelligence/IntelligenceAccessGate";
import { IntelligenceBetaServerGate } from "@/components/intelligence/IntelligenceBetaServerGate";
import { Ds2WorkspacePageShell } from "@/components/ds2/Ds2WorkspacePageShell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "IMMIFIN AI Advisor",
  description:
    "Ask questions using your saved immigration profile and IMMIFIN’s structured immigration context.",
  path: "/intelligence",
});

function IntelligenceWorkspaceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M7 4.5h7.5L19 9v10.5H7V4.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 4.5V9H19M9.5 13h5M9.5 16.5h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Power-plan Intelligence Workspace with controlled-beta eligibility (S8-IIP-011).
 * Client gate: accessAI (Free/Pro locked). Server gate: beta allowlist.
 * API remains authoritative for both.
 */
export default function IntelligenceWorkspacePage() {
  return (
    <ContactOnboardingGuard>
      <Ds2WorkspacePageShell
        eyebrow="IMMIGRATION"
        title="IMMIFIN AI Advisor"
        description="Ask one question about your immigration journey. IMMIFIN may use your saved profile and structured immigration context when preparing a response. A more complete profile usually produces a clearer answer. Responses are informational — not legal advice, eligibility decisions, or predictions."
        icon={<IntelligenceWorkspaceIcon />}
        titleAccessory={<span className="ds2-hub-tier">Power</span>}
      >
        <IntelligenceAccessGate>
          <IntelligenceBetaServerGate />
        </IntelligenceAccessGate>
      </Ds2WorkspacePageShell>
    </ContactOnboardingGuard>
  );
}
