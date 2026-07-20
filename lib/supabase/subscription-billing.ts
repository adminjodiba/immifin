import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  AppPlan,
  ImmigrationProfile,
  Profile,
  ProfileWithRelations,
  Subscription,
  SubscriptionBillingInterval,
  SubscriptionStatus,
} from "@/lib/supabase/types";

function mapProfile(row: Record<string, unknown>): Profile {
  return row as Profile;
}

function mapImmigrationProfile(row: Record<string, unknown>): ImmigrationProfile {
  return row as ImmigrationProfile;
}

function mapSubscription(row: Record<string, unknown>): Subscription {
  return row as Subscription;
}

async function loadProfileWithRelations(profile: Profile): Promise<ProfileWithRelations> {
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

/**
 * Resolves profile relations by trusted IMMIFIN profile ID (webhook reconciliation).
 */
export async function getProfileWithRelationsByProfileId(
  profileId: string,
): Promise<ProfileWithRelations | null> {
  const normalizedProfileId = profileId.trim();

  if (!normalizedProfileId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", normalizedProfileId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  if (!profile) {
    return null;
  }

  return loadProfileWithRelations(mapProfile(profile));
}

/**
 * Resolves a subscription and profile context by trusted Stripe Customer ID.
 */
export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string,
): Promise<ProfileWithRelations | null> {
  const normalizedCustomerId = stripeCustomerId.trim();

  if (!normalizedCustomerId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("profile_id")
    .eq("stripe_customer_id", normalizedCustomerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load subscription by Stripe customer ID: ${error.message}`);
  }

  if (!subscription?.profile_id) {
    return null;
  }

  return getProfileWithRelationsByProfileId(subscription.profile_id);
}

/**
 * Resolves a subscription and profile context by trusted Stripe Subscription ID.
 */
export async function getSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string,
): Promise<ProfileWithRelations | null> {
  const normalizedSubscriptionId = stripeSubscriptionId.trim();

  if (!normalizedSubscriptionId) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("profile_id")
    .eq("stripe_subscription_id", normalizedSubscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load subscription by Stripe subscription ID: ${error.message}`);
  }

  if (!subscription?.profile_id) {
    return null;
  }

  return getProfileWithRelationsByProfileId(subscription.profile_id);
}

export type SyncSubscriptionBillingStateInput = {
  profileId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripePriceId?: string | null;
  billingInterval?: SubscriptionBillingInterval | null;
  stripeStatus?: string | null;
  plan?: AppPlan;
  status?: SubscriptionStatus;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
  lastSynchronizedAt?: string;
};

/**
 * Persists trusted Stripe billing state supplied by a future synchronization service.
 * Does not modify capabilities, feature gates, or notification eligibility.
 */
export async function syncSubscriptionBillingState(
  input: SyncSubscriptionBillingStateInput,
): Promise<{ profile: Profile; subscription: Subscription }> {
  const profileId = input.profileId.trim();

  if (!profileId) {
    throw new Error("Profile ID is required.");
  }

  const supabase = getSupabaseAdminClient();
  const synchronizedAt = input.lastSynchronizedAt ?? new Date().toISOString();

  const subscriptionUpdate: Record<string, unknown> = {
    last_synchronized_at: synchronizedAt,
  };

  if (input.stripeCustomerId !== undefined) {
    subscriptionUpdate.stripe_customer_id = input.stripeCustomerId?.trim() || null;
  }

  if (input.stripeSubscriptionId !== undefined) {
    subscriptionUpdate.stripe_subscription_id = input.stripeSubscriptionId?.trim() || null;
  }

  if (input.stripePriceId !== undefined) {
    subscriptionUpdate.stripe_price_id = input.stripePriceId?.trim() || null;
  }

  if (input.billingInterval !== undefined) {
    subscriptionUpdate.billing_interval = input.billingInterval;
  }

  if (input.stripeStatus !== undefined) {
    subscriptionUpdate.stripe_status = input.stripeStatus?.trim() || null;
  }

  if (input.status !== undefined) {
    subscriptionUpdate.status = input.status;
  }

  if (input.currentPeriodStart !== undefined) {
    subscriptionUpdate.current_period_start = input.currentPeriodStart;
  }

  if (input.currentPeriodEnd !== undefined) {
    subscriptionUpdate.current_period_end = input.currentPeriodEnd;
  }

  if (input.cancelAtPeriodEnd !== undefined) {
    subscriptionUpdate.cancel_at_period_end = input.cancelAtPeriodEnd;
  }

  if (input.canceledAt !== undefined) {
    subscriptionUpdate.canceled_at = input.canceledAt;
  }

  if (input.plan !== undefined) {
    subscriptionUpdate.plan = input.plan;
  }

  const { data: existingSubscription, error: fetchError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to load subscription: ${fetchError.message}`);
  }

  let subscription: Subscription;

  if (!existingSubscription) {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        profile_id: profileId,
        ...subscriptionUpdate,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create subscription billing state: ${error.message}`);
    }

    subscription = mapSubscription(data);
  } else {
    const { data, error } = await supabase
      .from("subscriptions")
      .update(subscriptionUpdate)
      .eq("profile_id", profileId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update subscription billing state: ${error.message}`);
    }

    subscription = mapSubscription(data);
  }

  let profile: Profile;

  if (input.plan !== undefined) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .update({ plan: input.plan })
      .eq("id", profileId)
      .select("*")
      .single();

    if (profileError) {
      throw new Error(`Failed to update profile plan during billing sync: ${profileError.message}`);
    }

    profile = mapProfile(profileData);
  } else {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (profileError) {
      throw new Error(`Failed to load profile during billing sync: ${profileError.message}`);
    }

    profile = mapProfile(profileData);
  }

  return { profile, subscription };
}
