import { tryValidateE164Phone } from "@/lib/account/phoneNumber";
import type { NormalizedClerkUser } from "@/lib/clerk/normalizeUser";
import {
  softDeleteProfileByClerkId,
  updateImmigrationProfilePreferences,
  updateProfileContact,
  upsertProfileFromClerk,
} from "@/lib/supabase/profiles";

export async function syncClerkUserCreatedOrUpdated(user: NormalizedClerkUser) {
  const profile = await upsertProfileFromClerk({
    clerkUserId: user.clerkUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  });

  const phoneNumber = user.phoneNumber ? tryValidateE164Phone(user.phoneNumber) : null;

  if (phoneNumber) {
    await updateProfileContact(profile.id, { phone_number: phoneNumber });
  }

  if (user.automatedAlertsOptIn !== null) {
    await updateImmigrationProfilePreferences(profile.id, {
      automatedAlertsOptIn: user.automatedAlertsOptIn,
    });
  }

  return profile;
}

export async function syncClerkUserDeleted(clerkUserId: string) {
  return softDeleteProfileByClerkId(clerkUserId);
}
