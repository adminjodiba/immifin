import { canAccessPersonalDashboard } from "@/lib/subscription/capabilities";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

/**
 * My Immifin personal workspace menu.
 *
 * Phase 1 items are visible now. Later phases plug in via capability checks.
 */

export type MyImmifinCapability =
  | "dashboard"
  | "manageProfile"
  | "notifications"
  | "subscription"
  | "upgrade"
  | "savedProfiles"
  | "aiAssistant";

export type MyImmifinMenuItem = {
  id: string;
  href: string;
  label: string;
  description: string;
  capability: MyImmifinCapability;
  /** Product phase when this item ships. Only phase 1 is visible today. */
  phase: 1 | 2 | 3 | 4;
};

export const MY_IMMIFIN_NAV_LABEL = "My Immifin";

export const DASHBOARD_PRO_LOCK_MESSAGE = "Dashboard is available in Pro.";

export const PRICING_PATH = "/pricing";

const dashboardItem: MyImmifinMenuItem = {
  id: "dashboard",
  href: "/dashboard",
  label: "Dashboard",
  description: "Your personalized immigration journey and status.",
  capability: "dashboard",
  phase: 1,
};

const manageProfileItem: MyImmifinMenuItem = {
  id: "manage-profile",
  href: "/user-profile",
  label: "Manage Profile",
  description: "Account, contact, and immigration profile settings.",
  capability: "manageProfile",
  phase: 1,
};

const upgradeToProItem: MyImmifinMenuItem = {
  id: "upgrade-to-pro",
  href: PRICING_PATH,
  label: "Upgrade to Pro",
  description: "Unlock dashboard, alerts, and automation.",
  capability: "upgrade",
  phase: 1,
};

const subscriptionItem: MyImmifinMenuItem = {
  id: "subscription",
  href: PRICING_PATH,
  label: "Subscription",
  description: "View plans and upgrade options.",
  capability: "subscription",
  phase: 1,
};

/**
 * Tier-aware My Immifin menu items.
 *
 * Free: Dashboard (locked), Manage Profile, Upgrade to Pro
 * Pro/Power: Dashboard, Manage Profile, Subscription
 */
export function getVisibleMyImmifinMenuItems(tier: SubscriptionTier): MyImmifinMenuItem[] {
  const items: MyImmifinMenuItem[] = [dashboardItem, manageProfileItem];

  if (canAccessPersonalDashboard(tier)) {
    items.push(subscriptionItem);
  } else {
    items.push(upgradeToProItem);
  }

  return items;
}

/**
 * Whether a menu item should appear greyed/locked for the current tier.
 * Uses capability helpers — not raw plan-name checks.
 */
export function isMyImmifinItemLocked(
  item: MyImmifinMenuItem,
  tier: SubscriptionTier,
): boolean {
  if (item.capability === "dashboard") {
    return !canAccessPersonalDashboard(tier);
  }

  return false;
}
