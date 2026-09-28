import type { Metadata } from "next";
import { H1bWageLevelEstimator } from "@/components/H1bWageLevelEstimator";
import { createMetadata } from "@/lib/metadata";

/**
 * V4 workspace body for H-1B Wage Level Estimator.
 * Reuses the existing estimator body. Does not import the production page
 * or Ds2CalculatorPageShell.
 */
const previewMetadata = createMetadata({
  title: "Immigration V4 — H-1B Wage Level Estimator",
  description:
    "Temporary Product Owner preview of H-1B Wage Level Estimator inside Immigration V4. Not a public page.",
  path: "/immigration-v4/h1b-wage-level-estimator",
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

export default function ImmigrationV4H1bWageLevelEstimatorPage() {
  return (
    <div className="ds2-imm-v4-body">
      <H1bWageLevelEstimator
        href="/immigration-v4"
        lotteryHref="/immigration-v4/h1b-lottery-odds-calculator"
      />
    </div>
  );
}
