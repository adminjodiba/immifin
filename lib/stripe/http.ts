import { NextResponse } from "next/server";
import Stripe from "stripe";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import {
  isStripeCatalogError,
  isStripeCheckoutError,
  isStripeConfigError,
  isStripeCustomerError,
} from "@/lib/stripe/errors";

export function stripeErrorResponse(error: unknown): NextResponse {
  if (isAuthError(error)) {
    return authErrorResponse(error);
  }

  if (isStripeCheckoutError(error)) {
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
