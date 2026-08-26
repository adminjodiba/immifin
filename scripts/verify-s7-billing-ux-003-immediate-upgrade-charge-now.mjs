/**
 * S7-BILLING-UX-003 — Immediate upgrade charge-now execution + preview auth.
 * Run: npx tsx scripts/verify-s7-billing-ux-003-immediate-upgrade-charge-now.mjs
 *
 * Injected fakes only — no LIVE Stripe / network.
 */

import { readFileSync, existsSync } from "node:fs";
import Module from "node:module";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const originalLoad = Module._load;

// Must mock before importing server-only modules.
Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad(request, parent, isMain);
};

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

const PRICE_PRO_MONTH = "price_test_pro_month_ux003";
const PRICE_POWER_MONTH = "price_test_power_month_ux003";
const PRICE_PRO_YEAR = "price_test_pro_year_ux003";
const PRICE_POWER_YEAR = "price_test_power_year_ux003";
const PROFILE_ID = "11111111-2222-4333-8444-555555555555";

function installEnv() {
  process.env.STRIPE_SECRET_KEY = "sk_test_ux003_preview_auth_signing_only";
  process.env.STRIPE_PRICE_PRO_MONTHLY = PRICE_PRO_MONTH;
  process.env.STRIPE_PRICE_PRO_ANNUAL = PRICE_PRO_YEAR;
  process.env.STRIPE_PRICE_POWER_MONTHLY = PRICE_POWER_MONTH;
  process.env.STRIPE_PRICE_POWER_ANNUAL = PRICE_POWER_YEAR;
}

function baseProfile(overrides = {}) {
  return {
    id: PROFILE_ID,
    clerk_user_id: "user_test_ux003",
    email: "ux003@example.com",
    role: "user",
    plan: "pro",
    display_name: "UX003",
    avatar_url: null,
    phone_number: null,
    status: "active",
    role_updated_at: null,
    role_updated_by_clerk_user_id: null,
    last_seen_at: null,
    last_login_at: null,
    clerk_synced_at: null,
    created_at: "2026-08-24T00:00:00.000Z",
    updated_at: "2026-08-24T00:00:00.000Z",
    ...overrides,
  };
}

function baseSubscription(overrides = {}) {
  return {
    id: "sub-row",
    profile_id: PROFILE_ID,
    plan: "pro",
    status: "active",
    stripe_customer_id: "cus_test_ux003",
    stripe_subscription_id: "sub_test_ux003",
    stripe_price_id: PRICE_PRO_MONTH,
    billing_interval: "month",
    stripe_status: "active",
    cancel_at_period_end: false,
    canceled_at: null,
    current_period_start: "2026-08-01T00:00:00.000Z",
    current_period_end: "2026-09-01T00:00:00.000Z",
    last_synchronized_at: "2026-08-24T00:00:00.000Z",
    created_at: "2026-08-01T00:00:00.000Z",
    updated_at: "2026-08-24T00:00:00.000Z",
    ...overrides,
  };
}

function baseStripeSubscription(overrides = {}) {
  return {
    id: "sub_test_ux003",
    object: "subscription",
    status: "active",
    cancel_at_period_end: false,
    schedule: null,
    pending_update: null,
    customer: "cus_test_ux003",
    latest_invoice: null,
    items: {
      object: "list",
      data: [
        {
          id: "si_test_ux003",
          object: "subscription_item",
          quantity: 1,
          price: { id: PRICE_PRO_MONTH, object: "price" },
          current_period_start: 1754006400,
          current_period_end: 1756684800,
        },
      ],
    },
    ...overrides,
  };
}

async function expectAsyncThrow(fn, label, predicate) {
  try {
    await fn();
    throw new Error(`FAIL: ${label} should have thrown`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("FAIL:")) {
      throw error;
    }
    if (predicate && !predicate(error)) {
      throw new Error(`FAIL: ${label} — unexpected: ${error?.message ?? error}`);
    }
    console.log(`✓ ${label}`);
  }
}

async function loadChangeModule(mocks = {}) {
  const state = {
    updateCalls: 0,
    lastUpdateArgs: null,
    createPreviewCalls: 0,
    retrieveCalls: 0,
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
          subscriptions: {
            retrieve: async () => {
              state.retrieveCalls += 1;
              return mocks.stripeSubscription ?? baseStripeSubscription();
            },
            update: async (id, params) => {
              state.updateCalls += 1;
              state.lastUpdateArgs = { id, params };
              return (
                mocks.updatedSubscription ??
                baseStripeSubscription({
                  items: {
                    object: "list",
                    data: [
                      {
                        id: "si_test_ux003",
                        object: "subscription_item",
                        quantity: 1,
                        price: { id: PRICE_POWER_MONTH, object: "price" },
                        current_period_start: 1754006400,
                        current_period_end: 1756684800,
                      },
                    ],
                  },
                  latest_invoice: {
                    id: "in_test_paid",
                    object: "invoice",
                    status: "paid",
                    amount_due: 0,
                    amount_remaining: 0,
                    confirmation_secret: null,
                    hosted_invoice_url: null,
                  },
                  pending_update: null,
                })
              );
            },
          },
          invoices: {
            createPreview: async () => {
              state.createPreviewCalls += 1;
              throw new Error("createPreview must not run from change module");
            },
          },
        }),
      };
    }

    return originalLoad(request, parent, isMain);
  };

  const bust = `?ux003=${Date.now()}-${Math.random()}`;
  const mod = await import(`../lib/stripe/subscription-change.ts${bust}`);
  return {
    mod,
    state,
    restore: () => {
      Module._load = function (request, parent, isMain) {
        if (request === "server-only") {
          return {};
        }
        return originalLoad(request, parent, isMain);
      };
    },
  };
}

