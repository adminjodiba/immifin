import type { NormalizedClerkUser } from "@/lib/clerk/normalizeUser";
import {
  softDeleteProfileByClerkId,
  upsertProfileFromClerk,
} from "@/lib/supabase/profiles";

export async function syncClerkUserCreatedOrUpdated(user: NormalizedClerkUser) {
  return upsertProfileFromClerk({
    clerkUserId: user.clerkUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  });
}

export async function syncClerkUserDeleted(clerkUserId: string) {
  return softDeleteProfileByClerkId(clerkUserId);
}
