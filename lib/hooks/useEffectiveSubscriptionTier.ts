"use client";

import { useCallback, useEffect, useState } from "react";
import {
  consumeDevTierQueryParam,
  isDevTierTestingEnabled,
  readDevTierFromStorage,
  writeDevTierToStorage,
} from "@/lib/subscription/devTier";
import {
  resolveSubscriptionTier,
  type SubscriptionTier,
} from "@/lib/subscription/tiers";

const DEV_TIER_EVENT = "immifin:devTier";

function readEffectiveTier(storedTier: SubscriptionTier | null): SubscriptionTier {
  const devOverride = isDevTierTestingEnabled() ? readDevTierFromStorage() : null;
  return resolveSubscriptionTier({ storedTier, devOverride });
}

/**
 * Effective subscription tier for UI capability checks.
 *
 * Development only:
 * - `?devTier=free|pro|power` (persisted to localStorage)
 * - localStorage key `immifin:devTier`
 * - DevTierSwitcher control
 *
 * Not billing. Production resolves without override (defaults to free until billing).
 */
export function useEffectiveSubscriptionTier(storedTier: SubscriptionTier | null = null): {
  tier: SubscriptionTier;
  setDevTier: (tier: SubscriptionTier) => void;
  isDevTesting: boolean;
} {
  const [tier, setTier] = useState<SubscriptionTier>(() =>
    resolveSubscriptionTier({ storedTier }),
  );

  const refresh = useCallback(() => {
    setTier(readEffectiveTier(storedTier));
  }, [storedTier]);

  useEffect(() => {
    if (isDevTierTestingEnabled()) {
      consumeDevTierQueryParam();
    }

    refresh();

    if (!isDevTierTestingEnabled()) {
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
    if (!isDevTierTestingEnabled()) {
      return;
    }

    writeDevTierToStorage(nextTier);
    window.dispatchEvent(new Event(DEV_TIER_EVENT));
  }, []);

  return {
    tier,
    setDevTier,
    isDevTesting: isDevTierTestingEnabled(),
  };
}
