/**
 * Development Subscription Mode — environment flag only.
 *
 * Server-authoritative only. Do not import from client components; use
 * `/api/account/subscription` `devSubscriptionMode` or
 * `canUseDevSubscriptionTools(userId)` from `devSubscriptionAccess.ts`.
 *
 * Production hard stop: always disabled when `NODE_ENV === "production"`.
 * Development: flag on only when `IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE === "true"`.
 *
 * User eligibility additionally requires `IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID`
 * to match the authenticated Clerk user ID — see `devSubscriptionAccess.ts`.
 */

export function isDevelopmentSubscriptionModeEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE === "true";
}

/** @deprecated Prefer `isDevelopmentSubscriptionModeEnabled` */
export function isDevSubscriptionModeEnabled(): boolean {
  return isDevelopmentSubscriptionModeEnabled();
}
