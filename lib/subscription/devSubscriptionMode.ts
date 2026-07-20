/**
 * Development Subscription Mode — temporary until Stripe checkout is wired in the UI.
 *
 * Server-authoritative only. Do not import from client components; use
 * `/api/account/subscription` `devSubscriptionMode` or a server-passed prop instead.
 *
 * Production hard stop: always disabled when `NODE_ENV === "production"`.
 * Development: enabled only when `IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE === "true"`.
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
