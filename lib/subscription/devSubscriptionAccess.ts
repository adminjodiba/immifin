import { isDevelopmentSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";

/**
 * Development Subscription Mode access — server-only.
 *
 * Eligible only when:
 * - runtime is not production
 * - IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE === "true"
 * - IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID is configured (non-empty after trim)
 * - authenticated Clerk user ID exactly matches the configured ID
 *
 * Never log or return the configured test user ID.
 * Do not import this module from client components.
 */

export type DevelopmentSubscriptionModeReason =
  | "allowed"
  | "production"
  | "mode_disabled"
  | "test_user_not_configured"
  | "user_not_designated"
  | "user_missing";

export type DevelopmentSubscriptionModeAccess = {
  /** Mode flag is on in a non-production runtime (user may still be ineligible). */
  enabled: boolean;
  /** Authenticated user may use Dev Subscription Mode plan simulation. */
  eligible: boolean;
  reason: DevelopmentSubscriptionModeReason;
};

export type DevelopmentSubscriptionModeEnv = {
  NODE_ENV?: string;
  IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE?: string;
  IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID?: string;
};

/**
 * Normalize configured Clerk user ID. Empty / whitespace-only → not configured.
 * Does not log the value.
 */
export function resolveConfiguredDevSubscriptionTestUserId(
  raw: string | undefined,
): string | null {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
}

export function getDevelopmentSubscriptionModeAccessForEnv(
  userId: string | null | undefined,
  env: DevelopmentSubscriptionModeEnv,
): DevelopmentSubscriptionModeAccess {
  if (env.NODE_ENV === "production") {
    return { enabled: false, eligible: false, reason: "production" };
  }

  const modeEnabled = env.IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE === "true";
  if (!modeEnabled) {
    return { enabled: false, eligible: false, reason: "mode_disabled" };
  }

  const configuredId = resolveConfiguredDevSubscriptionTestUserId(
    env.IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID,
  );
  if (!configuredId) {
    return { enabled: true, eligible: false, reason: "test_user_not_configured" };
  }

  const authenticatedId = typeof userId === "string" ? userId.trim() : "";
  if (!authenticatedId) {
    return { enabled: true, eligible: false, reason: "user_missing" };
  }

  if (authenticatedId !== configuredId) {
    return { enabled: true, eligible: false, reason: "user_not_designated" };
  }

  return { enabled: true, eligible: true, reason: "allowed" };
}

export function getDevelopmentSubscriptionModeAccess(
  userId: string | null | undefined,
): DevelopmentSubscriptionModeAccess {
  return getDevelopmentSubscriptionModeAccessForEnv(userId, {
    NODE_ENV: process.env.NODE_ENV,
    IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE:
      process.env.IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE,
    IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID: process.env.IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID,
  });
}

/**
 * Whether the authenticated Clerk user may use development plan simulation.
 * Always false in production. Always false when test user is missing/mismatched.
 */
export function canUseDevSubscriptionTools(userId: string | null | undefined): boolean {
  return getDevelopmentSubscriptionModeAccess(userId).eligible;
}

/**
 * Mode flag only (non-production + enable env). Does not grant user eligibility.
 * Prefer `canUseDevSubscriptionTools(userId)` for authorization.
 */
export function isDevSubscriptionModeFlagEnabled(): boolean {
  return isDevelopmentSubscriptionModeEnabled();
}
