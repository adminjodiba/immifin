import {
  isSubscriptionTier,
  type SubscriptionTier,
} from "@/lib/subscription/tiers";

/**
 * DEV ONLY subscription tier override for local UI testing.
 *
 * Not billing. Not production authorization.
 * Safe to remove when real subscription storage ships.
 */

export const DEV_TIER_STORAGE_KEY = "immifin:devTier";
export const DEV_TIER_QUERY_PARAM = "devTier";

export function isDevTierTestingEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}

export function parseSubscriptionTier(value: string | null | undefined): SubscriptionTier | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return isSubscriptionTier(normalized) ? normalized : null;
}

export function readDevTierFromStorage(): SubscriptionTier | null {
  if (!isDevTierTestingEnabled() || typeof window === "undefined") {
    return null;
  }

  try {
    return parseSubscriptionTier(window.localStorage.getItem(DEV_TIER_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeDevTierToStorage(tier: SubscriptionTier | null): void {
  if (!isDevTierTestingEnabled() || typeof window === "undefined") {
    return;
  }

  try {
    if (tier) {
      window.localStorage.setItem(DEV_TIER_STORAGE_KEY, tier);
    } else {
      window.localStorage.removeItem(DEV_TIER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures in private browsing.
  }
}

/**
 * Apply `?devTier=free|pro|power` once, persist to localStorage, and strip the param.
 */
export function consumeDevTierQueryParam(): SubscriptionTier | null {
  if (!isDevTierTestingEnabled() || typeof window === "undefined") {
    return null;
  }

  const url = new URL(window.location.href);
  const fromQuery = parseSubscriptionTier(url.searchParams.get(DEV_TIER_QUERY_PARAM));

  if (!fromQuery) {
    return null;
  }

  writeDevTierToStorage(fromQuery);
  url.searchParams.delete(DEV_TIER_QUERY_PARAM);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

  return fromQuery;
}
