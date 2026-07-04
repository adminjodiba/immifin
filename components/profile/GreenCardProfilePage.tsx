"use client";

import { GreenCardProfileSection } from "@/components/profile/GreenCardProfileSection";
import { LockedImmigrationProfileSection } from "@/components/profile/LockedImmigrationProfileSection";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { canAccessSaveImmigrationProfile } from "@/lib/subscription/capabilities";

export function GreenCardProfilePage() {
  const { tier } = useEffectiveSubscriptionTier();

  if (!canAccessSaveImmigrationProfile(tier)) {
    return <LockedImmigrationProfileSection />;
  }

  return <GreenCardProfileSection />;
}
