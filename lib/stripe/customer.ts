import "server-only";

import { StripeCustomerError } from "@/lib/stripe/errors";
import { getStripeClient } from "@/lib/stripe/server";
import {
  getSubscriptionByProfileId,
  persistSubscriptionStripeCustomerId,
} from "@/lib/supabase/profiles";
import type { Profile, Subscription } from "@/lib/supabase/types";
import type Stripe from "stripe";

const PROFILE_METADATA_KEY = "immifin_profile_id";
const CLERK_METADATA_KEY = "clerk_user_id";
const ENVIRONMENT_METADATA_KEY = "environment";

/**
 * Temporary S7-OPS-DIAG-010 checkout hang instrumentation.
 * Logs checkpoint name + correlation + elapsed ms only — never secrets or Stripe IDs.
 */
export type StripeCheckoutDiag = {
  correlationId: string;
  startedAtMs: number;
};

export function logStripeCheckoutDiag(
  checkpoint: string,
  diag: StripeCheckoutDiag | undefined,
): void {
  if (!diag) {
    return;
  }

  console.log("[stripe-checkout-diag]", {
    checkpoint,
    correlationId: diag.correlationId,
    elapsedMs: Date.now() - diag.startedAtMs,
  });
}

export type GetOrCreateStripeCustomerInput = {
  profile: Profile;
  subscription: Subscription | null;
  /** Temporary S7-OPS-DIAG-010 — optional hang instrumentation only. */
  diag?: StripeCheckoutDiag;
};

function assertTrustedProfile(profile: Profile): void {
  if (!profile.id?.trim()) {
    throw new StripeCustomerError("Profile is required for Stripe customer mapping.", 400);
  }

  if (!profile.email?.trim()) {
    throw new StripeCustomerError("Profile email is required for Stripe customer mapping.", 400);
  }

  if (!profile.clerk_user_id?.trim()) {
    throw new StripeCustomerError("Clerk user identity is required for Stripe customer mapping.", 400);
  }
}

export function getStripeEnvironmentLabel(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

  if (secretKey.startsWith("sk_live_")) {
    return "live";
  }

  if (secretKey.startsWith("sk_test_")) {
    return "test";
  }

  return process.env.NODE_ENV ?? "unknown";
}

/**
 * Deterministic Stripe idempotency key for customer creation.
 * Same profile + environment always yields the same key.
 */
export function buildStripeCustomerIdempotencyKey(profileId: string): string {
  return `immifin:customer:${getStripeEnvironmentLabel()}:${profileId}`;
}

function resolveStripeCustomerName(profile: Profile): string | undefined {
  const displayName = profile.display_name?.trim();
  return displayName || undefined;
}

function escapeStripeSearchValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function customerEnvironmentMatches(
  customer: Stripe.Customer,
  currentEnvironment: string,
): boolean {
  const environment = customer.metadata?.[ENVIRONMENT_METADATA_KEY]?.trim();
  return environment === currentEnvironment;
}

function canReuseStripeCustomer(
  customer: Stripe.Customer,
  profileId: string,
  currentEnvironment: string,
  options: { allowUnmappedProfile: boolean },
): boolean {
  if (!customerEnvironmentMatches(customer, currentEnvironment)) {
    return false;
  }

  const mappedProfileId = customer.metadata?.[PROFILE_METADATA_KEY]?.trim();

  if (!mappedProfileId) {
    return options.allowUnmappedProfile;
  }

  return mappedProfileId === profileId;
}

async function searchStripeCustomerByProfileId(
  stripe: Stripe,
  profileId: string,
  currentEnvironment: string,
  diag?: StripeCheckoutDiag,
): Promise<string | null> {
  logStripeCheckoutDiag("CUSTOMER_SEARCH_PROFILE_START", diag);
  const result = await stripe.customers.search({
    query: `metadata['${PROFILE_METADATA_KEY}']:'${escapeStripeSearchValue(profileId)}'`,
    limit: 5,
  });

  const matches = result.data.filter((customer) =>
    canReuseStripeCustomer(customer, profileId, currentEnvironment, {
      allowUnmappedProfile: false,
    }),
  );

  if (matches.length > 1) {
    console.error("[stripe-customer] multiple reusable customers found for profile mapping lookup");
  }

  logStripeCheckoutDiag("CUSTOMER_SEARCH_PROFILE_COMPLETE", diag);
  return matches[0]?.id ?? null;
}

