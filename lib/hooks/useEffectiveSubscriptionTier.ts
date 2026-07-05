"use client";

import { useCallback, useEffect, useState } from "react";
import {
  consumeDevTierQueryParam,
  isDevTierTestingEnabled,
  readDevTierFromStorage,
  writeDevTierToStorage,
} from "@/lib/subscription/devTier";
import { isDevSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";
import {
  resolveSubscriptionTier,
  type SubscriptionTier,
} from "@/lib/subscription/tiers";
import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";

const DEV_TIER_EVENT = "immifin:devTier";

function readDevOverride(): SubscriptionTier | null {
  if (!isDevTierTestingEnabled() || isDevSubscriptionModeEnabled()) {
    return null;
  }

  return readDevTierFromStorage();
}

function readEffectiveTier(storedTier: SubscriptionTier | null): SubscriptionTier {
  const devOverride = readDevOverride();
  return resolveSubscriptionTier({ storedTier, devOverride });
}

/**
 * Effective subscription tier for UI capability checks.
 *
 * Priority:
 * 1. Persisted subscription plan (Development Subscription Mode / future Stripe)
 * 2. Dev-only localStorage override (legacy local UI testing when dev mode off)
 * 3. Default free
 */
export function useEffectiveSubscriptionTier(storedTierProp: SubscriptionTier | null = null): {
  tier: SubscriptionTier;
  setDevTier: (tier: SubscriptionTier) => void;
  isDevTesting: boolean;
} {
  const subscriptionContext = useSubscriptionTierContext();
  const storedTier = subscriptionContext?.storedTier ?? storedTierProp;

  const [tier, setTier] = useState<SubscriptionTier>(() =>
    resolveSubscriptionTier({ storedTier }),
  );

  const refresh = useCallback(() => {
    setTier(readEffectiveTier(storedTier));
  }, [storedTier]);

  useEffect(() => {
    if (isDevTierTestingEnabled() && !isDevSubscriptionModeEnabled()) {
      consumeDevTierQueryParam();
    }

    refresh();

    if (!isDevTierTestingEnabled() || isDevSubscriptionModeEnabled()) {
      return;
    }

    window.addEventListener(DEV_TIER_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(DEV_TIER_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const setDevTier = useCallback((nextTier: SubscriptionTier) => {
    if (!isDevTierTestingEnabled() || isDevSubscriptionModeEnabled()) {
      return;
    }

    writeDevTierToStorage(nextTier);
    window.dispatchEvent(new Event(DEV_TIER_EVENT));
  }, []);

  return {
    tier,
    setDevTier,
    isDevTesting: isDevTierTestingEnabled() && !isDevSubscriptionModeEnabled(),
  };
}
