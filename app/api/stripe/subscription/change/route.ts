import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireUser";
import { executePaidSubscriptionChange } from "@/lib/stripe/subscription-change";
import { parseSubscriptionChangeRequest } from "@/lib/stripe/subscription-change-request";
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

    const changeRequest = parseSubscriptionChangeRequest(body);

    const result = await executePaidSubscriptionChange({
      profile: profileWithRelations.profile,
      subscription: profileWithRelations.subscription,
      request: changeRequest,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return stripeErrorResponse(error);
  }
}
