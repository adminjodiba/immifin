import { auth, currentUser } from "@clerk/nextjs/server";
import { isActiveProfileStatus } from "@/lib/auth/roles";
import {
  getProfileWithRelationsByClerkId,
  touchProfileActivity,
  upsertProfileFromClerk,
} from "@/lib/supabase/profiles";
import type { ImmigrationProfile, Profile } from "@/lib/supabase/types";

type ClerkUser = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export type DashboardProfileLoadResult = {
  profile: Profile | null;
  immigrationProfile: ImmigrationProfile | null;
  needsInternalProfileSetup: boolean;
};

function getPrimaryEmail(user: ClerkUser): string | null {
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  )?.emailAddress;

  const fallbackEmail = user.emailAddresses[0]?.emailAddress;

  return (primaryEmail ?? fallbackEmail)?.toLowerCase() ?? null;
}

/**
 * Loads the internal IMMIFIN profile for the dashboard without throwing when
 * the Supabase record is missing or temporarily unavailable.
 *
 * Strict auth flows should continue to use requireUser().
 */
export async function getOptionalUserProfileForDashboard(): Promise<DashboardProfileLoadResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      profile: null,
      immigrationProfile: null,
      needsInternalProfileSetup: true,
    };
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    return {
      profile: null,
      immigrationProfile: null,
      needsInternalProfileSetup: true,
    };
  }

  try {
    let profileWithRelations = await getProfileWithRelationsByClerkId(userId);

    if (!profileWithRelations) {
      const email = getPrimaryEmail(clerkUser);

      if (!email) {
        console.error("[dashboard] signed-in Clerk user is missing an email address");
        return {
          profile: null,
          immigrationProfile: null,
          needsInternalProfileSetup: true,
        };
      }

      try {
        const profile = await upsertProfileFromClerk({
          clerkUserId: userId,
          email,
          displayName: clerkUser.fullName,
          avatarUrl: clerkUser.imageUrl,
        });

        profileWithRelations = await getProfileWithRelationsByClerkId(profile.clerk_user_id);
      } catch (error: unknown) {
        console.error("[dashboard] failed to create internal profile from Clerk user:", error);
        return {
          profile: null,
          immigrationProfile: null,
          needsInternalProfileSetup: true,
        };
      }
    }

    if (!profileWithRelations) {
      console.error("[dashboard] internal profile record could not be loaded after upsert");
      return {
        profile: null,
        immigrationProfile: null,
        needsInternalProfileSetup: true,
      };
    }

    if (!isActiveProfileStatus(profileWithRelations.profile.status)) {
      console.error(
        "[dashboard] internal profile is not active:",
        profileWithRelations.profile.status,
      );
      return {
        profile: null,
        immigrationProfile: null,
        needsInternalProfileSetup: true,
      };
    }

    void touchProfileActivity({
      profileId: profileWithRelations.profile.id,
      clerkLastSignInAt: clerkUser.lastSignInAt,
      storedLastLoginAt: profileWithRelations.profile.last_login_at,
    }).catch((error: unknown) => {
      console.error("[dashboard] failed to update profile activity timestamps:", error);
    });

    return {
      profile: profileWithRelations.profile,
      immigrationProfile: profileWithRelations.immigrationProfile,
      needsInternalProfileSetup: false,
    };
  } catch (error: unknown) {
    console.error("[dashboard] unexpected error loading internal profile:", error);
    return {
      profile: null,
      immigrationProfile: null,
      needsInternalProfileSetup: true,
    };
  }
}

export function getDashboardWelcomeName(
  clerkUser: ClerkUser | null,
  profile: Profile | null,
): string {
  const firstName = clerkUser?.firstName;
  const fullName = clerkUser?.fullName ?? profile?.display_name;
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? profile?.email ?? "";

  if (firstName?.trim()) {
    return firstName.trim();
  }

  if (fullName?.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
  }

  const localPart = email.split("@")[0]?.trim();
  if (localPart) {
    return localPart;
  }

  return "Welcome";
}
