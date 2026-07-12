import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { createNewSubscriptionCheckoutSession } from "@/lib/stripe/checkout";
import { parseCheckoutRequest } from "@/lib/stripe/checkout-request";
import { stripeErrorResponse } from "@/lib/stripe/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const profileWithRelations = await requireUser();

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
    });

    return NextResponse.json({ url });
  } catch (error: unknown) {
    return stripeErrorResponse(error);
  }
}
