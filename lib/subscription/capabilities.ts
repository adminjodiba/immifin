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
  "accessAI",
  "accessMultipleProfiles",
  "accessEmailAlerts",
  "accessNotifications",
  "accessVisaHistory",
  "accessMovementTracker",
  "accessAutoCalculatorPopulation",
] as const;

export type SubscriptionCapability = (typeof SUBSCRIPTION_CAPABILITIES)[number];

export type TierCapabilities = Record<SubscriptionCapability, boolean>;

/**
 * Future tiers (Business, Enterprise) will extend this map when introduced.
 */
const CAPABILITIES_BY_TIER: Record<SubscriptionTier, TierCapabilities> = {
  free: {
    accessPersonalDashboard: false,
    accessAI: false,
    accessMultipleProfiles: false,
    accessEmailAlerts: false,
    accessNotifications: false,
    accessVisaHistory: false,
    accessMovementTracker: false,
    accessAutoCalculatorPopulation: false,
  },
  pro: {
    accessPersonalDashboard: true,
    accessAI: false,
    accessMultipleProfiles: false,
    accessEmailAlerts: true,
    accessNotifications: true,
    accessVisaHistory: true,
    accessMovementTracker: true,
    accessAutoCalculatorPopulation: true,
  },
  power: {
    accessPersonalDashboard: true,
    accessAI: true,
    accessMultipleProfiles: true,
    accessEmailAlerts: true,
    accessNotifications: true,
    accessVisaHistory: true,
    accessMovementTracker: true,
    accessAutoCalculatorPopulation: true,
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