async function searchStripeCustomerByEmail(
  stripe: Stripe,
  email: string,
  profileId: string,
  currentEnvironment: string,
  diag?: StripeCheckoutDiag,
): Promise<string | null> {
  logStripeCheckoutDiag("CUSTOMER_SEARCH_EMAIL_START", diag);
  const result = await stripe.customers.search({
    query: `email:'${escapeStripeSearchValue(email)}'`,
    limit: 10,
  });

  for (const customer of result.data) {
    if (
      canReuseStripeCustomer(customer, profileId, currentEnvironment, {
        allowUnmappedProfile: true,
      })
    ) {
      logStripeCheckoutDiag("CUSTOMER_SEARCH_EMAIL_COMPLETE", diag);
      return customer.id;
    }
  }

  logStripeCheckoutDiag("CUSTOMER_SEARCH_EMAIL_COMPLETE", diag);
  return null;
}

function buildCustomerMetadata(profile: Profile): Record<string, string> {
  return {
    [PROFILE_METADATA_KEY]: profile.id,
    [CLERK_METADATA_KEY]: profile.clerk_user_id,
    [ENVIRONMENT_METADATA_KEY]: getStripeEnvironmentLabel(),
  };
}

async function createStripeCustomer(
  profile: Profile,
  diag?: StripeCheckoutDiag,
): Promise<string> {
  logStripeCheckoutDiag("CUSTOMER_CREATE_START", diag);
  const stripe = getStripeClient();

  const customer = await stripe.customers.create(
    {
      email: profile.email.trim().toLowerCase(),
      name: resolveStripeCustomerName(profile),
      metadata: buildCustomerMetadata(profile),
    },
    {
      idempotencyKey: buildStripeCustomerIdempotencyKey(profile.id),
    },
  );

  logStripeCheckoutDiag("CUSTOMER_CREATE_COMPLETE", diag);
  return customer.id;
}

async function resolvePersistedStripeCustomerId(profileId: string): Promise<string | null> {
  const subscription = await getSubscriptionByProfileId(profileId);
  const customerId = subscription?.stripe_customer_id?.trim();
  return customerId || null;
}

async function persistStripeCustomerMapping(
  profileId: string,
  customerId: string,
  diag?: StripeCheckoutDiag,
): Promise<string> {
  logStripeCheckoutDiag("CUSTOMER_MAPPING_PERSIST_START", diag);
  try {
    await persistSubscriptionStripeCustomerId(profileId, customerId);
    logStripeCheckoutDiag("CUSTOMER_MAPPING_PERSIST_COMPLETE", diag);
    return customerId;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Database persistence failed.";

    const recoveredCustomerId = await resolvePersistedStripeCustomerId(profileId);

    if (recoveredCustomerId) {
      logStripeCheckoutDiag("CUSTOMER_MAPPING_PERSIST_COMPLETE", diag);
      return recoveredCustomerId;
    }

    if (message.includes("subscriptions_stripe_customer_id_unique")) {
      throw new StripeCustomerError(
        "Stripe customer mapping conflict detected for this account.",
        409,
      );
    }

    console.error("[stripe-customer] failed to persist customer mapping");
    throw new StripeCustomerError("Unable to persist Stripe customer mapping.", 500);
  }
}

/**
 * Returns the trusted Stripe Customer ID for an IMMIFIN profile.
 * Creates at most one Stripe Customer per profile per environment.
 */
export async function getOrCreateStripeCustomer(
  input: GetOrCreateStripeCustomerInput,
): Promise<string> {
  const diag = input.diag;
  logStripeCheckoutDiag("CUSTOMER_RESOLUTION_START", diag);
  assertTrustedProfile(input.profile);

  const existingCustomerId = input.subscription?.stripe_customer_id?.trim();

  if (existingCustomerId) {
    logStripeCheckoutDiag("CUSTOMER_RESOLUTION_COMPLETE", diag);
    return existingCustomerId;
  }

  const profileId = input.profile.id;
  const currentEnvironment = getStripeEnvironmentLabel();
  const email = input.profile.email.trim().toLowerCase();
  const stripe = getStripeClient();

  let customerId =
    (await searchStripeCustomerByProfileId(stripe, profileId, currentEnvironment, diag)) ??
    (await searchStripeCustomerByEmail(stripe, email, profileId, currentEnvironment, diag));

  if (!customerId) {
    customerId = await createStripeCustomer(input.profile, diag);
  }

  const persisted = await persistStripeCustomerMapping(profileId, customerId, diag);
  logStripeCheckoutDiag("CUSTOMER_RESOLUTION_COMPLETE", diag);
  return persisted;
}
