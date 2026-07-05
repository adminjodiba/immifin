"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/nextjs";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import { isDevSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

const SUBSCRIPTION_TIER_EVENT = "immifin:subscriptionTier";

type SubscriptionApiResponse = {
  tier: SubscriptionTier;
  plan: string;
  devSubscriptionMode: boolean;
};

type SubscriptionTierContextValue = {
  storedTier: SubscriptionTier | null;
  isLoading: boolean;
  isSignedIn: boolean;
  devSubscriptionMode: boolean;
  refreshStoredTier: () => Promise<SubscriptionTier | null>;
  updateSubscriptionPlan: (tier: SubscriptionTier) => Promise<SubscriptionTier>;
};

const SubscriptionTierContext = createContext<SubscriptionTierContextValue | null>(null);

async function fetchStoredTier(): Promise<SubscriptionTier | null> {
  const response = await fetch("/api/account/subscription", {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load subscription plan.");
  }

  const body = await readJsonResponseBody<SubscriptionApiResponse>(response);
  if (!body.ok) {
    throw new Error(body.error);
  }

  return body.data.tier;
}

export function SubscriptionTierProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [storedTier, setStoredTier] = useState<SubscriptionTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStoredTier = useCallback(async (): Promise<SubscriptionTier | null> => {
    if (!isSignedIn) {
      setStoredTier(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
      const tier = await fetchStoredTier();
      setStoredTier(tier);
      return tier;
    } catch {
      setStoredTier(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    void refreshStoredTier();
  }, [isLoaded, isSignedIn, refreshStoredTier]);

  useEffect(() => {
    const handleRefresh = () => {
      void refreshStoredTier();
    };

    window.addEventListener(SUBSCRIPTION_TIER_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(SUBSCRIPTION_TIER_EVENT, handleRefresh);
    };
  }, [refreshStoredTier]);

  const updateSubscriptionPlan = useCallback(
    async (tier: SubscriptionTier): Promise<SubscriptionTier> => {
      const response = await fetch("/api/account/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tier }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to update subscription plan.");
      }

      const body = await readJsonResponseBody<SubscriptionApiResponse>(response);
      if (!body.ok) {
        throw new Error(body.error);
      }

      setStoredTier(body.data.tier);
      window.dispatchEvent(new Event(SUBSCRIPTION_TIER_EVENT));
      return body.data.tier;
    },
    [],
  );

  const value = useMemo<SubscriptionTierContextValue>(
    () => ({
      storedTier,
      isLoading,
      isSignedIn: Boolean(isSignedIn),
      devSubscriptionMode: isDevSubscriptionModeEnabled(),
      refreshStoredTier,
      updateSubscriptionPlan,
    }),
    [storedTier, isLoading, isSignedIn, refreshStoredTier, updateSubscriptionPlan],
  );

  return (
    <SubscriptionTierContext.Provider value={value}>{children}</SubscriptionTierContext.Provider>
  );
}

export function useSubscriptionTierContext(): SubscriptionTierContextValue | null {
  return useContext(SubscriptionTierContext);
}

export { SUBSCRIPTION_TIER_EVENT };
