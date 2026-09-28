import type { Metadata } from "next";
import { CitizenshipEligibilityCalculator } from "@/components/CitizenshipEligibilityCalculator";
import { createMetadata } from "@/lib/metadata";

/**
 * V4 workspace body for Citizenship Eligibility Calculator.
 * Reuses the existing calculator body. Does not import the production page
 * or Ds2CalculatorPageShell.
 */
const previewMetadata = createMetadata({
  title: "Immigration V4 — Citizenship Eligibility Calculator",
  description:
    "Temporary Product Owner preview of Citizenship Eligibility Calculator inside Immigration V4. Not a public page.",
  path: "/immigration-v4/citizenship-eligibility",
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

export default function ImmigrationV4CitizenshipEligibilityPage() {
  return (
    <div className="ds2-imm-v4-body">
      <CitizenshipEligibilityCalculator
        href="/immigration-v4"
        relatedToolHrefs={{
          "Visa Bulletin Dashboard": "/immigration-v4/visa-bulletin",
          "Green Card Calculator": "/immigration-v4/green-card-wait-time",
        }}
      />
    </div>
  );
}
