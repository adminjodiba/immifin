import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { IntelligenceAccessGate } from "@/components/intelligence/IntelligenceAccessGate";
import { IntelligenceBetaServerGate } from "@/components/intelligence/IntelligenceBetaServerGate";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "IMMIFIN AI Advisor",
  description:
    "Ask questions using your saved immigration profile and IMMIFIN’s structured immigration context.",
  path: "/intelligence",
});

/**
 * Power-plan Intelligence Workspace with controlled-beta eligibility (S8-IIP-011).
 * Client gate: accessAI (Free/Pro locked). Server gate: beta allowlist.
 * API remains authoritative for both.
 */
export default function IntelligenceWorkspacePage() {
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
