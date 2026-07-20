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
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import type { SubscriptionBillingInterval } from "@/lib/supabase/types";

const SUBSCRIPTION_TIER_EVENT = "immifin:subscriptionTier";

type SubscriptionApiResponse = {
  tier: SubscriptionTier;
  plan: string;
  devSubscriptionMode: boolean;
  billing?: {
    billingInterval?: SubscriptionBillingInterval | null;
  } | null;
};

type SubscriptionState = {
  tier: SubscriptionTier | null;
  billingInterval: SubscriptionBillingInterval | null;
  devSubscriptionMode: boolean;
};

type SubscriptionTierContextValue = {
  storedTier: SubscriptionTier | null;
  billingInterval: SubscriptionBillingInterval | null;
  isLoading: boolean;
  isSignedIn: boolean;
  devSubscriptionMode: boolean;
  refreshStoredTier: () => Promise<SubscriptionTier | null>;
  updateSubscriptionPlan: (tier: SubscriptionTier) => Promise<SubscriptionTier>;
};

const SubscriptionTierContext = createContext<SubscriptionTierContextValue | null>(null);

async function fetchSubscriptionState(): Promise<SubscriptionState> {
  const response = await fetch("/api/account/subscription", {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 401) {
    return { tier: null, billingInterval: null, devSubscriptionMode: false };
  }

  if (!response.ok) {
    throw new Error("Failed to load subscription plan.");
  }

  const body = await readJsonResponseBody<SubscriptionApiResponse>(response);
  if (!body.ok) {
    throw new Error(body.error);
  }

  const billingInterval = body.data.billing?.billingInterval ?? null;

  return {
    tier: body.data.tier,
    billingInterval: billingInterval === "month" || billingInterval === "year" ? billingInterval : null,
    devSubscriptionMode: body.data.devSubscriptionMode,
  };
}

export function SubscriptionTierProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [storedTier, setStoredTier] = useState<SubscriptionTier | null>(null);
  const [billingInterval, setBillingInterval] = useState<SubscriptionBillingInterval | null>(null);
  const [devSubscriptionMode, setDevSubscriptionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStoredTier = useCallback(async (): Promise<SubscriptionTier | null> => {
    if (!isSignedIn) {
      setStoredTier(null);
      setBillingInterval(null);
      setDevSubscriptionMode(false);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
      const state = await fetchSubscriptionState();
      setStoredTier(state.tier);
      setBillingInterval(state.billingInterval);
      setDevSubscriptionMode(state.devSubscriptionMode);
      return state.tier;
    } catch {
      setStoredTier(null);
      setBillingInterval(null);
      setDevSubscriptionMode(false);
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
      setBillingInterval(body.data.billing?.billingInterval ?? null);
      setDevSubscriptionMode(body.data.devSubscriptionMode);
      window.dispatchEvent(new Event(SUBSCRIPTION_TIER_EVENT));
      return body.data.tier;
    },
    [],
  );

  const value = useMemo<SubscriptionTierContextValue>(
    () => ({
      storedTier,
      billingInterval,
      isLoading,
      isSignedIn: Boolean(isSignedIn),
      devSubscriptionMode,
      refreshStoredTier,
      updateSubscriptionPlan,
    }),
    [
      storedTier,
      billingInterval,
      isLoading,
      isSignedIn,
      devSubscriptionMode,
      refreshStoredTier,
      updateSubscriptionPlan,
    ],
  );

  return (
    <SubscriptionTierContext.Provider value={value}>{children}</SubscriptionTierContext.Provider>
  );
}

export function useSubscriptionTierContext(): SubscriptionTierContextValue | null {
  return useContext(SubscriptionTierContext);
}

export { SUBSCRIPTION_TIER_EVENT };
