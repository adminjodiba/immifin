import type { Metadata } from "next";
import {
  PremiumFeaturePreview,
  type PremiumFeatureInfoLink,
} from "@/components/common/PremiumFeaturePreview";
import { VisaBulletinHistoricalTrends } from "@/components/VisaBulletinHistoricalTrends";
import { CAPABILITY } from "@/lib/subscription/capabilities";
import { createMetadata } from "@/lib/metadata";

/**
 * V4 workspace body for Visa Bulletin History.
 * Reuses the existing History body + Pro gate.
 * Does not import the production page or Ds2DataPageShell.
 */
const previewMetadata = createMetadata({
  title: "Immigration V4 — Visa Bulletin History",
  description:
    "Temporary Product Owner preview of Visa Bulletin History inside Immigration V4. Not a public page.",
  path: "/immigration-v4/visa-bulletin-history",
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

const VISA_HISTORY_FEATURES = [
  "24 months of historical cutoff dates",
  "Category-wise movement history",
  "Country-specific trends",
  "Historical charts",
  "Personalized historical insights",
] as const;

const FREE_TOOL_LINKS: PremiumFeatureInfoLink[] = [
  { label: "Current Visa Bulletin", href: "/immigration-v4/visa-bulletin" },
  { label: "Green Card Calculator", href: "/immigration-v4/green-card-wait-time" },
  { label: "Citizenship Calculator", href: "/immigration-v4/citizenship-eligibility" },
];

const VISA_HISTORY_INFO_STATE = {
  title: "Visa Bulletin History is a Pro feature",
  message:
    "Visa Bulletin History helps you analyze how cutoff dates have moved over time for your category and country.",
  proBenefits: [
    "View historical cutoff dates",
    "Track monthly movement",
    "Analyze long-term trends",
    "Compare categories and countries",
    "Get personalized immigration insights",
  ],
  freeToolsLinks: FREE_TOOL_LINKS,
} as const;

export default function ImmigrationV4VisaBulletinHistoryPage() {
  return (
    <div className="ds2-imm-v4-body">
      <PremiumFeaturePreview
        capability={CAPABILITY.visaHistory}
        featureGroupTitle="Historical Intelligence"
        featureList={[...VISA_HISTORY_FEATURES]}
        showCloseButton
        infoState={VISA_HISTORY_INFO_STATE}
      >
        <VisaBulletinHistoricalTrends
          href="/immigration-v4"
          relatedToolHrefs={{
            "Visa Bulletin Dashboard": "/immigration-v4/visa-bulletin",
            "Movement Tracker": "/immigration-v4/visa-bulletin-movement",
            "Green Card Calculator": "/immigration-v4/green-card-wait-time",
            "Citizenship Eligibility": "/immigration-v4/citizenship-eligibility",
          }}
        />
      </PremiumFeaturePreview>
    </div>
  );
}
