import { NextResponse } from "next/server";
import Stripe from "stripe";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import {
  isStripeCatalogError,
  isStripeCheckoutError,
  isStripeConfigError,
  isStripeCustomerError,
  isStripeSubscriptionChangeError,
  isStripeWebhookConfigError,
  isStripeWebhookProcessingError,
  isStripeWebhookSignatureError,
} from "@/lib/stripe/errors";

export function stripeErrorResponse(error: unknown): NextResponse {
  if (isAuthError(error)) {
    return authErrorResponse(error);
  }

  if (isStripeCheckoutError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isStripeSubscriptionChangeError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isStripeCustomerError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isStripeConfigError(error) || isStripeCatalogError(error)) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  if (error instanceof Stripe.errors.StripeError) {
    console.error("[stripe] Stripe API error:", error.type);
    return NextResponse.json(
      { error: "Unable to complete the Stripe request." },
      { status: 502 },
    );
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  console.error("[stripe] unexpected error:", message);

  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}

export function stripeWebhookErrorResponse(error: unknown): NextResponse {
  if (isStripeWebhookSignatureError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isStripeWebhookConfigError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isStripeWebhookProcessingError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (isStripeCatalogError(error)) {
    console.error("[stripe-webhook] catalog error during processing");
    return NextResponse.json(
      { error: "Unable to process Stripe webhook event." },
      { status: 500 },
    );
  }

  if (error instanceof Stripe.errors.StripeError) {
    console.error("[stripe-webhook] Stripe API error:", error.type);
    return NextResponse.json(
      { error: "Unable to process Stripe webhook event." },
      { status: 502 },
    );
  }

  const message = error instanceof Error ? error.message : "Webhook processing failed";
  console.error("[stripe-webhook] unexpected error:", message);

  return NextResponse.json({ error: "Unable to process Stripe webhook event." }, { status: 500 });
}
