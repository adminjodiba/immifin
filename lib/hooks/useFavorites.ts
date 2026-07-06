"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import type { FavoritePage } from "@/lib/account/favorites";
import { normalizeFavoriteHref } from "@/lib/account/favorites";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import { SUBSCRIPTION_TIER_EVENT } from "@/lib/hooks/SubscriptionTierProvider";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { canAccessFavorites } from "@/lib/subscription/capabilities";

const FAVORITES_KEY = "/api/account/favorites";

type FavoritesResponse = {
  favorites: FavoritePage[];
  accessLocked: boolean;
};

async function fetchFavorites(): Promise<FavoritesResponse> {
  const response = await fetch(FAVORITES_KEY, { cache: "no-store" });
  if (response.status === 401) {
    return { favorites: [], accessLocked: true };
  }

  const body = await readJsonResponseBody<FavoritesResponse>(response);
  if (!body.ok) {
    throw new Error(body.error);
  }

  return body.data;
}

export function useFavorites() {
  const { isLoaded, isSignedIn } = useAuth();
  const { tier } = useEffectiveSubscriptionTier();
  const canManageFavorites = isLoaded && isSignedIn && canAccessFavorites(tier);

  const { data, error, isLoading, mutate } = useSWR<FavoritesResponse>(
    isLoaded && isSignedIn ? FAVORITES_KEY : null,
    fetchFavorites,
    { revalidateOnFocus: true },
  );

  const favorites = data?.favorites ?? [];
  const accessLocked = data?.accessLocked ?? (isSignedIn ? !canAccessFavorites(tier) : true);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    function handleSubscriptionChange() {
      void mutate();
    }

    window.addEventListener(SUBSCRIPTION_TIER_EVENT, handleSubscriptionChange);
    return () => window.removeEventListener(SUBSCRIPTION_TIER_EVENT, handleSubscriptionChange);
  }, [isSignedIn, mutate]);

  useEffect(() => {
    if (isSignedIn) {
      void mutate();
    }
  }, [tier, isSignedIn, mutate]);

  const isFavorite = useCallback(
    (href: string) => favorites.some((item) => item.href === normalizeFavoriteHref(href)),
    [favorites],
  );

  const addFavorite = useCallback(
    async (input: { href: string; label: string }) => {
      const response = await fetch(FAVORITES_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const body = await readJsonResponseBody<FavoritesResponse>(response);
      if (!body.ok) {
        if (response.status === 409) {
          return { ok: false as const, reason: "limit" as const };
        }
        throw new Error(body.error);
      }

      await mutate(body.data, false);
      return { ok: true as const };
    },
    [mutate],
  );

  const removeFavorite = useCallback(
    async (href: string) => {
      const response = await fetch(FAVORITES_KEY, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ href, label: "remove" }),
      });

      const body = await readJsonResponseBody<FavoritesResponse>(response);
      if (!body.ok) {
        throw new Error(body.error);
      }

      await mutate(body.data, false);
      return { ok: true as const };
    },
    [mutate],
  );

  const toggleFavorite = useCallback(
    async (input: { href: string; label: string }) => {
      if (!canManageFavorites || accessLocked) {
        return { ok: false as const, reason: "locked" as const };
      }

      if (isFavorite(input.href)) {
        await removeFavorite(input.href);
        return { ok: true as const, action: "removed" as const };
      }

      const result = await addFavorite(input);
      if (!result.ok) {
        return result;
      }

      return { ok: true as const, action: "added" as const };
    },
    [accessLocked, addFavorite, canManageFavorites, isFavorite, removeFavorite],
  );

  return {
    favorites,
    /** @deprecated use canManageFavorites */
    favoritesEnabled: canManageFavorites,
    canManageFavorites,
    accessLocked,
    isLoading: Boolean(isSignedIn && isLoading),
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refreshFavorites: mutate,
  };
}

export function useFavoriteHref(explicitHref?: string): string {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    setHash(window.location.hash);

    function handleHashChange() {
      setHash(window.location.hash);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [pathname]);

  if (explicitHref) {
    return normalizeFavoriteHref(explicitHref);
  }

  return normalizeFavoriteHref(`${pathname}${hash}`);
}
