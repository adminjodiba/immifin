import { Ds2CalculatorPageShell } from "@/components/ds2/Ds2CalculatorPageShell";
import { GreenCardWaitTimeCalculator } from "@/components/GreenCardWaitTimeCalculator";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Green Card Wait Time Calculator",
  description:
    "Estimate your employment-based Green Card wait by comparing your priority date with a Visa Bulletin cutoff date.",
  path: "/calculators/green-card-wait-time",
});

export default function GreenCardWaitTimePage() {
  return (
    <Ds2CalculatorPageShell>
      <GreenCardWaitTimeCalculator />
    </Ds2CalculatorPageShell>
  );
}
