import { NextResponse } from "next/server";
import { normalizeClerkUser } from "@/lib/clerk/normalizeUser";
import type { ClerkUserPayload } from "@/lib/clerk/types";
import {
  syncClerkUserCreatedOrUpdated,
  syncClerkUserDeleted,
} from "@/lib/clerk/profileSync";
import {
  createWriteFreezeResponse,
  isWriteFreezeEnabled,
} from "@/lib/platform/writeFreeze";

export type ClerkWebhookSync = {
  syncClerkUserCreatedOrUpdated?: typeof syncClerkUserCreatedOrUpdated;
  syncClerkUserDeleted?: typeof syncClerkUserDeleted;
};

export async function handleVerifiedClerkWebhookEvent(
  event: {
    type: string;
    data: { id?: string };
  },
  sync: ClerkWebhookSync = {},
): Promise<NextResponse> {
  if (isWriteFreezeEnabled()) {
    return createWriteFreezeResponse();
  }

  const syncCreated = sync.syncClerkUserCreatedOrUpdated ?? syncClerkUserCreatedOrUpdated;
  const syncDeleted = sync.syncClerkUserDeleted ?? syncClerkUserDeleted;

  console.log("[clerk-webhook] event:", event.type);

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const normalized = normalizeClerkUser(event.data as ClerkUserPayload);
      console.log("[clerk-webhook] user synced:", { clerkUserId: normalized.clerkUserId });
      await syncCreated(normalized);
      break;
    }
    case "user.deleted": {
      if (!event.data.id) {
        throw new Error("Clerk user.deleted event is missing user id.");
      }

      console.log("[clerk-webhook] delete clerk user id:", event.data.id);
      await syncDeleted(event.data.id);
      break;
    }
    default:
      console.log("[clerk-webhook] ignored event:", event.type);
      break;
  }

  return NextResponse.json({ success: true, type: event.type });
}
