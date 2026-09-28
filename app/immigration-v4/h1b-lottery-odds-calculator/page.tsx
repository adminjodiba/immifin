import type { Metadata } from "next";
import { Suspense } from "react";
import { H1bLotteryOddsCalculator } from "@/components/H1bLotteryOddsCalculator";
import { createMetadata } from "@/lib/metadata";

/**
 * V4 workspace body for H-1B Lottery Odds Calculator.
 * Reuses the existing calculator body. Does not import the production page,
 * SEO content, or Ds2CalculatorPageShell.
 */
const previewMetadata = createMetadata({
  title: "Immigration V4 — H-1B Lottery Odds Calculator",
  description:
    "Temporary Product Owner preview of H-1B Lottery Odds Calculator inside Immigration V4. Not a public page.",
  path: "/immigration-v4/h1b-lottery-odds-calculator",
});

export const metadata: Metadata = {
  ...previewMetadata,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ImmigrationV4H1bLotteryOddsCalculatorPage() {
  return (
    <div className="ds2-imm-v4-body">
      <Suspense fallback={<div className="text-sm text-slate-500">Loading calculator…</div>}>
        <H1bLotteryOddsCalculator
          href="/immigration-v4"
          wageHref="/immigration-v4/h1b-wage-level-estimator"
        />
      </Suspense>
    </div>
  );
}
