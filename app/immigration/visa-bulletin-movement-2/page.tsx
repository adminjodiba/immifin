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
  title: "Visa Bulletin Movement Tracker 2",
  description:
    "Sprint 5 Design System 2.0 mock — compare Visa Bulletin movements between two consecutive months.",
  path: "/immigration/visa-bulletin-movement-2",
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
  { label: "Green Card Wait Calculator", href: "/calculators/green-card-wait-time" },
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

export default async function VisaBulletinMovementTracker2Page() {
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
