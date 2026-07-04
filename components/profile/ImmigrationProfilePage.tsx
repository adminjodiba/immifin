"use client";

import { ImmigrationProfileSection } from "@/components/profile/ImmigrationProfileSection";
import { LockedImmigrationProfileSection } from "@/components/profile/LockedImmigrationProfileSection";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { canAccessSaveImmigrationProfile } from "@/lib/subscription/capabilities";

export function ImmigrationProfilePage() {
  const { tier } = useEffectiveSubscriptionTier();

  if (!canAccessSaveImmigrationProfile(tier)) {
    return <LockedImmigrationProfileSection />;
  }

  return <ImmigrationProfileSection />;
}
