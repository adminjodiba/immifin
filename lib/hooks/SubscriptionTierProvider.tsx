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
    hasPaidStripeSubscription?: boolean;
  } | null;
};

type SubscriptionState = {
  tier: SubscriptionTier | null;
  billingInterval: SubscriptionBillingInterval | null;
  hasPaidStripeSubscription: boolean;
  devSubscriptionMode: boolean;
};

type SubscriptionTierContextValue = {
  storedTier: SubscriptionTier | null;
  billingInterval: SubscriptionBillingInterval | null;
  hasPaidStripeSubscription: boolean;
  isLoading: boolean;
  isSignedIn: boolean;
  devSubscriptionMode: boolean;
  refreshStoredTier: () => Promise<SubscriptionTier | null>;
  updateSubscriptionPlan: (tier: SubscriptionTier) => Promise<SubscriptionTier>;
};

const SubscriptionTierContext = createContext<SubscriptionTierContextValue | null>(null);

async function fetchSubscriptionState(): Promise<SubscriptionState> {
  // Cache-bust query + no-store: post-Checkout activation must not reuse a stale Free response.
  const response = await fetch(`/api/account/subscription?_ts=${Date.now()}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (response.status === 401) {
    return {
      tier: null,
      billingInterval: null,
      hasPaidStripeSubscription: false,
      devSubscriptionMode: false,
    };
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
    hasPaidStripeSubscription: Boolean(body.data.billing?.hasPaidStripeSubscription),
    devSubscriptionMode: body.data.devSubscriptionMode,
  };
}

export function SubscriptionTierProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [storedTier, setStoredTier] = useState<SubscriptionTier | null>(null);
  const [billingInterval, setBillingInterval] = useState<SubscriptionBillingInterval | null>(null);
  const [hasPaidStripeSubscription, setHasPaidStripeSubscription] = useState(false);
  const [devSubscriptionMode, setDevSubscriptionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStoredTier = useCallback(async (): Promise<SubscriptionTier | null> => {
    // S7-BILLING-UX-008A: while Clerk is still loading, do not treat the session as
    // signed-out and do not clear last-known entitlement (post-Checkout race).
    if (!isLoaded) {
      return null;
    }

    if (!isSignedIn) {
      setStoredTier(null);
      setBillingInterval(null);
      setHasPaidStripeSubscription(false);
      setDevSubscriptionMode(false);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);

    try {
      const state = await fetchSubscriptionState();
      setStoredTier(state.tier);
      setBillingInterval(state.billingInterval);
      setHasPaidStripeSubscription(state.hasPaidStripeSubscription);
      setDevSubscriptionMode(state.devSubscriptionMode);
      return state.tier;
    } catch {
      // Preserve last-known tier on transient API failures so activation polling
      // is not reset to Free mid-flight. Caller may retry.
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

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
      setHasPaidStripeSubscription(Boolean(body.data.billing?.hasPaidStripeSubscription));
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
      hasPaidStripeSubscription,
      isLoading,
      isSignedIn: Boolean(isSignedIn),
      devSubscriptionMode,
      refreshStoredTier,
      updateSubscriptionPlan,
    }),
    [
      storedTier,
      billingInterval,
      hasPaidStripeSubscription,
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
