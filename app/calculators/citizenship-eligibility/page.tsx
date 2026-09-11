import { Ds2CalculatorPageShell } from "@/components/ds2/Ds2CalculatorPageShell";
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
    <Ds2CalculatorPageShell>
      <CitizenshipEligibilityCalculator />
    </Ds2CalculatorPageShell>
  );
}
