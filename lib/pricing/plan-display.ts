/**
 * Customer-facing Free / Pro / Power display copy.
 *
 * Source of truth for plan names, taglines, and feature bullets shown on
 * Pricing and the Billing plan-identity preview. Do not invent features here.
 */

import type { SubscriptionTier } from "@/lib/subscription/tiers";

export type PlanDisplayDefinition = {
  id: SubscriptionTier;
  name: string;
  description: string;
  features: readonly string[];
};

export const PLAN_DISPLAY_BY_TIER = {
  free: {
    id: "free",
    name: "Free",
    description: "Start with IMMIFIN Free",
    features: [
      "Current Visa Bulletin Dashboard",
      "Manual calculators",
      "Manage profile data",
      "No automation",
      "No notifications",
      "No AI",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Automation for your immigration journey.",
    features: [
      "Immigration Dashboard",
      "Auto-populated calculators",
      "Visa Bulletin history",
      "Movement tracker",
      "Email alerts",
      "Notifications",
    ],
  },
  power: {
    id: "power",
    name: "Power",
    description: "Full intelligence for life in America.",
    features: [
      "Everything in Pro",
      "AI Assistant",
      "Multiple profiles",
      "Advanced insights",
      "Priority support",
    ],
  },
} as const satisfies Record<SubscriptionTier, PlanDisplayDefinition>;

export function getPlanDisplay(tier: SubscriptionTier): PlanDisplayDefinition {
  return PLAN_DISPLAY_BY_TIER[tier];
}

const NEGATIVE_FEATURE = /^no\s/i;
const ROLLUP_FEATURE = /^everything in\s/i;

export type PlanComparisonRow = {
  feature: string;
  included: Record<SubscriptionTier, boolean>;
};

/**
 * Comparison rows derived from PLAN_DISPLAY_BY_TIER.
 * Baseline Free positives apply to every plan. Pro features apply to Pro/Power.
 * Power exclusives apply to Power only. Does not invent capabilities.
 */
export function getPlanComparisonRows(): PlanComparisonRow[] {
  const freeBaseline = PLAN_DISPLAY_BY_TIER.free.features.filter(
    (feature) => !NEGATIVE_FEATURE.test(feature) && !ROLLUP_FEATURE.test(feature),
  );
  const proFeatures = PLAN_DISPLAY_BY_TIER.pro.features.filter(
    (feature) => !NEGATIVE_FEATURE.test(feature) && !ROLLUP_FEATURE.test(feature),
  );
  const powerExclusive = PLAN_DISPLAY_BY_TIER.power.features.filter(
    (feature) => !NEGATIVE_FEATURE.test(feature) && !ROLLUP_FEATURE.test(feature),
  );

  return [
    ...freeBaseline.map((feature) => ({
      feature,
      included: { free: true, pro: true, power: true } as const,
    })),
    ...proFeatures.map((feature) => ({
      feature,
      included: { free: false, pro: true, power: true } as const,
    })),
    ...powerExclusive.map((feature) => ({
      feature,
      included: { free: false, pro: false, power: true } as const,
    })),
  ];
}
