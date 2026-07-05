/**
 * Development Subscription Mode — temporary until Stripe integration.
 *
 * When enabled, users can activate Free / Pro / Power without payment.
 * Both the Pricing page and Account panels update the same subscription plan
 * field that future Stripe webhooks will write to.
 */

export function isDevSubscriptionModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_SUBSCRIPTION_MODE === "true";
}
