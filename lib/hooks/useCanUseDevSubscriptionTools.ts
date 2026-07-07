"use client";

import { useIsAdminRole } from "@/lib/hooks/useIsAdminRole";
import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import { isDevSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";

/**
 * Client gate for Development Subscription Mode UI (pricing, profile tab, panel).
 */
export function useCanUseDevSubscriptionTools(): {
  canUse: boolean;
  isLoading: boolean;
} {
  const subscriptionContext = useSubscriptionTierContext();
  const { isAdmin, isLoading: adminLoading } = useIsAdminRole();

  if (isDevSubscriptionModeEnabled()) {
    return { canUse: true, isLoading: false };
  }

  if (subscriptionContext?.devSubscriptionMode) {
    return { canUse: true, isLoading: false };
  }

  if (!adminLoading && isAdmin) {
    return { canUse: true, isLoading: false };
  }

  if (adminLoading || (subscriptionContext?.isLoading ?? false)) {
    return { canUse: false, isLoading: true };
  }

  return { canUse: false, isLoading: false };
}
