import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleVerifiedClerkWebhookEvent } from "@/lib/clerk/handleVerifiedWebhookEvent";
import { createWriteFreezeResponse, isWriteFrozenError } from "@/lib/platform/writeFreeze";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);
    return await handleVerifiedClerkWebhookEvent(event);
  } catch (error: unknown) {
    if (isWriteFrozenError(error)) {
      return createWriteFreezeResponse();
    }

    const message = error instanceof Error ? error.message : "Clerk webhook verification failed";

    console.error("[clerk-webhook] error:", message);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
