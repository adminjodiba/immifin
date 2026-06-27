import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  ImmigrationProfile,
  Profile,
  ProfileWithRelations,
  Subscription,
} from "@/lib/supabase/types";

type UpsertProfileInput = {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
};

function mapProfile(row: Record<string, unknown>): Profile {
  return row as Profile;
}

function mapImmigrationProfile(row: Record<string, unknown>): ImmigrationProfile {
  return row as ImmigrationProfile;
}

function mapSubscription(row: Record<string, unknown>): Subscription {
  return row as Subscription;
}

export async function getProfileByClerkId(clerkUserId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  return data ? mapProfile(data) : null;
}

export async function getProfileWithRelationsByClerkId(
  clerkUserId: string,
): Promise<ProfileWithRelations | null> {
  const profile = await getProfileByClerkId(clerkUserId);

  if (!profile) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  const [{ data: immigrationProfile, error: immigrationError }, { data: subscription, error: subscriptionError }] =
    await Promise.all([
      supabase.from("immigration_profiles").select("*").eq("profile_id", profile.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("profile_id", profile.id).maybeSingle(),
    ]);

  if (immigrationError) {
    throw new Error(`Failed to load immigration profile: ${immigrationError.message}`);
  }

  if (subscriptionError) {
    throw new Error(`Failed to load subscription: ${subscriptionError.message}`);
  }

  return {
    profile,
    immigrationProfile: immigrationProfile ? mapImmigrationProfile(immigrationProfile) : null,
    subscription: subscription ? mapSubscription(subscription) : null,
  };
}

export async function upsertProfileFromClerk(input: UpsertProfileInput): Promise<Profile> {
  const supabase = getSupabaseAdminClient();

  const rpcInput = {
    p_clerk_user_id: input.clerkUserId,
    p_email: input.email,
    p_first_name: input.firstName ?? null,
    p_last_name: input.lastName ?? null,
    p_display_name: input.displayName ?? null,
    p_avatar_url: input.avatarUrl ?? null,
  };

  console.log("[clerk-webhook] rpc input:", rpcInput);

  const { data, error } = await supabase.rpc("upsert_profile_from_clerk", rpcInput);

  if (error) {
    console.error("[clerk-webhook] rpc error:", error);
    throw new Error(`Failed to upsert profile from Clerk: ${error.message}`);
  }

  console.log("[clerk-webhook] rpc output:", data);

  return mapProfile(data as Record<string, unknown>);
}

export async function softDeleteProfileByClerkId(clerkUserId: string): Promise<Profile> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("soft_delete_profile_by_clerk_id", {
    p_clerk_user_id: clerkUserId,
  });

  if (error) {
    throw new Error(`Failed to soft delete profile: ${error.message}`);
  }

  return mapProfile(data as Record<string, unknown>);
}

export async function touchProfileActivity(input: {
  profileId: string;
  clerkLastSignInAt: number | null;
  storedLastLoginAt: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const updates: {
    last_seen_at: string;
    last_login_at?: string;
  } = {
    last_seen_at: now,
  };

  if (input.clerkLastSignInAt !== null) {
    const signInTime = input.clerkLastSignInAt;
    const storedTime = input.storedLastLoginAt
      ? new Date(input.storedLastLoginAt).getTime()
      : null;

    if (storedTime === null || signInTime > storedTime) {
      updates.last_login_at = new Date(signInTime).toISOString();
    }
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", input.profileId);

  if (error) {
    throw new Error(`Failed to update profile activity timestamps: ${error.message}`);
  }
}
