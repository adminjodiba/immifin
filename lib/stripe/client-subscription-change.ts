import type { SubscriptionTier } from "@/lib/subscription/tiers";
import type { SubscriptionChangePreviewResult } from "@/lib/stripe/subscription-change-preview.types";

export type SubscriptionChangeInterval = "monthly" | "annual" | null;

export type SubscriptionChangeRequest = {
  targetTier: SubscriptionTier;
  targetInterval: SubscriptionChangeInterval;
  /** Required for immediate upgrades — from POST /api/stripe/subscription/preview. */
  previewAuthorization?: string;
};

export type SubscriptionChangePaymentInfo = {
  requiresAction: boolean;
  clientSecret?: string;
  hostedInvoiceUrl?: string;
};

export type SubscriptionChangeResponse =
  | {
      status: "pending_confirmation" | "scheduled" | "confirmed";
      changeType:
        | "immediate_upgrade"
        | "scheduled_downgrade"
        | "scheduled_interval_change"
        | "cancel_at_period_end"
        | "retain_paid_subscription";
      effectiveAt?: string;
    }
  | {
      status: "confirmed" | "requires_action" | "failed";
      changeType: "immediate_upgrade";
      targetTier: "pro" | "power";
      targetInterval: "month" | "year";
      payment: SubscriptionChangePaymentInfo;
    };

/**
 * Requests a read-only Stripe upgrade preview (invoice-now model).
 */
export async function requestSubscriptionChangePreview(request: {
  targetTier: SubscriptionTier;
  targetInterval: Exclude<SubscriptionChangeInterval, null>;
}): Promise<SubscriptionChangePreviewResult> {
  const response = await fetch("/api/stripe/subscription/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as SubscriptionChangePreviewResult & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to preview subscription change.");
  }

  return payload;
}

/**
 * Isolated client helper for paid subscription change API.
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
