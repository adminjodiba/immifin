import { isDevelopmentSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";

/**
 * Whether development-only subscription plan mutations are permitted.
 *
 * Controlled by `IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE` in development.
 * Always false in production regardless of environment configuration.
 */
export function canUseDevSubscriptionTools(): boolean {
  return isDevelopmentSubscriptionModeEnabled();
}
