import { Suspense } from "react";
import { Ds2CalculatorPageShell } from "@/components/ds2/Ds2CalculatorPageShell";
import { H1bLotteryOddsCalculator } from "@/components/H1bLotteryOddsCalculator";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "H-1B Lottery Odds Calculator",
  description:
    "Compare DHS modeled H-1B selection estimates by wage level. Modeled estimates, not a prediction of individual selection.",
  path: "/immigration/h1b-lottery-odds-calculator",
});

export default function H1bLotteryOddsCalculatorPage() {
  return (
    <Ds2CalculatorPageShell>
      <Suspense fallback={<div className="text-sm text-slate-500">Loading calculator…</div>}>
        <H1bLotteryOddsCalculator />
      </Suspense>
    </Ds2CalculatorPageShell>
  );
}
