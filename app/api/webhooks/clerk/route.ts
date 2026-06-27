import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { normalizeClerkUser } from "@/lib/clerk/normalizeUser";
import type { ClerkUserPayload } from "@/lib/clerk/types";
import {
  syncClerkUserCreatedOrUpdated,
  syncClerkUserDeleted,
} from "@/lib/clerk/profileSync";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);

    console.log("[clerk-webhook] event:", event.type);

    switch (event.type) {
      case "user.created":
      case "user.updated": {
        const normalized = normalizeClerkUser(event.data as ClerkUserPayload);
        console.log("[clerk-webhook] normalized user:", normalized);
        await syncClerkUserCreatedOrUpdated(normalized);
        break;
      }
      case "user.deleted": {
        if (!event.data.id) {
          throw new Error("Clerk user.deleted event is missing user id.");
        }

        console.log("[clerk-webhook] delete clerk user id:", event.data.id);
        await syncClerkUserDeleted(event.data.id);
        break;
      }
      default:
        console.log("[clerk-webhook] ignored event:", event.type);
        break;
    }

    return NextResponse.json({ success: true, type: event.type });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Clerk webhook verification failed";

    console.error("[clerk-webhook] error:", message);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
