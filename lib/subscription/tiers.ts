/**
 * Central subscription tier model.
 *
 * This is NOT billing. Real subscription storage is not provisioned yet.
 * Billing will later assign a tier; product code should use capabilities.
 *
 * See docs/BUSINESS_MODEL.md §12 Subscription Capability Architecture.
 */

export const SUBSCRIPTION_TIERS = ["free", "pro", "power"] as const;

/** Current tiers. Future: business, enterprise. */
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return value === "free" || value === "pro" || value === "power";
}

/**
 * Resolve the effective tier for UI capability checks.
 *
 * Priority:
 * 1. Dev-only override (development only — never production)
 * 2. Stored subscription tier when billing exists
 * 3. Default `pro` until billing ships (keeps production users unblocked)
 */
export function resolveSubscriptionTier(options: {
  storedTier?: SubscriptionTier | null;
  /** DEV ONLY — ignored unless NODE_ENV is development */
  devOverride?: SubscriptionTier | null;
}): SubscriptionTier {
  if (process.env.NODE_ENV === "development" && options.devOverride) {
    return options.devOverride;
  }

  // TODO(S4-billing): Connect real subscription tier from billing/storage.
  // Until then, default to pro so production signed-in users keep dashboard access.
  return options.storedTier ?? "pro";
}
