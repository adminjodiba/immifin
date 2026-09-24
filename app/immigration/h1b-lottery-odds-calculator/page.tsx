import { Suspense } from "react";
import { Ds2CalculatorPageShell } from "@/components/ds2/Ds2CalculatorPageShell";
import { H1bLotteryOddsCalculator } from "@/components/H1bLotteryOddsCalculator";
import { H1bLotteryOddsSeoContent } from "@/components/H1bLotteryOddsSeoContent";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "H-1B Lottery Odds Calculator | FY2027 Wage-Weighted Selection",
  description:
    "Compare FY2027 H-1B lottery selection by wage level using DHS modeled estimates for Levels I-IV. U.S. master's eligibility is explained separately. Modeled estimates, not individual odds.",
  path: "/immigration/h1b-lottery-odds-calculator",
});

export default function H1bLotteryOddsCalculatorPage() {
  return (
    <Ds2CalculatorPageShell>
      <Suspense fallback={<div className="text-sm text-slate-500">Loading calculator…</div>}>
        <H1bLotteryOddsCalculator />
      </Suspense>
      <H1bLotteryOddsSeoContent />
    </Ds2CalculatorPageShell>
  );
}
