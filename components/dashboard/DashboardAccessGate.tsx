"use client";

import type { ReactNode } from "react";
import {
  PremiumFeaturePreview,
  type PremiumFeatureInfoLink,
} from "@/components/common/PremiumFeaturePreview";

const DASHBOARD_FEATURES = [
  "Personalized immigration journey timeline",
  "Priority date vs Visa Bulletin comparison",
  "Dates for Filing and Final Action tracking",
  "Today's focus and recommended next steps",
  "Green card holder citizenship path",
] as const;

const FREE_TOOL_LINKS: PremiumFeatureInfoLink[] = [
  { label: "Visa Bulletin Dashboard", href: "/immigration/visa-bulletin" },
  { label: "Green Card Wait Calculator", href: "/calculators/green-card-wait-time" },
  { label: "All Calculators", href: "/calculators" },
];

const DASHBOARD_INFO_STATE = {
  title: "Personal Dashboard is a Pro feature",
  message:
    "Your immigration profile and favorites are saved when your plan changes. Upgrade to Pro to unlock your personalized dashboard again.",
  proBenefits: [
    "Track priority date against the Visa Bulletin",
    "See Dates for Filing and Final Action status",
    "Get today's focus and next-step actions",
    "Monitor your path from priority date to green card",
    "Access saved profile data and automation",
  ],
  freeToolsSectionTitle: "Continue with free tools",
  freeToolsLinks: FREE_TOOL_LINKS,
} as const;

type DashboardAccessGateProps = {
  children: ReactNode;
};

/**
 * Gates dashboard content by Pro capability.
 * Free users see a blurred preview; profile data stays in the database on downgrade.
 */
export function DashboardAccessGate({ children }: DashboardAccessGateProps) {
  return (
    <PremiumFeaturePreview
      requiredTier="pro"
      title="Unlock Your Personal Dashboard"
      description="Track your immigration journey with personalized timelines, Visa Bulletin comparisons, and clear next steps."
      featureGroupTitle="Personal Dashboard"
      featureList={[...DASHBOARD_FEATURES]}
      showCloseButton
      infoState={DASHBOARD_INFO_STATE}
    >
      {children}
    </PremiumFeaturePreview>
  );
}
