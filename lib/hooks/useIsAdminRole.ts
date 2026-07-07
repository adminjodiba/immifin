"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { isAdminRole } from "@/lib/auth/roles";
import type { AppUserRole } from "@/lib/supabase/types";

/**
 * Whether the signed-in user has `profiles.role = admin`.
 * Non-admins and signed-out visitors always get `isAdmin: false`.
 */
export function useIsAdminRole(): { isAdmin: boolean; isLoading: boolean } {
  const { isLoaded, isSignedIn } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRole() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/account/me", { cache: "no-store" });

        if (!response.ok) {
          if (!cancelled) {
            setIsAdmin(false);
          }
          return;
        }

        const data = (await response.json()) as { profile?: { role?: AppUserRole } };

        if (!cancelled) {
          setIsAdmin(isAdminRole(data.profile?.role ?? "user"));
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRole();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return { isAdmin, isLoading };
}
