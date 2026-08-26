/**
 * S7-OPS-STRIPE-026 — first-time Checkout skips Stripe Customer Search.
 * Run: node --experimental-strip-types scripts/verify-s7-ops-stripe-026-customer-resolution.mjs
 *  or: npx tsx scripts/verify-s7-ops-stripe-026-customer-resolution.mjs
 */

import Module from "node:module";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const originalLoad = Module._load;

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

const PROFILE_ID = "11111111-2222-4333-8444-555555555555";
const CLERK_USER_ID = "user_test_stripe_026";
const EMAIL = "immifin.free.test+local@example.com";

function baseProfile(overrides = {}) {
  return {
    id: PROFILE_ID,
    clerk_user_id: CLERK_USER_ID,
    email: EMAIL,
    role: "user",
    plan: "free",
    display_name: "Test User",
    avatar_url: null,
    phone_number: null,
    status: "active",
    role_updated_at: null,
    role_updated_by_clerk_user_id: null,
    last_seen_at: null,
    last_login_at: null,
    clerk_synced_at: null,
    created_at: "2026-08-23T00:00:00.000Z",
    updated_at: "2026-08-23T00:00:00.000Z",
    ...overrides,
  };
}

function baseSubscription(overrides = {}) {
  return {
    id: "sub-row",
    profile_id: PROFILE_ID,
    plan: "free",
    status: "inactive",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    billing_interval: null,
    stripe_status: null,
    cancel_at_period_end: false,
    canceled_at: null,
    current_period_start: null,
    current_period_end: null,
    last_synchronized_at: null,
    created_at: "2026-08-23T00:00:00.000Z",
    updated_at: "2026-08-23T00:00:00.000Z",
    ...overrides,
  };
}

async function loadCustomerModule(mocks) {
  const state = {
    searchCalls: 0,
    createCalls: 0,
    lastCreateArgs: null,
    persistCalls: 0,
    lastPersistArgs: null,
    createShouldFail: false,
    persistShouldFail: false,
    persistConflict: false,
    persistedAfterConflict: null,
  };

  Module._load = function (request, parent, isMain) {
    if (request === "server-only") {
      return {};
    }

    if (
      request === "@/lib/stripe/server" ||
      request.endsWith("/lib/stripe/server") ||
      request.includes("lib/stripe/server")
    ) {
      return {
        getStripeClient: () => ({
          customers: {
            search: async () => {
              state.searchCalls += 1;
              return { data: [] };
            },
            create: async (params, options) => {
              state.createCalls += 1;
              state.lastCreateArgs = { params, options };
              if (state.createShouldFail) {
                throw new Error("Stripe create failed");
              }
              return { id: "cus_mock_created_001" };
            },
          },
        }),
      };
    }

    if (
      request === "@/lib/supabase/profiles" ||
      request.endsWith("/lib/supabase/profiles") ||
      request.includes("lib/supabase/profiles")
    ) {
      return {
        getSubscriptionByProfileId: async () =>
          state.persistedAfterConflict
            ? baseSubscription({ stripe_customer_id: state.persistedAfterConflict })
            : null,
        persistSubscriptionStripeCustomerId: async (profileId, customerId) => {
          state.persistCalls += 1;
          state.lastPersistArgs = { profileId, customerId };
          if (state.persistConflict) {
            state.persistedAfterConflict = customerId;
            const err = new Error("subscriptions_stripe_customer_id_unique");
            throw err;
          }
          if (state.persistShouldFail) {
            throw new Error("Database persistence failed.");
          }
          return baseSubscription({ stripe_customer_id: customerId });
        },
      };
    }

    return originalLoad(request, parent, isMain);
  };

  // Bust require cache for customer module between scenarios
  const customerPath = require.resolve("../lib/stripe/customer.ts");
  delete require.cache[customerPath];

  const mod = await import(
    `${pathToFileURL(customerPath).href}?t=${Date.now()}&n=${Math.random()}`
  );

  if (mocks?.createShouldFail) state.createShouldFail = true;
  if (mocks?.persistShouldFail) state.persistShouldFail = true;
  if (mocks?.persistConflict) state.persistConflict = true;

  return { mod, state };
}

