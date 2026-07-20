/**
 * Capability-based product access.
 *
 * Billing will later assign a tier. Product code should consume capabilities
 * via hasCapability / canAccess* helpers — not scattered `tier === "pro"` checks.
 *
 * See docs/BUSINESS_MODEL.md §12 Subscription Capability Architecture.
 */

import type { SubscriptionTier } from "@/lib/subscription/tiers";

export const SUBSCRIPTION_CAPABILITIES = [
  "accessPersonalDashboard",
  "accessSaveImmigrationProfile",
  "accessPriorityDateTracking",
  "accessAI",
  "accessMultipleProfiles",
  "accessEmailAlerts",
  "accessNotifications",
  "accessVisaHistory",
  "accessMovementTracker",
  "accessAutoCalculatorPopulation",
  "accessFavorites",
] as const;

export type SubscriptionCapability = (typeof SUBSCRIPTION_CAPABILITIES)[number];

/** Shared capability identifiers for server and client enforcement. */
export const CAPABILITY = {
  personalDashboard: "accessPersonalDashboard",
  saveImmigrationProfile: "accessSaveImmigrationProfile",
  priorityDateTracking: "accessPriorityDateTracking",
  ai: "accessAI",
  multipleProfiles: "accessMultipleProfiles",
  emailAlerts: "accessEmailAlerts",
  notifications: "accessNotifications",
  visaHistory: "accessVisaHistory",
  movementTracker: "accessMovementTracker",
  autoCalculatorPopulation: "accessAutoCalculatorPopulation",
  favorites: "accessFavorites",
} as const satisfies Record<string, SubscriptionCapability>;

export type TierCapabilities = Record<SubscriptionCapability, boolean>;

/**
 * Official Free / Pro / Power capability map.
 * Future tiers (Business, Enterprise) will extend this map when introduced.
 */
const CAPABILITIES_BY_TIER: Record<SubscriptionTier, TierCapabilities> = {
  free: {
    accessPersonalDashboard: false,
    accessSaveImmigrationProfile: false,
    accessPriorityDateTracking: false,
    accessAI: false,
    accessMultipleProfiles: false,
    accessEmailAlerts: false,
    accessNotifications: false,
    accessVisaHistory: false,
    accessMovementTracker: false,
    accessAutoCalculatorPopulation: false,
    accessFavorites: false,
  },
  pro: {
    accessPersonalDashboard: true,
    accessSaveImmigrationProfile: true,
    accessPriorityDateTracking: true,
    accessAI: false,
    accessMultipleProfiles: false,
    accessEmailAlerts: true,
    accessNotifications: true,
    accessVisaHistory: true,
    accessMovementTracker: true,
    accessAutoCalculatorPopulation: true,
    accessFavorites: true,
  },
  power: {
    accessPersonalDashboard: true,
    accessSaveImmigrationProfile: true,
    accessPriorityDateTracking: true,
    accessAI: true,
    accessMultipleProfiles: true,
    accessEmailAlerts: true,
    accessNotifications: true,
    accessVisaHistory: true,
    accessMovementTracker: true,
    accessAutoCalculatorPopulation: true,
    accessFavorites: true,
  },
};

export function getCapabilitiesForTier(tier: SubscriptionTier): TierCapabilities {
  return CAPABILITIES_BY_TIER[tier];
}

export function hasCapability(
  tier: SubscriptionTier,
  capability: SubscriptionCapability,
): boolean {
  return CAPABILITIES_BY_TIER[tier][capability];
}

export function canAccessPersonalDashboard(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessPersonalDashboard");
}

export function canAccessSaveImmigrationProfile(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessSaveImmigrationProfile");
}

export function canAccessPriorityDateTracking(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessPriorityDateTracking");
}

export function canAccessAI(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessAI");
}

export function canAccessMultipleProfiles(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessMultipleProfiles");
}

export function canAccessEmailAlerts(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessEmailAlerts");
}

/** Notification preferences and automated alerts (Pro automation). */
export function canAccessNotifications(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessNotifications");
}

export function canAccessVisaHistory(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessVisaHistory");
}

export function canAccessMovementTracker(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessMovementTracker");
}

export function canAccessAutoCalculatorPopulation(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessAutoCalculatorPopulation");
}

export function canAccessFavorites(tier: SubscriptionTier): boolean {
  return hasCapability(tier, "accessFavorites");
}
