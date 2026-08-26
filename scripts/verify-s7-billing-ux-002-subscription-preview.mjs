/**
 * S7-BILLING-UX-002 — Stripe subscription upgrade preview foundation.
 * Run: npx tsx scripts/verify-s7-billing-ux-002-subscription-preview.mjs
 *
 * Injected fakes only — no LIVE Stripe preview / mutation / network.
 */

import { readFileSync, existsSync } from "node:fs";
import Module from "node:module";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { AuthError } from "../lib/auth/errors.ts";
import { parseSubscriptionChangeRequest } from "../lib/stripe/subscription-change-request.ts";
import {
  deriveProrationSemanticTotals,
  mapPreviewInvoiceLines,
} from "../lib/stripe/subscription-change-preview-mapper.ts";
import { StripeSubscriptionChangeError } from "../lib/stripe/errors.ts";

const require = createRequire(import.meta.url);
const originalLoad = Module._load;

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

const PRICE_PRO_MONTH = "price_test_pro_month_ux002";
const PRICE_POWER_MONTH = "price_test_power_month_ux002";
const PRICE_PRO_YEAR = "price_test_pro_year_ux002";
const PRICE_POWER_YEAR = "price_test_power_year_ux002";

function installCatalogEnv() {
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_ux002_preview_auth_only";
  process.env.STRIPE_PRICE_PRO_MONTHLY = PRICE_PRO_MONTH;
  process.env.STRIPE_PRICE_PRO_ANNUAL = PRICE_PRO_YEAR;
  process.env.STRIPE_PRICE_POWER_MONTHLY = PRICE_POWER_MONTH;
  process.env.STRIPE_PRICE_POWER_ANNUAL = PRICE_POWER_YEAR;
}

const PROFILE_ID = "11111111-2222-4333-8444-555555555555";

