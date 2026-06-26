import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ClerkUserPayload } from "@/lib/clerk/types";
import {
  syncClerkUserCreatedOrUpdated,
  syncClerkUserDeleted,
} from "@/lib/clerk/profileSync";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        await syncClerkUserCreatedOrUpdated(event.data as ClerkUserPayload);
        break;
      }
      case "user.deleted": {
        if (!event.data.id) {
          throw new Error("Clerk user.deleted event is missing user id.");
        }

        await syncClerkUserDeleted(event.data.id);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ success: true, type: event.type });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Clerk webhook verification failed";

    console.error("[clerk-webhook] error:", message);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
