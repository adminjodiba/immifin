import type { ClerkEmailAddress, ClerkUserPayload } from "@/lib/clerk/types";
import {
  softDeleteProfileByClerkId,
  upsertProfileFromClerk,
} from "@/lib/supabase/profiles";

function getPrimaryEmailFromUser(user: ClerkUserPayload): string {
  const primaryEmail = user.email_addresses.find(
    (email: ClerkEmailAddress) => email.id === user.primary_email_address_id,
  )?.email_address;

  const fallbackEmail = user.email_addresses[0]?.email_address;

  if (!primaryEmail && !fallbackEmail) {
    throw new Error(`Clerk user ${user.id} is missing an email address.`);
  }

  return (primaryEmail ?? fallbackEmail!).toLowerCase();
}

function getDisplayName(user: ClerkUserPayload): string | null {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.username || null;
}

export async function syncClerkUserCreatedOrUpdated(user: ClerkUserPayload) {
  return upsertProfileFromClerk({
    clerkUserId: user.id,
    email: getPrimaryEmailFromUser(user),
    displayName: getDisplayName(user),
    avatarUrl: user.image_url,
  });
}

export async function syncClerkUserDeleted(clerkUserId: string) {
  return softDeleteProfileByClerkId(clerkUserId);
}
