import type { AppPlan, AppUserRole } from "@/lib/supabase/types";

export type { AppPlan, AppUserRole };

export const APP_ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const satisfies Record<string, AppUserRole>;

export const APP_PLANS = {
  FREE: "free",
  BASIC: "basic",
  PRO: "pro",
} as const satisfies Record<string, AppPlan>;

/**
 * Authoritative IMMIFIN admin check.
 * Used by `requireAdmin` (`/admin` + admin APIs) and Personalization destinations.
 * Do not add a second admin definition (plan, email, client metadata, etc.).
 */
export function isAdminRole(role: AppUserRole): boolean {
  return role === APP_ROLES.ADMIN;
}

export function isActiveProfileStatus(status: string): boolean {
  return status === "active";
}
