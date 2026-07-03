"use client";

import { LockedNotificationsSection } from "@/components/profile/LockedNotificationsSection";
import { NotificationPreferencesSection } from "@/components/profile/NotificationPreferencesSection";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { canAccessNotifications } from "@/lib/subscription/capabilities";

/**
 * Notifications tab content — gated by accessNotifications capability.
 * Free: locked Pro preview. Pro/Power: full preferences editor.
 */
export function NotificationsProfilePage() {
  const { tier } = useEffectiveSubscriptionTier();

  if (!canAccessNotifications(tier)) {
    return <LockedNotificationsSection />;
  }

  return <NotificationPreferencesSection />;
}