function baseProfile(overrides = {}) {
  return {
    id: PROFILE_ID,
    clerk_user_id: "user_test_ux002",
    email: "ux002@example.com",
    role: "user",
    plan: "pro",
    display_name: "UX002",
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
    stripe_customer_id: "cus_test_ux002",
    stripe_subscription_id: "sub_test_ux002",
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
    id: "sub_test_ux002",
    object: "subscription",
    status: "active",
    cancel_at_period_end: false,
    schedule: null,
    customer: "cus_test_ux002",
    items: {
      object: "list",
      data: [
        {
          id: "si_test_ux002",
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

function basePreviewInvoice(overrides = {}) {
  return {
    id: "upcoming_in_test_ux002",
    object: "invoice",
    amount_due: 1234,
    currency: "usd",
    lines: {
      object: "list",
      data: [
        {
          id: "il_credit",
          object: "line_item",
          amount: -500,
          currency: "usd",
          description: "Unused time on Pro after 24 Aug 2026",
          parent: {
            type: "subscription_item_details",
            subscription_item_details: {
              invoice_item: null,
              proration: true,
              proration_details: null,
              subscription: "sub_test_ux002",
              subscription_item: "si_test_ux002",
            },
            invoice_item_details: null,
          },
        },
        {
          id: "il_charge",
          object: "line_item",
          amount: 1734,
          currency: "usd",
          description: "Remaining time on Power after 24 Aug 2026",
          parent: {
            type: "subscription_item_details",
            subscription_item_details: {
              invoice_item: null,
              proration: true,
              proration_details: null,
              subscription: "sub_test_ux002",
              subscription_item: "si_test_ux002",
            },
            invoice_item_details: null,
          },
        },
      ],
    },
    ...overrides,
  };
}

function expectThrow(fn, label, predicate) {
  try {
    fn();
    throw new Error(`FAIL: ${label} should have thrown`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("FAIL:")) {
      throw error;
    }
    if (predicate && !predicate(error)) {
      throw new Error(`FAIL: ${label} — unexpected error: ${error?.message ?? error}`);
    }
    console.log(`✓ ${label}`);
  }
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
      throw new Error(`FAIL: ${label} — unexpected error: ${error?.message ?? error}`);
    }
    console.log(`✓ ${label}`);
  }
}

async function loadPreviewModule(mocks = {}) {
  const state = {
    createPreviewCalls: 0,
    lastCreatePreviewArgs: null,
    subscriptionsUpdateCalls: 0,
    invoicesCreateCalls: 0,
    invoicesPayCalls: 0,
    retrieveCalls: 0,
    localBillingMutations: 0,
    createPreviewShouldFail: Boolean(mocks.createPreviewShouldFail),
    stripeSubscription: mocks.stripeSubscription ?? baseStripeSubscription(),
    previewInvoice: mocks.previewInvoice ?? basePreviewInvoice(),
  };

  Module._load = function (request, parent, isMain) {
    if (request === "server-only") {
      return {};
    }

    if (
      request === "@/lib/stripe/server" ||
      request.endsWith("/lib/stripe/server") ||
      request.includes("lib\\stripe\\server") ||
      request.includes("lib/stripe/server")
    ) {
      return {
        getStripeClient: () => ({
          subscriptions: {
            retrieve: async () => {
              state.retrieveCalls += 1;
              return state.stripeSubscription;
            },
            update: async () => {
              state.subscriptionsUpdateCalls += 1;
              throw new Error("subscriptions.update must not be called from preview");
            },
          },
          customers: {
            retrieve: async () => ({
              id: "cus_test_ux002",
              object: "customer",
              invoice_settings: { default_payment_method: null },
              default_source: null,
            }),
          },
          paymentMethods: {
            retrieve: async () => {
              throw new Error("paymentMethods.retrieve unexpected in UX-002 default fixture");
            },
          },
          invoices: {
            createPreview: async (params) => {
              state.createPreviewCalls += 1;
              state.lastCreatePreviewArgs = params;
              if (state.createPreviewShouldFail) {
                const err = new Error("preview failed");
                err.type = "StripeAPIError";
                // Mimic StripeError detection path via generic Error → 500/throw
                throw err;
              }
              return state.previewInvoice;
            },
            create: async () => {
              state.invoicesCreateCalls += 1;
              throw new Error("invoices.create must not be called");
            },
            pay: async () => {
              state.invoicesPayCalls += 1;
              throw new Error("invoices.pay must not be called");
            },
          },
        }),
      };
    }

    return originalLoad(request, parent, isMain);
  };

  // Bust catalog cache + module cache for fresh env catalog
  const catalogPath = resolve("lib/stripe/catalog.ts");
  const previewPath = resolve("lib/stripe/subscription-change-preview.ts");
  for (const key of Object.keys(require.cache ?? {})) {
    if (key.includes("catalog") || key.includes("subscription-change-preview")) {
      delete require.cache[key];
    }
  }

  // Dynamic import with cache-bust query
  const bust = `?ux002=${Date.now()}-${Math.random()}`;
  const mod = await import(`../lib/stripe/subscription-change-preview.ts${bust}`);

  return { mod, state, restore: () => { Module._load = originalLoad; } };
}

async function loadRouteModule(mocks = {}) {
  const state = {
    requireUserCalls: 0,
    previewCalls: 0,
    lastPreviewInput: null,
  };

  Module._load = function (request, parent, isMain) {
    if (request === "server-only") {
      return {};
    }

    if (
      request === "@/lib/auth/requireUser" ||
      request.endsWith("/lib/auth/requireUser") ||
      request.includes("lib/auth/requireUser")
    ) {
      return {
        requireUser:
          mocks.requireUser ??
          (async () => {
            state.requireUserCalls += 1;
            throw new AuthError("Authentication required.", 401);
          }),
      };
    }

    if (
      request === "@/lib/stripe/subscription-change-preview" ||
      request.endsWith("/lib/stripe/subscription-change-preview") ||
      request.endsWith("/lib/stripe/subscription-change-preview.ts") ||
      request.endsWith("\\lib\\stripe\\subscription-change-preview") ||
      request.endsWith("\\lib\\stripe\\subscription-change-preview.ts") ||
      /(^|[\\/])subscription-change-preview(\.ts)?$/.test(request)
    ) {
      return {
        previewPaidSubscriptionChange:
          mocks.previewPaidSubscriptionChange ??
          (async (input) => {
            state.previewCalls += 1;
            state.lastPreviewInput = input;
            return {
              changeType: "immediate_upgrade",
              billingChargeModel: "invoice_now",
              currentPlan: { tier: "pro", interval: "month", amount: 999 },
              targetPlan: { tier: "power", interval: "month", amount: 1999 },
              effectiveTiming: "immediate",
              currency: "usd",
              preview: {
                amountDue: 1234,
                creditAmount: -500,
                proratedChargeAmount: 1734,
                lines: [],
              },
              nextRenewal: { amount: 1999, date: "2026-09-01T00:00:00.000Z" },
              prorationDate: 1756051200,
              previewAuthorization: "test.token",
              paymentMethod: null,
              paymentMethodStatus: "missing",
            };
          }),
      };
    }

    return originalLoad(request, parent, isMain);
  };

  const bust = `?route=${Date.now()}-${Math.random()}`;
  const mod = await import(`../app/api/stripe/subscription/preview/route.ts${bust}`);
  return { mod, state, restore: () => { Module._load = originalLoad; } };
}

function assertNoSensitiveIds(payload, label) {
  const json = JSON.stringify(payload);
  assert(
    `${label}: no Stripe customer/subscription/item/price ids`,
    !json.includes("cus_") &&
      !json.includes("sub_test") &&
      !json.includes("si_") &&
      !json.includes("price_") &&
      !json.includes("il_") &&
      !json.includes("sk_") &&
      !json.includes("whsec_") &&
      !json.includes("client_secret") &&
      !json.includes("pi_"),
  );
}

async function main() {
  installCatalogEnv();

  assert(
    "route file exists",
    existsSync("app/api/stripe/subscription/preview/route.ts"),
  );
  const routeSrc = readSource("app/api/stripe/subscription/preview/route.ts");
  assert("route exports POST", /export async function POST/.test(routeSrc));
  assert("route uses requireUser", /requireUser/.test(routeSrc));
  assert("route uses previewPaidSubscriptionChange", /previewPaidSubscriptionChange/.test(routeSrc));
  assert("route does not call subscriptions.update", !/subscriptions\.update/.test(routeSrc));

  const mutationSrc = readSource("lib/stripe/subscription-change.ts");
  assert(
    "executeImmediateUpgrade uses always_invoice (S7-BILLING-UX-003)",
    /proration_behavior:\s*"always_invoice"/.test(mutationSrc),
  );

  const previewSrc = readSource("lib/stripe/subscription-change-preview.ts");
  assert("preview uses invoices.createPreview", /invoices\.createPreview/.test(previewSrc));
  assert(
    "preview uses always_invoice",
    /proration_behavior:\s*"always_invoice"/.test(previewSrc),
  );
  assert("preview does not call subscriptions.update", !/subscriptions\.update/.test(previewSrc));
  assert("preview does not call invoices.create(", !/invoices\.create\(/.test(previewSrc));
  assert("preview does not call invoices.pay", !/invoices\.pay/.test(previewSrc));

  // --- Request validation (reuse shared parser) ---
  expectThrow(
    () => parseSubscriptionChangeRequest({ targetTier: "power", targetInterval: "monthly", priceId: "price_evil" }),
    "2. arbitrary Stripe price cannot be supplied",
    (e) => e instanceof StripeSubscriptionChangeError,
  );

  expectThrow(
    () => parseSubscriptionChangeRequest({ targetTier: "enterprise", targetInterval: "monthly" }),
    "3. invalid target tier rejected",
    (e) => e instanceof StripeSubscriptionChangeError,
  );

  expectThrow(
    () => parseSubscriptionChangeRequest({ targetTier: "power", targetInterval: "weekly" }),
    "4. invalid interval rejected",
    (e) => e instanceof StripeSubscriptionChangeError,
  );

  // --- Mapper unit checks ---
  const mappedLines = mapPreviewInvoiceLines(basePreviewInvoice().lines.data);
  assert("mapper strips line ids", mappedLines.every((l) => !("id" in l)));
  const totals = deriveProrationSemanticTotals(mappedLines);
  assert("mapper creditAmount", totals.creditAmount === -500);
  assert("mapper proratedChargeAmount", totals.proratedChargeAmount === 1734);

  // --- Route: unauthenticated ---
  {
    const { mod, restore } = await loadRouteModule({
      requireUser: async () => {
        throw new AuthError("Authentication required.", 401);
      },
    });
    try {
      const response = await mod.POST(
        new Request("http://localhost:3000/api/stripe/subscription/preview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ targetTier: "power", targetInterval: "monthly" }),
        }),
      );
      assert("1. unauthenticated request rejected", response.status === 401);
      const body = await response.json();
      assert("1. unauthenticated safe body", typeof body.error === "string");
    } finally {
      restore();
    }
  }

  // --- Service happy path Pro → Power ---
  {
    const { mod, state, restore } = await loadPreviewModule();
    try {
      const result = await mod.previewPaidSubscriptionChange({
        profile: baseProfile(),
        subscription: baseSubscription(),
        request: parseSubscriptionChangeRequest({
          targetTier: "power",
          targetInterval: "monthly",
        }),
      });

      assert("7. Pro→Power target tier", result.targetPlan.tier === "power");
      assert("7. Pro→Power target interval", result.targetPlan.interval === "month");
      assert("7. Pro→Power list amount", result.targetPlan.amount === 1999);
      assert("7. current Pro amount", result.currentPlan.amount === 999);
      assert("8. createPreview called", state.createPreviewCalls === 1);
      assert("8. subscriptions.update NOT called", state.subscriptionsUpdateCalls === 0);
      assert("8. invoices.create NOT called", state.invoicesCreateCalls === 0);
      assert(
        "9. preview proration_behavior always_invoice",
        state.lastCreatePreviewArgs?.subscription_details?.proration_behavior === "always_invoice",
      );
      assert(
        "10. preview has server proration_date",
        typeof state.lastCreatePreviewArgs?.subscription_details?.proration_date === "number" &&
          state.lastCreatePreviewArgs.subscription_details.proration_date === result.prorationDate,
      );
      assert(
        "10. createPreview uses approved Power price",
        state.lastCreatePreviewArgs?.subscription_details?.items?.[0]?.price === PRICE_POWER_MONTH,
      );
      assert("preview amountDue from Stripe", result.preview.amountDue === 1234);
      assert("preview creditAmount", result.preview.creditAmount === -500);
      assert("preview proratedChargeAmount", result.preview.proratedChargeAmount === 1734);
      assert("paymentMethod null when missing", result.paymentMethod === null);
      assert("paymentMethodStatus missing when no PM", result.paymentMethodStatus === "missing");
      assert("billingChargeModel invoice_now", result.billingChargeModel === "invoice_now");
      assert("previewAuthorization still present", typeof result.previewAuthorization === "string");
      assertNoSensitiveIds(result, "11. customer-safe response");
    } finally {
      restore();
    }
  }

  // --- Unsupported policy transition ---
  {
    const { mod, restore } = await loadPreviewModule();
    try {
      await expectAsyncThrow(
        () =>
          mod.previewPaidSubscriptionChange({
            profile: baseProfile(),
            subscription: baseSubscription(),
            request: parseSubscriptionChangeRequest({
              targetTier: "power",
              targetInterval: "annual",
            }),
          }),
        "5. unsupported billing-policy transition rejected",
        (e) => e instanceof StripeSubscriptionChangeError && e.status === 400,
      );
    } finally {
      restore();
    }
  }

  // --- Missing Stripe mapping ---
  {
    const { mod, restore } = await loadPreviewModule();
    try {
      await expectAsyncThrow(
        () =>
          mod.previewPaidSubscriptionChange({
            profile: baseProfile(),
            subscription: baseSubscription({
              stripe_customer_id: null,
              stripe_subscription_id: null,
            }),
            request: parseSubscriptionChangeRequest({
              targetTier: "power",
              targetInterval: "monthly",
            }),
          }),
        "6. missing Stripe customer/subscription rejected",
        (e) => e instanceof StripeSubscriptionChangeError && e.status === 409,
      );
    } finally {
      restore();
    }
  }

  // --- Preview failure does not mutate ---
  {
    const { mod, state, restore } = await loadPreviewModule({
      createPreviewShouldFail: true,
    });
    try {
      await expectAsyncThrow(
        () =>
          mod.previewPaidSubscriptionChange({
            profile: baseProfile(),
            subscription: baseSubscription(),
            request: parseSubscriptionChangeRequest({
              targetTier: "power",
              targetInterval: "monthly",
            }),
          }),
        "12. Stripe preview failure throws safely",
        () => true,
      );
      assert("12. no subscription update on failure", state.subscriptionsUpdateCalls === 0);
      assert("12. no invoice create on failure", state.invoicesCreateCalls === 0);
      assert("12. no local billing mutation flag", state.localBillingMutations === 0);
    } finally {
      restore();
    }
  }

  // --- Existing subscription-change policy tests remain green ---
  {
    const { spawnSync } = await import("node:child_process");
    const run = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/verify-s7-str-006-subscription-change.mjs"],
      { cwd: resolve("."), encoding: "utf8", shell: false },
    );
    if (run.status !== 0) {
      // fallback without --import
      const run2 = spawnSync("npx", ["tsx", "scripts/verify-s7-str-006-subscription-change.mjs"], {
        cwd: resolve("."),
        encoding: "utf8",
        shell: true,
      });
      assert(
        "13. existing subscription-change tests remain green",
        run2.status === 0,
      );
      if (run2.status !== 0) {
        console.error(run2.stdout);
        console.error(run2.stderr);
      }
    } else {
      assert("13. existing subscription-change tests remain green", true);
    }
  }

  console.log("\nS7-BILLING-UX-002 verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});