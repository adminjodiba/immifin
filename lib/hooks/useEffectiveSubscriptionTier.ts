"use client";

import { useCallback, useEffect, useState } from "react";
import {
  consumeDevTierQueryParam,
  isDevTierTestingEnabled,
  readDevTierFromStorage,
  writeDevTierToStorage,
} from "@/lib/subscription/devTier";
import { SUBSCRIPTION_TIER_EVENT, useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import { isDevSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";
import {
  resolveSubscriptionTier,
  type SubscriptionTier,
} from "@/lib/subscription/tiers";

const DEV_TIER_EVENT = "immifin:devTier";

function readDevOverride(devSubscriptionActive: boolean): SubscriptionTier | null {
  if (!isDevTierTestingEnabled() || devSubscriptionActive) {
    return null;
  }

  return readDevTierFromStorage();
}

function readEffectiveTier(
  storedTier: SubscriptionTier | null,
  devSubscriptionActive: boolean,
): SubscriptionTier {
  const devOverride = readDevOverride(devSubscriptionActive);
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
  const devSubscriptionActive =
    subscriptionContext?.devSubscriptionMode ?? isDevSubscriptionModeEnabled();

  const [tier, setTier] = useState<SubscriptionTier>(() =>
    resolveSubscriptionTier({ storedTier }),
  );

  const refresh = useCallback(() => {
    setTier(readEffectiveTier(storedTier, devSubscriptionActive));
  }, [storedTier, devSubscriptionActive]);

  useEffect(() => {
    if (isDevTierTestingEnabled() && !devSubscriptionActive) {
      consumeDevTierQueryParam();
    }

    refresh();

    function handleSubscriptionChange() {
      refresh();
    }

    window.addEventListener(SUBSCRIPTION_TIER_EVENT, handleSubscriptionChange);

    if (!isDevTierTestingEnabled() || devSubscriptionActive) {
      return () => {
        window.removeEventListener(SUBSCRIPTION_TIER_EVENT, handleSubscriptionChange);
      };
    }

    window.addEventListener(DEV_TIER_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(SUBSCRIPTION_TIER_EVENT, handleSubscriptionChange);
      window.removeEventListener(DEV_TIER_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh, devSubscriptionActive]);

  const setDevTier = useCallback((nextTier: SubscriptionTier) => {
    if (!isDevTierTestingEnabled() || devSubscriptionActive) {
      return;
    }

    writeDevTierToStorage(nextTier);
    window.dispatchEvent(new Event(DEV_TIER_EVENT));
  }, [devSubscriptionActive]);

  return {
    tier,
    setDevTier,
    isDevTesting: isDevTierTestingEnabled() && !devSubscriptionActive,
  };
}
