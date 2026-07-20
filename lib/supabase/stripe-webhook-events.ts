import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  StripeWebhookClaimOutcome,
  StripeWebhookClaimResult,
  StripeWebhookEvent,
} from "@/lib/supabase/types";

const MAX_SAFE_ERROR_MESSAGE_LENGTH = 500;

function mapStripeWebhookEvent(row: Record<string, unknown>): StripeWebhookEvent {
  return row as StripeWebhookEvent;
}

function isStripeWebhookClaimOutcome(value: unknown): value is StripeWebhookClaimOutcome {
  return (
    value === "claimed" ||
    value === "retry_claimed" ||
    value === "already_completed" ||
    value === "in_progress"
  );
}

export function sanitizeStripeWebhookErrorMessage(message: string | null | undefined): string | null {
  if (!message) {
    return null;
  }

  const normalized = message.replace(/[\r\n]+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_SAFE_ERROR_MESSAGE_LENGTH);
}

/**
 * Durably claims a Stripe webhook event for processing.
 * Uses an atomic database RPC safe across concurrent Workers and Stripe retries.
 */
export async function claimStripeWebhookEvent(input: {
  stripeEventId: string;
  eventType: string;
}): Promise<StripeWebhookClaimResult> {
  const stripeEventId = input.stripeEventId.trim();
  const eventType = input.eventType.trim();

  if (!stripeEventId) {
    throw new Error("Stripe event ID is required.");
  }

  if (!eventType) {
    throw new Error("Stripe event type is required.");
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("claim_stripe_webhook_event", {
    p_stripe_event_id: stripeEventId,
    p_event_type: eventType,
  });

  if (error) {
    throw new Error(`Failed to claim Stripe webhook event: ${error.message}`);
  }

  if (!data || typeof data !== "object") {
    throw new Error("Stripe webhook claim returned an invalid payload.");
  }

  const payload = data as { outcome?: unknown; event?: Record<string, unknown> };

  if (!isStripeWebhookClaimOutcome(payload.outcome) || !payload.event) {
    throw new Error("Stripe webhook claim returned an invalid outcome.");
  }

  return {
    outcome: payload.outcome,
    event: mapStripeWebhookEvent(payload.event),
  };
}

export async function completeStripeWebhookEvent(stripeEventId: string): Promise<StripeWebhookEvent> {
  const normalizedEventId = stripeEventId.trim();

  if (!normalizedEventId) {
    throw new Error("Stripe event ID is required.");
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("complete_stripe_webhook_event", {
    p_stripe_event_id: normalizedEventId,
  });

  if (error) {
    throw new Error(`Failed to complete Stripe webhook event: ${error.message}`);
  }

  return mapStripeWebhookEvent(data as Record<string, unknown>);
}

export async function failStripeWebhookEvent(input: {
  stripeEventId: string;
  errorMessage?: string | null;
}): Promise<StripeWebhookEvent> {
  const normalizedEventId = input.stripeEventId.trim();

  if (!normalizedEventId) {
    throw new Error("Stripe event ID is required.");
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("fail_stripe_webhook_event", {
    p_stripe_event_id: normalizedEventId,
    p_error_message: sanitizeStripeWebhookErrorMessage(input.errorMessage),
  });

  if (error) {
    throw new Error(`Failed to mark Stripe webhook event as failed: ${error.message}`);
  }

  return mapStripeWebhookEvent(data as Record<string, unknown>);
}
