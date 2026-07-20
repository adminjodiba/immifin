"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isDevTierTestingEnabled,
  writeDevTierToStorage,
} from "@/lib/subscription/devTier";
import { SUBSCRIPTION_TIER_EVENT, useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import {
  resolveSubscriptionTier,
  type SubscriptionTier,
} from "@/lib/subscription/tiers";

const DEV_TIER_EVENT = "immifin:devTier";

function readEffectiveTier(storedTier: SubscriptionTier | null): SubscriptionTier {
  return resolveSubscriptionTier({ storedTier, devOverride: null });
}

/**
 * Effective subscription tier for UI capability checks.
 *
 * Priority:
 * 1. Persisted subscription plan (Development Subscription Mode / Stripe)
 * 2. Default free
 */
export function useEffectiveSubscriptionTier(storedTierProp: SubscriptionTier | null = null): {
  tier: SubscriptionTier;
  setDevTier: (tier: SubscriptionTier) => void;
  isDevTesting: boolean;
} {
  const subscriptionContext = useSubscriptionTierContext();
  const storedTier = subscriptionContext?.storedTier ?? storedTierProp;
  const devSubscriptionMode = subscriptionContext?.devSubscriptionMode ?? false;

  const [tier, setTier] = useState<SubscriptionTier>(() =>
    resolveSubscriptionTier({ storedTier }),
  );

  const refresh = useCallback(() => {
    setTier(readEffectiveTier(storedTier));
  }, [storedTier]);

  useEffect(() => {
    refresh();

    function handleSubscriptionChange() {
      refresh();
    }

    window.addEventListener(SUBSCRIPTION_TIER_EVENT, handleSubscriptionChange);

    return () => {
      window.removeEventListener(SUBSCRIPTION_TIER_EVENT, handleSubscriptionChange);
    };
  }, [refresh]);

  const setDevTier = useCallback((nextTier: SubscriptionTier) => {
    if (!isDevTierTestingEnabled() || !devSubscriptionMode) {
      return;
    }

    writeDevTierToStorage(nextTier);
    window.dispatchEvent(new Event(DEV_TIER_EVENT));
  }, [devSubscriptionMode]);

  return {
    tier,
    setDevTier,
    isDevTesting: false,
  };
}
