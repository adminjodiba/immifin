import {
  PremiumFeaturePreview,
  type PremiumFeatureInfoLink,
} from "@/components/common/PremiumFeaturePreview";
import { VisaBulletinMovementTracker2 } from "@/components/VisaBulletinMovementTracker2";
import { createMetadata } from "@/lib/metadata";
import {
  formatVisaBulletinMonthShort,
  getLatestVisaBulletinMonth,
} from "@/lib/visaBulletinHistory";

export const metadata = createMetadata({
  title: "Visa Bulletin Movement Tracker",
  description:
    "Compare current and previous visa bulletin dates and track employment-based green card movement.",
  path: "/immigration/visa-bulletin-movement",
});

const MOVEMENT_TRACKER_FEATURES = [
  "Monthly movement tracking",
  "Personalized priority date comparison",
  "Historical movement summaries",
  "Trend analysis",
  "Future movement insights",
] as const;

const FREE_TOOL_LINKS: PremiumFeatureInfoLink[] = [
  { label: "Current Visa Bulletin", href: "/immigration/visa-bulletin" },
  { label: "Green Card Calculator", href: "/calculators/green-card-wait-time" },
  { label: "Citizenship Calculator", href: "/calculators/citizenship-eligibility" },
];

const MOVEMENT_TRACKER_INFO_STATE = {
  title: "Movement Tracker is a Pro feature",
  message:
    "Movement Tracker helps you understand how the Visa Bulletin changed from month to month and how those changes affect your immigration journey.",
  proBenefits: [
    "Track monthly movement",
    "Compare current and previous bulletins",
    "See category and country movement",
    "Understand whether your case moved forward, backward, or stayed the same",
    "Connect movement to your saved profile",
  ],
  freeToolsLinks: FREE_TOOL_LINKS,
} as const;

export default async function VisaBulletinMovementPage() {
  const latestMonth = await getLatestVisaBulletinMonth();
  const bulletinMonthLabel = latestMonth ? formatVisaBulletinMonthShort(latestMonth) : null;

  return (
    <PremiumFeaturePreview
      requiredTier="pro"
      featureGroupTitle="Movement Intelligence"
      featureList={[...MOVEMENT_TRACKER_FEATURES]}
      showCloseButton
      infoState={MOVEMENT_TRACKER_INFO_STATE}
    >
      <VisaBulletinMovementTracker2 bulletinMonthLabel={bulletinMonthLabel} />
    </PremiumFeaturePreview>
  );
}
