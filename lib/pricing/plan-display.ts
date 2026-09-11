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
      "Personalized Dashboard",
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
