import { auth, currentUser } from "@clerk/nextjs/server";
import { AuthError } from "@/lib/auth/errors";
import { isActiveProfileStatus, isAdminRole } from "@/lib/auth/roles";
import {
  getProfileWithRelationsByClerkId,
  touchProfileActivity,
  upsertProfileFromClerk,
} from "@/lib/supabase/profiles";
import type { ProfileWithRelations } from "@/lib/supabase/types";

function getPrimaryEmail(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>): string {
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  )?.emailAddress;

  const fallbackEmail = user.emailAddresses[0]?.emailAddress;

  if (!primaryEmail && !fallbackEmail) {
    throw new AuthError("Authenticated user is missing an email address.", 401);
  }

  return (primaryEmail ?? fallbackEmail!).toLowerCase();
}

export async function requireUser(): Promise<ProfileWithRelations> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Authentication required.", 401);
  }

  const user = await currentUser();

  if (!user) {
    throw new AuthError("Authentication required.", 401);
  }

  let profileWithRelations = await getProfileWithRelationsByClerkId(userId);

  if (!profileWithRelations) {
    const profile = await upsertProfileFromClerk({
      clerkUserId: userId,
      email: getPrimaryEmail(user),
      displayName: user.fullName,
      avatarUrl: user.imageUrl,
    });

    profileWithRelations = await getProfileWithRelationsByClerkId(profile.clerk_user_id);
  }

  if (!profileWithRelations) {
    throw new AuthError("Unable to load user profile.", 500);
  }

  if (!isActiveProfileStatus(profileWithRelations.profile.status)) {
    throw new AuthError("This account is not active.", 403);
  }

  void touchProfileActivity({
    profileId: profileWithRelations.profile.id,
    clerkLastSignInAt: user.lastSignInAt,
    storedLastLoginAt: profileWithRelations.profile.last_login_at,
  }).catch((error: unknown) => {
    console.error("[auth] failed to update profile activity timestamps:", error);
  });

  return profileWithRelations;
}

export async function requireAdmin(): Promise<ProfileWithRelations> {
  const profileWithRelations = await requireUser();

  if (!isAdminRole(profileWithRelations.profile.role)) {
    throw new AuthError("Admin access required.", 403);
  }

  return profileWithRelations;
}
