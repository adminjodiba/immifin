"use client";

import { NotificationPreferencesSection } from "@/components/profile/NotificationPreferencesSection";

/**
 * Notifications tab — preference/profile data entry for all signed-in users.
 * Automated email delivery remains gated by accessEmailAlerts.
 */
export function NotificationsProfilePage() {
  return <NotificationPreferencesSection />;
}
