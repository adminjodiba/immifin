import { NextResponse } from "next/server";
import { dispatchStripeWebhookEvent } from "@/lib/stripe/event-dispatcher";
import { isStripeWebhookProcessingError } from "@/lib/stripe/errors";
import { stripeWebhookErrorResponse } from "@/lib/stripe/http";
import { verifyStripeWebhookPayload } from "@/lib/stripe/webhook";
import {
  claimStripeWebhookEvent,
  completeStripeWebhookEvent,
  failStripeWebhookEvent,
  sanitizeStripeWebhookErrorMessage,
} from "@/lib/supabase/stripe-webhook-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let stripeEventId: string | null = null;
  let shouldFailClaimedEvent = false;

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const event = verifyStripeWebhookPayload(rawBody, signature);

    stripeEventId = event.id;

    console.log("[stripe-webhook] event:", event.type);

    const claim = await claimStripeWebhookEvent({
      stripeEventId: event.id,
      eventType: event.type,
    });

    if (claim.outcome === "already_completed" || claim.outcome === "in_progress") {
      console.log("[stripe-webhook] duplicate delivery:", claim.outcome);
      return NextResponse.json({ received: true, duplicate: true });
    }

    shouldFailClaimedEvent = true;

    await dispatchStripeWebhookEvent(event);
    await completeStripeWebhookEvent(event.id);

    console.log("[stripe-webhook] completed:", event.type);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    if (shouldFailClaimedEvent && stripeEventId) {
      try {
        await failStripeWebhookEvent({
          stripeEventId,
          errorMessage: sanitizeStripeWebhookErrorMessage(
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
