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
    <div className="ds2-imm-v4-body">
      <CitizenshipEligibilityCalculator href="/immigration" />
    </div>
  );
}