async function main() {
  process.env.STRIPE_SECRET_KEY = "sk_test_verify_s7_ops_stripe_026_not_a_real_secret";

  // --- Pure idempotency key checks (no Stripe) ---
  {
    const { mod } = await loadCustomerModule();
    const key1 = mod.buildStripeCustomerIdempotencyKey(PROFILE_ID);
    const key2 = mod.buildStripeCustomerIdempotencyKey(PROFILE_ID);
    assert("idempotency key stable for same profile", key1 === key2);
    assert(
      "idempotency key includes profile id",
      key1.includes(PROFILE_ID) && key1.startsWith("immifin:customer:"),
    );
    assert("environment label is test for sk_test_", mod.getStripeEnvironmentLabel() === "test");
    assert(
      "idempotency key embeds test environment",
      key1 === `immifin:customer:test:${PROFILE_ID}`,
    );
  }

  // --- Mapped customer reuse (no search, no create) ---
  {
    const { mod, state } = await loadCustomerModule();
    const id = await mod.getOrCreateStripeCustomer({
      profile: baseProfile(),
      subscription: baseSubscription({ stripe_customer_id: "cus_already_mapped" }),
    });
    assert("mapped customer reused", id === "cus_already_mapped");
    assert("mapped path does not call customers.search", state.searchCalls === 0);
    assert("mapped path does not call customers.create", state.createCalls === 0);
    assert("mapped path does not persist", state.persistCalls === 0);
  }

  // --- Unmapped first-time path: create, no search ---
  {
    const { mod, state } = await loadCustomerModule();
    const checkpoints = [];
    const originalLog = console.log;
    console.log = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0] === "[stripe-checkout-diag]" &&
        args[1]?.checkpoint
      ) {
        checkpoints.push(args[1].checkpoint);
      }
    };

    const diag = { correlationId: "verify-026", startedAtMs: Date.now() };
    const id = await mod.getOrCreateStripeCustomer({
      profile: baseProfile(),
      subscription: baseSubscription({ stripe_customer_id: null }),
      diag,
    });
    console.log = originalLog;

    assert("unmapped creates customer", id === "cus_mock_created_001");
    assert("unmapped path does NOT call customers.search", state.searchCalls === 0);
    assert("unmapped path calls customers.create once", state.createCalls === 1);
    assert(
      "create uses stable idempotency key",
      state.lastCreateArgs?.options?.idempotencyKey ===
        `immifin:customer:test:${PROFILE_ID}`,
    );
    assert(
      "create metadata includes profile id",
      state.lastCreateArgs?.params?.metadata?.immifin_profile_id === PROFILE_ID,
    );
    assert("mapping persisted once", state.persistCalls === 1);
    assert(
      "persist receives created customer id",
      state.lastPersistArgs?.customerId === "cus_mock_created_001",
    );
    assert(
      "diag includes CREATE without SEARCH",
      checkpoints.includes("CUSTOMER_CREATE_START") &&
        checkpoints.includes("CUSTOMER_CREATE_COMPLETE") &&
        checkpoints.includes("CUSTOMER_MAPPING_PERSIST_COMPLETE") &&
        checkpoints.includes("CUSTOMER_RESOLUTION_COMPLETE") &&
        !checkpoints.includes("CUSTOMER_SEARCH_PROFILE_START") &&
        !checkpoints.includes("CUSTOMER_SEARCH_EMAIL_START"),
    );

    // Search helpers still exist for non-checkout reconciliation
    assert(
      "search helpers preserved for non-checkout use",
      typeof mod.searchReusableStripeCustomerByProfileId === "function" &&
        typeof mod.searchReusableStripeCustomerByEmail === "function",
    );
  }

  // --- Create failure surfaces ---
  {
    const { mod, state } = await loadCustomerModule({ createShouldFail: true });
    let threw = false;
    try {
      await mod.getOrCreateStripeCustomer({
        profile: baseProfile(),
        subscription: baseSubscription(),
      });
    } catch {
      threw = true;
    }
    assert("customer create failure throws", threw);
    assert("failed create never searched", state.searchCalls === 0);
    assert("failed create did not persist", state.persistCalls === 0);
  }

  // --- Persist conflict recovers existing mapping ---
  {
    const { mod, state } = await loadCustomerModule({ persistConflict: true });
    const id = await mod.getOrCreateStripeCustomer({
      profile: baseProfile(),
      subscription: baseSubscription(),
    });
    assert("persist conflict recovers mapped id", id === "cus_mock_created_001");
    assert("persist was attempted", state.persistCalls === 1);
  }

  console.log("\nS7-OPS-STRIPE-026 verify: PASS");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    Module._load = originalLoad;
  });
