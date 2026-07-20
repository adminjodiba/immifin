import { CAPABILITY, type SubscriptionCapability } from "@/lib/subscription/capabilities";

/**
 * Feature-specific premium navigation preview content (S7-UI-007 / S7-UI-008A).
 * Used when Free users click a Pro menu item instead of navigating.
 */

export const PREMIUM_NAV_PREVIEW_KEYS = [
  "dashboard",
  "movementTracker",
  "favorites",
  "visaHistory",
] as const;

export type PremiumNavPreviewKey = (typeof PREMIUM_NAV_PREVIEW_KEYS)[number];

export type PremiumNavPreviewContent = {
  key: PremiumNavPreviewKey;
  capability: SubscriptionCapability;
  title: string;
  description: string;
  featureGroupTitle: string;
  benefits: readonly string[];
};

export const PREMIUM_NAV_PREVIEWS: Record<PremiumNavPreviewKey, PremiumNavPreviewContent> = {
  dashboard: {
    key: "dashboard",
    capability: CAPABILITY.personalDashboard,
    title: "Unlock Your Personalized Dashboard",
    description:
      "Bring your immigration journey into one personalized workspace — priority dates, bulletin status, progress, and recommended next steps in a single view.",
    featureGroupTitle: "Personalized Dashboard",
    benefits: [
      "Personalized immigration journey overview",
      "Priority-date tracking",
      "Visa bulletin status based on your profile",
      "Filing and final-action progress",
      "Movement summaries",
      "Alerts and recommended next actions",
    ],
  },
  movementTracker: {
    key: "movementTracker",
    capability: CAPABILITY.movementTracker,
    title: "Unlock Movement Intelligence",
    description:
      "Analyze visa bulletin movement and track how your immigration category is progressing month over month.",
    featureGroupTitle: "Movement Intelligence",
    benefits: [
      "Monthly movement tracking",
      "Personalized priority-date comparison",
      "Historical movement summaries",
      "Trend analysis",
      "Future movement insights",
    ],
  },
  favorites: {
    key: "favorites",
    capability: CAPABILITY.favorites,
    title: "Unlock Favorites",
    description:
      "Pro users can save frequently used IMMIFIN pages and access them quickly from the Favorites menu.",
    featureGroupTitle: "Favorites",
    benefits: [
      "Save frequently used tools",
      "Quick access from navigation",
      "Organize favorite IMMIFIN pages",
      "Faster return to important immigration tools",
    ],
  },
  visaHistory: {
    key: "visaHistory",
    capability: CAPABILITY.visaHistory,
    title: "Unlock Visa Bulletin History",
    description:
      "Analyze how cutoff dates have moved over time for your immigration category and country.",
    featureGroupTitle: "Historical Intelligence",
    benefits: [
      "24 months of historical cutoff dates",
      "Category-wise movement history",
      "Country-specific trends",
      "Historical charts",
      "Personalized historical insights",
    ],
  },
};

export function getPremiumNavPreviewContent(
  key: PremiumNavPreviewKey,
): PremiumNavPreviewContent {
  return PREMIUM_NAV_PREVIEWS[key];
}

export function isPremiumNavPreviewKey(value: string | null | undefined): value is PremiumNavPreviewKey {
  return (
    value === "dashboard" ||
    value === "movementTracker" ||
    value === "favorites" ||
    value === "visaHistory"
  );
}
