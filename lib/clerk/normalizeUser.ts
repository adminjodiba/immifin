import type { ClerkUserPayload } from "@/lib/clerk/types";
import { parseSignupContactMetadata } from "@/lib/clerk/signupMetadata";

export type NormalizedClerkUser = {
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  automatedAlertsOptIn: boolean | null;
};

function trimToNull(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveEmail(user: ClerkUserPayload): string {
  const primaryEmail = user.email_addresses.find(
    (email) => email.id === user.primary_email_address_id,
  )?.email_address;

  const fallbackEmail = user.email_addresses[0]?.email_address;
  const rawEmail = primaryEmail ?? fallbackEmail;

  if (!rawEmail) {
    throw new Error(`Clerk user ${user.id} is missing an email address.`);
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();

  if (normalizedEmail.length === 0) {
    throw new Error(`Clerk user ${user.id} is missing an email address.`);
  }

  return normalizedEmail;
}

function buildDisplayName(
  firstName: string | null,
  lastName: string | null,
  username: string | null,
): string | null {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  return username;
}

export function normalizeClerkUser(user: ClerkUserPayload): NormalizedClerkUser {
  const clerkUserId = user.id?.trim();

  if (!clerkUserId) {
    throw new Error("Clerk user is missing an id.");
  }

  const firstName = trimToNull(user.first_name);
  const lastName = trimToNull(user.last_name);
  const username = trimToNull(user.username);
  const signupMetadata = parseSignupContactMetadata(user.unsafe_metadata);

  return {
    clerkUserId,
    email: resolveEmail(user),
    firstName,
    lastName,
    displayName: buildDisplayName(firstName, lastName, username),
    avatarUrl: trimToNull(user.image_url),
    phoneNumber: signupMetadata.phoneNumber,
    automatedAlertsOptIn: signupMetadata.automatedAlertsOptIn,
  };
}
