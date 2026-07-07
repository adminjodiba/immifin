import { isAdminRole } from "@/lib/auth/roles";
import type { AppUserRole } from "@/lib/supabase/types";
import { isDevSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";

/**
 * Whether the user may activate Free / Pro / Power without Stripe.
 *
 * Enabled globally via `NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE`, or for admin
 * profiles so founders can test tier-gated product behavior.
 */
export function canUseDevSubscriptionTools(role?: AppUserRole | null): boolean {
  if (isDevSubscriptionModeEnabled()) {
    return true;
  }

  return role != null && isAdminRole(role);
}
