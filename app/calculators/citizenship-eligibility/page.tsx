import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { CitizenshipEligibilityCalculator } from "@/components/CitizenshipEligibilityCalculator";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Citizenship Eligibility Calculator",
  description:
    "Estimate when you may be eligible to apply for U.S. citizenship based on your green card issue date.",
  path: "/calculators/citizenship-eligibility",
});

export default function CitizenshipEligibilityPage() {
  return (
    <WorkspacePageShell>
      <div className="container-main py-4 sm:py-5">
        <CitizenshipEligibilityCalculator />
      </div>
    </WorkspacePageShell>
  );
}
