import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { createPaymentMethodPortalSession } from "@/lib/stripe/billing-portal-payment-method";
import { stripeErrorResponse } from "@/lib/stripe/http";

export const runtime = "nodejs";

/**
 * POST /api/stripe/billing-portal/payment-method
 * Creates a Stripe-hosted payment-method management session (Billing Portal deep link).
 * S7-BILLING-UX-005 — does not mutate subscriptions or execute upgrades.
 */
export async function POST() {
  try {
    const profileWithRelations = await requireUser();

    const result = await createPaymentMethodPortalSession({
      profile: profileWithRelations.profile,
      subscription: profileWithRelations.subscription,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return stripeErrorResponse(error);
  }
}
