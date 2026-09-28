import type { Metadata } from "next";
import {
  PremiumFeaturePreview,
  type PremiumFeatureInfoLink,
} from "@/components/common/PremiumFeaturePreview";
import { VisaBulletinMovementTracker2 } from "@/components/VisaBulletinMovementTracker2";
import { CAPABILITY } from "@/lib/subscription/capabilities";
import { createMetadata } from "@/lib/metadata";
import {
  formatVisaBulletinMonthShort,
  getLatestVisaBulletinMonth,
} from "@/lib/visaBulletinHistory";

/**
 * V4 workspace body for Movement Tracker.
 * Reuses the existing tracker body + Pro gate.
 * Does not import the production page or Ds2DataPageShell.
 */
const previewMetadata = createMetadata({
  title: "Immigration V4 — Movement Tracker",
  description:
    "Temporary Product Owner preview of Movement Tracker inside Immigration V4. Not a public page.",
  path: "/immigration-v4/visa-bulletin-movement",
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

const MOVEMENT_TRACKER_FEATURES = [
  "Monthly movement tracking",
  "Personalized priority date comparison",
  "Historical movement summaries",
  "Trend analysis",
  "Future movement insights",
] as const;

const FREE_TOOL_LINKS: PremiumFeatureInfoLink[] = [
  { label: "Current Visa Bulletin", href: "/immigration-v4/visa-bulletin" },
  { label: "Green Card Calculator", href: "/immigration-v4/green-card-wait-time" },
  { label: "Citizenship Calculator", href: "/immigration-v4/citizenship-eligibility" },
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

function getPreviousMonthKey(month: string): string | null {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  const previous = new Date(year, monthNumber - 2, 1);
  const previousMonth = String(previous.getMonth() + 1).padStart(2, "0");
  return `${previous.getFullYear()}-${previousMonth}`;
}

function formatBulletinColumnLabel(month: string | null): string | null {
  if (!month) {
    return null;
  }

  return `${formatVisaBulletinMonthShort(month)} Bulletin`;
}

export default async function ImmigrationV4MovementTrackerPage() {
  const latestMonth = await getLatestVisaBulletinMonth();
  const previousMonth = latestMonth ? getPreviousMonthKey(latestMonth) : null;
  const bulletinMonthLabel = latestMonth ? formatVisaBulletinMonthShort(latestMonth) : null;
  const currentBulletinColumnLabel = formatBulletinColumnLabel(latestMonth) ?? "Current Bulletin";
  const previousBulletinColumnLabel =
    formatBulletinColumnLabel(previousMonth) ?? "Previous Bulletin";

  return (
    <div className="ds2-imm-v4-body">
      <PremiumFeaturePreview
        capability={CAPABILITY.movementTracker}
        featureGroupTitle="Movement Intelligence"
        featureList={[...MOVEMENT_TRACKER_FEATURES]}
        showCloseButton
        infoState={MOVEMENT_TRACKER_INFO_STATE}
      >
        <VisaBulletinMovementTracker2
          bulletinMonthLabel={bulletinMonthLabel}
          previousBulletinColumnLabel={previousBulletinColumnLabel}
          currentBulletinColumnLabel={currentBulletinColumnLabel}
          href="/immigration-v4"
          relatedToolHrefs={{
            "Visa Bulletin Dashboard": "/immigration-v4/visa-bulletin",
            "Visa Bulletin History": "/immigration-v4/visa-bulletin-history",
            "Green Card Calculator": "/immigration-v4/green-card-wait-time",
          }}
        />
      </PremiumFeaturePreview>
    </div>
  );
}
