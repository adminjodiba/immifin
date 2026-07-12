import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  AppPlan,
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

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile by email: ${error.message}`);
  }

  return data ? mapProfile(data) : null;
}

async function loadProfileRelations(profile: Profile): Promise<ProfileWithRelations> {
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

export async function getProfileWithRelationsByClerkId(
  clerkUserId: string,
): Promise<ProfileWithRelations | null> {
  const profile = await getProfileByClerkId(clerkUserId);

  if (!profile) {
    return null;
  }

  return loadProfileRelations(profile);
}

export async function getProfileWithRelationsByEmail(
  email: string,
): Promise<ProfileWithRelations | null> {
  const profile = await getProfileByEmail(email);

  if (!profile) {
    return null;
  }

  return loadProfileRelations(profile);
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

type UpdateImmigrationProfileInput = {
  default_category?: string | null;
  default_country?: string | null;
  default_bulletin_type?: string | null;
  priority_date?: string | null;
  green_card_issue_date?: string | null;
  married_to_us_citizen?: boolean | null;
};

export async function updateImmigrationProfile(
  profileId: string,
  updates: UpdateImmigrationProfileInput,
): Promise<ImmigrationProfile> {
  const supabase = getSupabaseAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("immigration_profiles")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to load immigration profile: ${fetchError.message}`);
  }

  if (!existing) {
    const { data, error } = await supabase
      .from("immigration_profiles")
      .insert({ profile_id: profileId, ...updates })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create immigration profile: ${error.message}`);
    }

    return mapImmigrationProfile(data);
  }

  const { data, error } = await supabase
    .from("immigration_profiles")
    .update(updates)
    .eq("profile_id", profileId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update immigration profile: ${error.message}`);
  }

  return mapImmigrationProfile(data);
}

export async function updateImmigrationProfilePreferences(
  profileId: string,
  preferencesPatch: Record<string, unknown>,
): Promise<ImmigrationProfile> {
  const supabase = getSupabaseAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("immigration_profiles")
    .select("id, preferences")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to load immigration profile: ${fetchError.message}`);
  }

  const existingPreferences =
    existing?.preferences && typeof existing.preferences === "object"
      ? (existing.preferences as Record<string, unknown>)
      : {};

  const mergedPreferences = {
    ...existingPreferences,
    ...preferencesPatch,
  };

  if (!existing) {
    const { data, error } = await supabase
      .from("immigration_profiles")
      .insert({ profile_id: profileId, preferences: mergedPreferences })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create immigration profile: ${error.message}`);
    }

    return mapImmigrationProfile(data);
  }

  const { data, error } = await supabase
    .from("immigration_profiles")
    .update({ preferences: mergedPreferences })
    .eq("profile_id", profileId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update immigration profile preferences: ${error.message}`);
  }

  return mapImmigrationProfile(data);
}

type UpdateProfileContactInput = {
  phone_number: string;
};

export async function updateProfileContact(
  profileId: string,
  updates: UpdateProfileContactInput,
): Promise<Profile> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", profileId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update profile contact: ${error.message}`);
  }

  return mapProfile(data);
}

/**
 * Update subscription plan for development mode and future Stripe billing.
 * Keeps profiles.plan and subscriptions.plan in sync for Stripe compatibility.
 *
 * Does not modify immigration profile, favorites, or other user setup data on
 * downgrade — see lib/subscription/dataRetention.ts.
 */
export async function updateSubscriptionPlan(
  profileId: string,
  plan: AppPlan,
): Promise<{ profile: Profile; subscription: Subscription }> {
  const supabase = getSupabaseAdminClient();

  const { data: existingSubscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to load subscription: ${fetchError.message}`);
  }

  const subscriptionStatus = plan === "free" ? "inactive" : "active";

  let subscription: Subscription;

  if (!existingSubscription) {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        profile_id: profileId,
        plan,
        status: subscriptionStatus,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    subscription = mapSubscription(data);
  } else {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        plan,
        status: subscriptionStatus,
      })
      .eq("profile_id", profileId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    subscription = mapSubscription(data);
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", profileId)
    .select("*")
    .single();

  if (profileError) {
    throw new Error(`Failed to update profile plan: ${profileError.message}`);
  }

  return {
    profile: mapProfile(profileData),
    subscription,
  };
}

/**
 * Persists the trusted Stripe Customer ID for a profile's subscription row.
 * Used by Stripe customer mapping — does not change plan or capabilities.
 */
export async function persistSubscriptionStripeCustomerId(
  profileId: string,
  stripeCustomerId: string,
): Promise<Subscription> {
  const normalizedCustomerId = stripeCustomerId.trim();

  if (!normalizedCustomerId) {
    throw new Error("Stripe customer ID is required.");
  }

  const supabase = getSupabaseAdminClient();

  const { data: existingSubscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to load subscription: ${fetchError.message}`);
  }

  if (!existingSubscription) {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        profile_id: profileId,
        stripe_customer_id: normalizedCustomerId,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to persist Stripe customer mapping: ${error.message}`);
    }

    return mapSubscription(data);
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update({ stripe_customer_id: normalizedCustomerId })
    .eq("profile_id", profileId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to persist Stripe customer mapping: ${error.message}`);
  }

  return mapSubscription(data);
}

export async function getSubscriptionByProfileId(
  profileId: string,
): Promise<Subscription | null> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load subscription: ${error.message}`);
  }

  return data ? mapSubscription(data) : null;
}
