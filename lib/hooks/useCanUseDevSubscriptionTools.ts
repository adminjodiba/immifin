"use client";

import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";

/**
 * Client gate for Development Subscription Mode UI.
 *
 * Reads the server-authoritative `devSubscriptionMode` flag from subscription context
 * (populated by GET `/api/account/subscription`). Unsigned pages that need the flag
 * before sign-in should pass a server-derived prop into their client components.
 */
export function useCanUseDevSubscriptionTools(): {
  canUse: boolean;
  isLoading: boolean;
} {
  const subscriptionContext = useSubscriptionTierContext();

  return {
    canUse: subscriptionContext?.devSubscriptionMode ?? false,
    isLoading: subscriptionContext?.isLoading ?? false,
  };
}
