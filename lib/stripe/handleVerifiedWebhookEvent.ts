import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  createWriteFreezeResponse,
  isWriteFreezeEnabled,
  isWriteFrozenError,
} from "@/lib/platform/writeFreeze";
import { isStripeWebhookProcessingError } from "@/lib/stripe/errors";
import { stripeWebhookErrorResponse } from "@/lib/stripe/http";
import type { StripeWebhookClaimResult } from "@/lib/supabase/types";

export type VerifiedStripeWebhookDeps = {
  claimStripeWebhookEvent: (input: {
    stripeEventId: string;
    eventType: string;
  }) => Promise<StripeWebhookClaimResult>;
  completeStripeWebhookEvent: (stripeEventId: string) => Promise<unknown>;
  failStripeWebhookEvent: (input: {
    stripeEventId: string;
    errorMessage?: string | null;
  }) => Promise<unknown>;
  dispatchStripeWebhookEvent: (event: Stripe.Event) => Promise<unknown>;
  sanitizeStripeWebhookErrorMessage: (message: string | null | undefined) => string | null;
};

export async function handleVerifiedStripeWebhookEvent(
  event: Stripe.Event,
  deps: VerifiedStripeWebhookDeps,
): Promise<NextResponse> {
  if (isWriteFreezeEnabled()) {
    return createWriteFreezeResponse();
  }

  let shouldFailClaimedEvent = false;

  try {
    console.log("[stripe-webhook] event:", event.type);

    const claim = await deps.claimStripeWebhookEvent({
      stripeEventId: event.id,
      eventType: event.type,
    });

    if (claim.outcome === "already_completed" || claim.outcome === "in_progress") {
      console.log("[stripe-webhook] duplicate delivery:", claim.outcome);
      return NextResponse.json({ received: true, duplicate: true });
    }

    shouldFailClaimedEvent = true;

    await deps.dispatchStripeWebhookEvent(event);
    await deps.completeStripeWebhookEvent(event.id);

    console.log("[stripe-webhook] completed:", event.type);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    if (isWriteFrozenError(error)) {
      return createWriteFreezeResponse();
    }

    if (shouldFailClaimedEvent && event.id) {
      try {
        await deps.failStripeWebhookEvent({
          stripeEventId: event.id,
          errorMessage: deps.sanitizeStripeWebhookErrorMessage(
            error instanceof Error ? error.message : "Webhook processing failed.",
          ),
        });
      } catch (failError: unknown) {
        const message =
          failError instanceof Error ? failError.message : "Failed to mark webhook event failed.";
        console.error("[stripe-webhook] ledger failure:", message);
      }
    }

    if (isStripeWebhookProcessingError(error)) {
      console.error("[stripe-webhook] processing failed:", error.message);
    }

    return stripeWebhookErrorResponse(error);
  }
}
