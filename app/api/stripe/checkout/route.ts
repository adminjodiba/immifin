import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { createNewSubscriptionCheckoutSession } from "@/lib/stripe/checkout";
import { parseCheckoutRequest } from "@/lib/stripe/checkout-request";
import { logStripeCheckoutDiag } from "@/lib/stripe/customer";
import { stripeErrorResponse } from "@/lib/stripe/http";

export const runtime = "nodejs";

function createCheckoutDiagCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `checkout_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request: Request) {
  const diag = {
    correlationId: createCheckoutDiagCorrelationId(),
    startedAtMs: Date.now(),
  };

  logStripeCheckoutDiag("CHECKOUT_REQUEST_RECEIVED", diag);

  try {
    const profileWithRelations = await requireUser();
    logStripeCheckoutDiag("AUTH_COMPLETE", diag);
    logStripeCheckoutDiag("PROFILE_SUBSCRIPTION_READY", diag);

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const checkoutRequest = parseCheckoutRequest(body);

    const { url } = await createNewSubscriptionCheckoutSession({
      profile: profileWithRelations.profile,
      subscription: profileWithRelations.subscription,
      request: checkoutRequest,
      diag,
    });

    logStripeCheckoutDiag("CHECKOUT_RESPONSE_RETURNED", diag);
    return NextResponse.json({ url });
  } catch (error: unknown) {
    logStripeCheckoutDiag("CHECKOUT_REQUEST_FAILED", diag);
    return stripeErrorResponse(error);
  }
}
