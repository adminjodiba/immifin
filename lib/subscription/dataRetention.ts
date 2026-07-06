/**
 * Subscription downgrade / cancellation data policy.
 *
 * When a user moves to Free (basic), capability gates must update immediately,
 * but persisted profile data is retained so it is available again on upgrade.
 *
 * Never delete on downgrade:
 * - Favorites (immigration_profiles.preferences.favorites)
 * - Notification preferences
 * - Immigration profile fields (category, country, priority date, etc.)
 * - Contact phone number
 */

export const SUBSCRIPTION_DATA_RETENTION_NOTE =
  "Profile data and favorites are preserved when a plan changes. Only feature access is gated by tier.";
