import { Ds2CalculatorPageShell } from "@/components/ds2/Ds2CalculatorPageShell";
import { H1bWageLevelEstimator } from "@/components/H1bWageLevelEstimator";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "H-1B Wage Level Estimator",
  description:
    "Estimate your likely H-1B wage level using an official occupation, worksite ZIP, salary, experience, and education.",
  path: "/immigration/h1b-wage-level-estimator",
});

export default function H1bWageLevelEstimatorPage() {
  return (
    <Ds2CalculatorPageShell>
      <H1bWageLevelEstimator />
    </Ds2CalculatorPageShell>
  );
}
