import type { SubscriptionTier } from "@/lib/subscription/tiers";

export type SubscriptionChangeInterval = "monthly" | "annual" | null;

export type SubscriptionChangeRequest = {
  targetTier: SubscriptionTier;
  targetInterval: SubscriptionChangeInterval;
};

export type SubscriptionChangeResponse = {
  status: "pending_confirmation" | "scheduled";
  changeType:
    | "immediate_upgrade"
    | "scheduled_downgrade"
    | "scheduled_interval_change"
    | "cancel_at_period_end"
    | "retain_paid_subscription";
  effectiveAt?: string;
};

/**
 * Isolated client helper for paid subscription change API verification.
 * Not connected to Pricing UI actions.
 */
export async function requestPaidSubscriptionChange(
  request: SubscriptionChangeRequest,
): Promise<SubscriptionChangeResponse> {
  const response = await fetch("/api/stripe/subscription/change", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as SubscriptionChangeResponse & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to change subscription.");
  }

  return payload;
}
