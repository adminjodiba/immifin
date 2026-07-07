import { Suspense } from "react";
import { H1bLotteryOddsCalculator } from "@/components/H1bLotteryOddsCalculator";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "H-1B Lottery Odds Calculator",
  description:
    "Estimate your H-1B lottery odds using wage level and U.S. master's cap eligibility.",
  path: "/immigration/h1b-lottery-odds-calculator",
});

export default function H1bLotteryOddsCalculatorPage() {
  return (
    <WorkspacePageShell>
      <div className="container-main py-4 sm:py-5">
        <Suspense fallback={<div className="text-sm text-slate-500">Loading calculator…</div>}>
          <H1bLotteryOddsCalculator />
        </Suspense>
      </div>
    </WorkspacePageShell>
  );
}
