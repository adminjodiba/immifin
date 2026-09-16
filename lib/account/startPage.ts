import { isAdminRole, type AppUserRole } from "@/lib/auth/roles";
import { canAccessPersonalDashboard } from "@/lib/subscription/capabilities";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

export const START_PAGE_PREFERENCE_KEY = "startPage";
export const START_PAGE_HOME_ID = "home";
export const POST_LOGIN_START_PATH = "/auth/start";

/**
 * Registered start-page destinations.
 * Add future products (e.g. finance-dashboard) here when the route exists
 * and an authoritative access check is available. Do not register placeholders.
 */
export const START_PAGE_CATALOG = [
  {
    id: "home",
    href: "/",
    label: "IMMIFIN Home",
    description: "Open the regular IMMIFIN landing page after sign in.",
    icon: "home",
  },
  {
    id: "immigration-dashboard",
    href: "/dashboard",
    label: "Immigration Dashboard",
    description: "Go directly to your personalized immigration dashboard after sign in.",
    icon: "immigration-dashboard",
  },
  {
    id: "admin-dashboard",
    href: "/admin",
    label: "Admin Dashboard",
    description: "Open IMMIFIN administration and operations after sign in.",
    icon: "admin-dashboard",
  },
] as const;

export type StartPageDestinationId = (typeof START_PAGE_CATALOG)[number]["id"];
export type StartPageDestinationIcon = (typeof START_PAGE_CATALOG)[number]["icon"];

export type StartPageDestination = {
  id: StartPageDestinationId;
  href: string;
  label: string;
  description: string;
  icon: StartPageDestinationIcon;
};

export type StartPageAccessContext = {
  canAccessPersonalDashboard: boolean;
  isAdmin: boolean;
};

export function canCustomizeStartPage(tier: SubscriptionTier): boolean {
  return tier === "pro" || tier === "power";
}

export function buildStartPageAccessContext(input: {
  tier: SubscriptionTier;
  role: AppUserRole;
}): StartPageAccessContext {
  return {
    canAccessPersonalDashboard: canAccessPersonalDashboard(input.tier),
    isAdmin: isAdminRole(input.role),
  };
}

function isDestinationAvailable(
  id: StartPageDestinationId,
  context: StartPageAccessContext,
): boolean {
  if (id === "home") {
    return true;
  }
  if (id === "immigration-dashboard") {
    return context.canAccessPersonalDashboard;
  }
  if (id === "admin-dashboard") {
    // Same authority as `/admin`: isAdminRole(profiles.role) via requireAdmin.
    return context.isAdmin;
  }
  return false;
}

export function getAvailableStartPageDestinations(
  context: StartPageAccessContext,
): StartPageDestination[] {
  return START_PAGE_CATALOG.filter((destination) =>
    isDestinationAvailable(destination.id, context),
  ).map((destination) => ({ ...destination }));
}

export function isStartPageDestinationId(value: unknown): value is StartPageDestinationId {
  return START_PAGE_CATALOG.some((destination) => destination.id === value);
}

export function readStartPagePreference(
  preferences: Record<string, unknown> | null | undefined,
): StartPageDestinationId | null {
  const stored = preferences?.[START_PAGE_PREFERENCE_KEY];
  return isStartPageDestinationId(stored) ? stored : null;
}

export function resolveAuthorizedStartPage(
  stored: StartPageDestinationId | null,
  context: StartPageAccessContext,
): StartPageDestination {
  const available = getAvailableStartPageDestinations(context);
  return available.find((destination) => destination.id === stored) ?? available[0];
}

export function resolveAuthorizedStartPageHref(
  stored: StartPageDestinationId | null,
  context: StartPageAccessContext,
): string {
  return resolveAuthorizedStartPage(stored, context).href;
}