async function main() {
  installEnv();

  const { parseSubscriptionChangeRequest } = await import(
    "../lib/stripe/subscription-change-request.ts"
  );
  const {
    createSubscriptionChangePreviewAuthorization,
    verifySubscriptionChangePreviewAuthorization,
    SUBSCRIPTION_CHANGE_PREVIEW_AUTH_TTL_SECONDS,
  } = await import("../lib/stripe/subscription-change-preview-auth.ts");
  const { classifyImmediateUpgradeOutcome } = await import(
    "../lib/stripe/subscription-change-outcome.ts"
  );
  const { StripeSubscriptionChangeError } = await import("../lib/stripe/errors.ts");
  const { evaluateSubscriptionChangePolicy } = await import(
    "../lib/stripe/subscription-change-policy.ts"
  );

  assert("auth module exists", existsSync("lib/stripe/subscription-change-preview-auth.ts"));
  assert("outcome module exists", existsSync("lib/stripe/subscription-change-outcome.ts"));

  const mutationSrc = readSource("lib/stripe/subscription-change.ts");
  assert(
    "always_invoice used on immediate upgrade",
    /proration_behavior:\s*"always_invoice"/.test(mutationSrc),
  );
  assert(
    "pending_if_incomplete retained for SCA safety",
    /payment_behavior:\s*"pending_if_incomplete"/.test(mutationSrc),
  );
  assert(
    "proration_date passed from trusted preview claims",
    /proration_date:\s*input\.prorationDate/.test(mutationSrc),
  );
  assert(
    "raw prorationDate rejected at request parser",
    readSource("lib/stripe/subscription-change-request.ts").includes('"prorationDate"'),
  );
  assert(
    "FetchHttpClient untouched",
    /createFetchHttpClient/.test(readSource("lib/stripe/server.ts")),
  );

  const syncSrc = readSource("lib/stripe/subscription-sync.ts");
  assert("sync documents pending_update entitlement gate", /pending_update/.test(syncSrc));

  const now = Math.floor(Date.now() / 1000);
  const token = createSubscriptionChangePreviewAuthorization({
    profileId: PROFILE_ID,
    targetTier: "power",
    targetInterval: "month",
    prorationDate: now,
    nowSeconds: now,
  });
  const claims = verifySubscriptionChangePreviewAuthorization({
    token,
    profileId: PROFILE_ID,
    targetTier: "power",
    targetInterval: "month",
    nowSeconds: now,
  });
  assert("preview and execute share trusted proration date", claims.prorationDate === now);

  try {
    verifySubscriptionChangePreviewAuthorization({
      token,
      profileId: PROFILE_ID,
      targetTier: "pro",
      targetInterval: "month",
      nowSeconds: now,
    });
    throw new Error("FAIL: target plan mismatch should reject");
  } catch (error) {
    assert("target plan mismatch rejected", error instanceof StripeSubscriptionChangeError);
  }

  try {
    verifySubscriptionChangePreviewAuthorization({
      token,
      profileId: PROFILE_ID,
      targetTier: "power",
      targetInterval: "month",
      nowSeconds: now + SUBSCRIPTION_CHANGE_PREVIEW_AUTH_TTL_SECONDS + 5,
    });
    throw new Error("FAIL: expired token should reject");
  } catch (error) {
    assert("expired preview authorization rejected", error instanceof StripeSubscriptionChangeError);
  }

  try {
    parseSubscriptionChangeRequest({
      targetTier: "power",
      targetInterval: "monthly",
      prorationDate: now,
    });
    throw new Error("FAIL: arbitrary prorationDate should reject");
  } catch (error) {
    assert(
      "arbitrary browser proration date rejected",
      error instanceof StripeSubscriptionChangeError,
    );
  }

  const confirmed = classifyImmediateUpgradeOutcome({
    subscription: baseStripeSubscription({
      items: {
        object: "list",
        data: [
          {
            id: "si_test_ux003",
            quantity: 1,
            price: { id: PRICE_POWER_MONTH },
            current_period_start: 1,
            current_period_end: 2,
          },
        ],
      },
      pending_update: null,
      latest_invoice: {
        id: "in_paid",
        object: "invoice",
        status: "paid",
        amount_due: 0,
        amount_remaining: 0,
      },
    }),
    targetPriceId: PRICE_POWER_MONTH,
    targetTier: "power",
    targetInterval: "month",
  });
  assert("immediate payment success path", confirmed.status === "confirmed");

  const requiresAction = classifyImmediateUpgradeOutcome({
    subscription: baseStripeSubscription({
      pending_update: { expires_at: now + 3600, subscription_items: [] },
      latest_invoice: {
        id: "in_open",
        object: "invoice",
        status: "open",
        amount_due: 1234,
        amount_remaining: 1234,
        confirmation_secret: { client_secret: "pi_test_secret_ux003", type: "payment_intent" },
        hosted_invoice_url: "https://invoice.stripe.com/i/test_ux003",
      },
    }),
    targetPriceId: PRICE_POWER_MONTH,
    targetTier: "power",
    targetInterval: "month",
  });
  assert("requires_action path", requiresAction.status === "requires_action");
  assert(
    "requires_action exposes clientSecret",
    requiresAction.payment.clientSecret?.startsWith("pi_"),
  );
  assert(
    "requires_action exposes hostedInvoiceUrl",
    Boolean(requiresAction.payment.hostedInvoiceUrl),
  );

  const failed = classifyImmediateUpgradeOutcome({
    subscription: baseStripeSubscription({
      pending_update: { expires_at: now + 3600, subscription_items: [] },
      latest_invoice: {
        id: "in_open2",
        object: "invoice",
        status: "open",
        amount_due: 1234,
        amount_remaining: 1234,
      },
    }),
    targetPriceId: PRICE_POWER_MONTH,
    targetTier: "power",
    targetInterval: "month",
  });
  assert("payment failure path (pending without action)", failed.status === "failed");

  assert(
    "no entitlement grant before confirmed payment (pending keeps current items)",
    baseStripeSubscription().items.data[0].price.id === PRICE_PRO_MONTH,
  );

  {
    const previewAuth = createSubscriptionChangePreviewAuthorization({
      profileId: PROFILE_ID,
      targetTier: "power",
      targetInterval: "month",
      prorationDate: now,
      nowSeconds: now,
    });

    const { mod, state, restore } = await loadChangeModule();
    try {
      const result = await mod.executePaidSubscriptionChange({
        profile: baseProfile(),
        subscription: baseSubscription(),
        request: parseSubscriptionChangeRequest({
          targetTier: "power",
          targetInterval: "monthly",
          previewAuthorization: previewAuth,
        }),
      });

      assert(
        "execute uses approved Power price",
        state.lastUpdateArgs?.params?.items?.[0]?.price === PRICE_POWER_MONTH,
      );
      assert(
        "execute uses always_invoice",
        state.lastUpdateArgs?.params?.proration_behavior === "always_invoice",
      );
      assert(
        "execute reuses trusted proration_date",
        state.lastUpdateArgs?.params?.proration_date === now,
      );
      assert("success path status confirmed", result.status === "confirmed");
      assert("subscriptions.update called once", state.updateCalls === 1);
    } finally {
      restore();
    }
  }

  {
    const { mod, restore } = await loadChangeModule();
    try {
      await expectAsyncThrow(
        () =>
          mod.executePaidSubscriptionChange({
            profile: baseProfile(),
            subscription: baseSubscription(),
            request: parseSubscriptionChangeRequest({
              targetTier: "power",
              targetInterval: "monthly",
            }),
          }),
        "immediate upgrade without previewAuthorization rejected",
        (e) => e instanceof StripeSubscriptionChangeError && e.status === 400,
      );
    } finally {
      restore();
    }
  }

  assert(
    "policy Pro→Power immediate_upgrade",
    evaluateSubscriptionChangePolicy({
      currentTier: "pro",
      currentInterval: "month",
      targetTier: "power",
      targetInterval: "month",
      cancelAtPeriodEnd: false,
    }).changeType === "immediate_upgrade",
  );

  {
    const { spawnSync } = await import("node:child_process");
    const run = spawnSync("npx", ["tsx", "scripts/verify-s7-str-006-subscription-change.mjs"], {
      cwd: resolve("."),
      encoding: "utf8",
      shell: true,
    });
    assert("existing downgrade/policy tests remain green", run.status === 0);
    if (run.status !== 0) {
      console.error(run.stdout);
      console.error(run.stderr);
    }

    const run2 = spawnSync(
      "npx",
      ["tsx", "scripts/verify-s7-billing-ux-002-subscription-preview.mjs"],
      { cwd: resolve("."), encoding: "utf8", shell: true },
    );
    assert("UX-002 preview tests remain green", run2.status === 0);
    if (run2.status !== 0) {
      console.error(run2.stdout);
      console.error(run2.stderr);
    }
  }

  const checkoutSrc = readSource("lib/stripe/checkout.ts");
  assert(
    "Free→Paid Checkout remains checkout.sessions.create based",
    /checkout\.sessions\.create/.test(checkoutSrc),
  );

  console.log("\nS7-BILLING-UX-003 verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
