import { handleVerifiedStripeWebhookEvent } from "@/lib/stripe/handleVerifiedWebhookEvent";
import { stripeWebhookErrorResponse } from "@/lib/stripe/http";
import { verifyStripeWebhookPayload } from "@/lib/stripe/webhook";
import { createWriteFreezeResponse, isWriteFrozenError } from "@/lib/platform/writeFreeze";
import { dispatchStripeWebhookEvent } from "@/lib/stripe/event-dispatcher";
import {
  claimStripeWebhookEvent,
  completeStripeWebhookEvent,
  failStripeWebhookEvent,
  sanitizeStripeWebhookErrorMessage,
} from "@/lib/supabase/stripe-webhook-events";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    const event = verifyStripeWebhookPayload(rawBody, signature);
    return await handleVerifiedStripeWebhookEvent(event, {
      claimStripeWebhookEvent,
      completeStripeWebhookEvent,
      failStripeWebhookEvent,
      dispatchStripeWebhookEvent,
      sanitizeStripeWebhookErrorMessage,
    });
  } catch (error: unknown) {
    if (isWriteFrozenError(error)) {
      return createWriteFreezeResponse();
    }

    return stripeWebhookErrorResponse(error);
  }
}
