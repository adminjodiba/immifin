"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import type { ImmigrationProfile } from "@/lib/supabase/types";

export type ImmigrationProfileDefaults = {
  category: string | null;
  countryChargeability: string | null;
  bulletinType: string | null;
  priorityDate: string | null;
  greenCardIssueDate: string | null;
  marriedToUSCitizen: boolean | null;
};

const PROFILE_COUNTRY_TO_CHARGEABILITY: Record<string, string> = {
  India: "india",
  China: "china",
  Mexico: "mexico",
  Philippines: "philippines",
  ROW: "all",
};

function mapImmigrationProfileToDefaults(
  profile: ImmigrationProfile | null,
): ImmigrationProfileDefaults | null {
  if (!profile) {
    return null;
  }

  return {
    category: profile.default_category,
    countryChargeability: profile.default_country
      ? (PROFILE_COUNTRY_TO_CHARGEABILITY[profile.default_country] ?? null)
      : null,
    bulletinType: profile.default_bulletin_type,
    priorityDate: profile.priority_date,
    greenCardIssueDate: profile.green_card_issue_date,
    marriedToUSCitizen: profile.married_to_us_citizen,
  };
}

export function useImmigrationProfileDefaults() {
  const { isLoaded, isSignedIn } = useAuth();
  const [defaults, setDefaults] = useState<ImmigrationProfileDefaults | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setDefaults(null);
      setLoaded(true);
      return;
    }

    let cancelled = false;

    async function loadDefaults() {
      try {
        const response = await fetch("/api/account/me");

        if (response.status === 401) {
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          immigrationProfile?: ImmigrationProfile | null;
        };

        if (!cancelled) {
          setDefaults(mapImmigrationProfileToDefaults(data.immigrationProfile ?? null));
        }
      } catch {
        // Ignore profile load failures; calculators keep their empty defaults.
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void loadDefaults();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return { defaults, loaded };
}
