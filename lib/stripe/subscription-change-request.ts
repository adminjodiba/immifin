import { StripeSubscriptionChangeError } from "@/lib/stripe/errors";
import type { BillingInterval } from "@/lib/stripe/types";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

export const SUBSCRIPTION_CHANGE_INTERVALS = ["monthly", "annual"] as const;

export type SubscriptionChangeInterval = (typeof SUBSCRIPTION_CHANGE_INTERVALS)[number];

function subscriptionChangeIntervalToBillingInterval(
  interval: SubscriptionChangeInterval,
): BillingInterval {
  return interval === "monthly" ? "month" : "year";
}

const ALLOWED_BODY_KEYS = new Set(["targetTier", "targetInterval"]);

const FORBIDDEN_BODY_KEYS = [
  "priceId",
  "price_id",
  "customerId",
  "customer_id",
  "subscriptionId",
  "subscription_id",
  "currentTier",
  "current_tier",
  "currentInterval",
  "current_interval",
  "prorationBehavior",
  "proration_behavior",
  "effectiveDate",
  "effective_date",
  "successUrl",
  "success_url",
  "cancelUrl",
  "cancel_url",
  "userId",
  "user_id",
  "clerkUserId",
  "clerk_user_id",
  "plan",
  "status",
  "tier",
  "interval",
] as const;

export type ParsedSubscriptionChangeRequest = {
  targetTier: SubscriptionTier;
  targetInterval: SubscriptionChangeInterval | null;
  targetBillingInterval: BillingInterval | null;
};

function isSubscriptionChangeInterval(value: unknown): value is SubscriptionChangeInterval {
  return value === "monthly" || value === "annual";
}

function isTargetTier(value: unknown): value is SubscriptionTier {
  return value === "free" || value === "pro" || value === "power";
}

/**
 * Validates the paid subscription change request body.
 * Accepts only targetTier + targetInterval — never Stripe identifiers or policy fields.
 */
export function parseSubscriptionChangeRequest(body: unknown): ParsedSubscriptionChangeRequest {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    throw new StripeSubscriptionChangeError("Invalid request body.");
  }

  const record = body as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    if (!ALLOWED_BODY_KEYS.has(key)) {
      throw new StripeSubscriptionChangeError(`Unexpected field: ${key}`);
    }
  }

  for (const forbiddenKey of FORBIDDEN_BODY_KEYS) {
    if (forbiddenKey in record) {
      throw new StripeSubscriptionChangeError(`Field is not allowed: ${forbiddenKey}`);
    }
  }

  if (typeof record.targetTier !== "string") {
    throw new StripeSubscriptionChangeError("targetTier is required.");
  }

  const targetTier = record.targetTier.trim().toLowerCase();

  if (!isTargetTier(targetTier)) {
    throw new StripeSubscriptionChangeError("Invalid targetTier. Use free, pro, or power.");
  }

  if (!("targetInterval" in record)) {
    throw new StripeSubscriptionChangeError("targetInterval is required.");
  }

  if (record.targetInterval === null) {
    if (targetTier !== "free") {
      throw new StripeSubscriptionChangeError(
        "targetInterval is required for Pro and Power targets.",
      );
    }

    return {
      targetTier,
      targetInterval: null,
      targetBillingInterval: null,
    };
  }

  if (typeof record.targetInterval !== "string") {
    throw new StripeSubscriptionChangeError("targetInterval must be a string or null.");
  }

  const targetInterval = record.targetInterval.trim().toLowerCase();

  if (!isSubscriptionChangeInterval(targetInterval)) {
    throw new StripeSubscriptionChangeError("Invalid targetInterval. Use monthly, annual, or null.");
  }

  if (targetTier === "free") {
    throw new StripeSubscriptionChangeError("targetInterval must be null when targetTier is free.");
  }

  return {
    targetTier,
    targetInterval,
    targetBillingInterval: subscriptionChangeIntervalToBillingInterval(targetInterval),
  };
}
