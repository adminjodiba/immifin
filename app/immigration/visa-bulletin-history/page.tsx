import {
  PremiumFeaturePreview,
  type PremiumFeatureInfoLink,
} from "@/components/common/PremiumFeaturePreview";
import { VisaBulletinHistoricalTrends } from "@/components/VisaBulletinHistoricalTrends";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Visa Bulletin Historical Trends",
  description:
    "Explore archived employment-based visa bulletin cutoff dates by category, country, and date type over time.",
  path: "/immigration/visa-bulletin-history",
});

const VISA_HISTORY_FEATURES = [
  "24 months of historical cutoff dates",
  "Category-wise movement history",
  "Country-specific trends",
  "Historical charts",
  "Personalized historical insights",
] as const;

const FREE_TOOL_LINKS: PremiumFeatureInfoLink[] = [
  { label: "Current Visa Bulletin", href: "/immigration/visa-bulletin" },
  { label: "Green Card Wait Calculator", href: "/calculators/green-card-wait-time" },
  { label: "Citizenship Calculator", href: "/calculators/citizenship-eligibility" },
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

export default function VisaBulletinHistoryPage() {
  return (
    <PremiumFeaturePreview
      requiredTier="pro"
      featureGroupTitle="Historical Intelligence"
      featureList={[...VISA_HISTORY_FEATURES]}
      showCloseButton
      infoState={VISA_HISTORY_INFO_STATE}
    >
      <VisaBulletinHistoricalTrends />
    </PremiumFeaturePreview>
  );
}
