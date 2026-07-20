import { canAccessPersonalDashboard } from "@/lib/subscription/capabilities";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { BILLING_CENTER_PATH } from "@/lib/billing/billing-center";
import type { PremiumNavPreviewKey } from "@/lib/premium-nav-preview";

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
  | "aiAssistant"
  | "admin";

export type MyImmifinMenuItem = {
  id: string;
  href: string;
  label: string;
  description: string;
  capability: MyImmifinCapability;
  /** Product phase when this item ships. Only phase 1 is visible today. */
  phase: 1 | 2 | 3 | 4;
  /** When set, Free users open a feature preview instead of navigating. */
  premiumPreview?: PremiumNavPreviewKey;
};

export const MY_IMMIFIN_NAV_LABEL = "My Immifin";

/** @deprecated Prefer PremiumNavPreviewDialog — retained for any legacy copy references. */
export const DASHBOARD_PRO_LOCK_MESSAGE = "Dashboard is available in Pro.";

export const PRICING_PATH = "/pricing";

const dashboardItem: MyImmifinMenuItem = {
  id: "dashboard",
  href: "/dashboard",
  label: "Dashboard",
  description: "Your personalized immigration journey and status.",
  capability: "dashboard",
  phase: 1,
  premiumPreview: "dashboard",
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
  href: BILLING_CENTER_PATH,
  label: "Subscription & Billing",
  description: "Manage your plan, renewals, and billing.",
  capability: "subscription",
  phase: 1,
};

const viewPlanItem: MyImmifinMenuItem = {
  id: "view-plan",
  href: `${PRICING_PATH}#plans`,
  label: "View Plan",
  description: "Compare Immifin plans and choose the right tier.",
  capability: "subscription",
  phase: 1,
};

const adminItem: MyImmifinMenuItem = {
  id: "admin",
  href: "/admin",
  label: "Admin",
  description: "Dataset freshness and internal maintenance.",
  capability: "admin",
  phase: 1,
};

export type MyImmifinMenuOptions = {
  /** When true, append the Admin workspace link (role-gated in the header). */
  isAdmin?: boolean;
};

/**
 * Tier-aware My Immifin menu items.
 *
 * Free: Dashboard (preview), Manage Profile, Upgrade to Pro
 * Pro/Power: Dashboard, Manage Profile, Subscription & Billing, View Plan
 * Admin role: also Admin (appended last)
 */
export function getVisibleMyImmifinMenuItems(
  tier: SubscriptionTier,
  options: MyImmifinMenuOptions = {},
): MyImmifinMenuItem[] {
  const items: MyImmifinMenuItem[] = [dashboardItem, manageProfileItem];

  if (canAccessPersonalDashboard(tier)) {
    items.push(subscriptionItem, viewPlanItem);
  } else {
    items.push(upgradeToProItem);
  }

  if (options.isAdmin) {
    items.push(adminItem);
  }

  return items;
}

/**
 * Returns the premium preview key when Free users should open a popup instead of navigating.
 */
export function getMyImmifinPremiumPreview(
  item: MyImmifinMenuItem,
  tier: SubscriptionTier,
): PremiumNavPreviewKey | null {
  if (item.premiumPreview === "dashboard" && !canAccessPersonalDashboard(tier)) {
    return "dashboard";
  }

  return null;
}

/**
 * @deprecated Use getMyImmifinPremiumPreview — Dashboard is no longer greyed/disabled.
 */
export function isMyImmifinItemLocked(
  item: MyImmifinMenuItem,
  tier: SubscriptionTier,
): boolean {
  return getMyImmifinPremiumPreview(item, tier) !== null;
}
