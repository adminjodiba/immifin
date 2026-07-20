import { AuthError } from "@/lib/auth/errors";
import { hasCapability, type SubscriptionCapability } from "@/lib/subscription/capabilities";
import { getStoredSubscriptionTier } from "@/lib/subscription/service";
import type { ProfileWithRelations } from "@/lib/supabase/types";

const CAPABILITY_DENIED_MESSAGES: Record<SubscriptionCapability, string> = {
  accessPersonalDashboard: "Personal Dashboard requires Pro.",
  accessSaveImmigrationProfile: "Saving your immigration profile requires Pro.",
  accessPriorityDateTracking: "Priority date tracking requires Pro.",
  accessAI: "AI features require Power.",
  accessMultipleProfiles: "Multiple profiles require Power.",
  accessEmailAlerts: "Email alerts require Pro.",
  accessNotifications: "Notification preferences require Pro.",
  accessVisaHistory: "Visa Bulletin History requires Pro.",
  accessMovementTracker: "Movement Tracker requires Pro.",
  accessAutoCalculatorPopulation: "Calculator autofill requires Pro.",
  accessFavorites: "Favorites are available in Pro.",
};

/**
 * Asserts the user has a capability. Uses getStoredSubscriptionTier only.
 */
export function assertCapability(
  profileWithRelations: ProfileWithRelations,
  capability: SubscriptionCapability,
): void {
  const tier = getStoredSubscriptionTier({
    profile: profileWithRelations.profile,
    subscription: profileWithRelations.subscription,
  });

  if (!hasCapability(tier, capability)) {
    throw new AuthError(CAPABILITY_DENIED_MESSAGES[capability], 403);
  }
}
