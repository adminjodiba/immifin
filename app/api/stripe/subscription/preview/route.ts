import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { previewPaidSubscriptionChange } from "@/lib/stripe/subscription-change-preview";
import { parseSubscriptionChangeRequest } from "@/lib/stripe/subscription-change-request";
import { stripeErrorResponse } from "@/lib/stripe/http";

export const runtime = "nodejs";

/**
 * POST /api/stripe/subscription/preview
 * Read-only Stripe invoice preview for approved immediate paid upgrades.
 * S7-BILLING-UX-002 — does not mutate Stripe or local billing state.
 */
export async function POST(request: Request) {
  try {
    const profileWithRelations = await requireUser();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const changeRequest = parseSubscriptionChangeRequest(body);

    const result = await previewPaidSubscriptionChange({
      profile: profileWithRelations.profile,
      subscription: profileWithRelations.subscription,
      request: changeRequest,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return stripeErrorResponse(error);
  }
}