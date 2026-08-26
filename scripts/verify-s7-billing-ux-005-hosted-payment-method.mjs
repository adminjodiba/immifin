/**
 * S7-BILLING-UX-005 — Stripe-hosted change/add payment method (Billing Portal).
 * Run: npx tsx scripts/verify-s7-billing-ux-005-hosted-payment-method.mjs
 *
 * Injected fakes only — no LIVE Stripe / network / subscription mutation.
 */

import { readFileSync, existsSync } from "node:fs";
import Module from "node:module";
import { resolve } from "node:path";

const originalLoad = Module._load;
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

function assertSource(relPath, needle, label = `${relPath} contains ${needle}`) {
  assert(label, readSource(relPath).includes(needle));
}

function assertSourceAbsent(relPath, needle, label = `${relPath} lacks ${needle}`) {
  assert(label, !readSource(relPath).includes(needle));
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

async function main() {
  assert(
    "portal payment-method module exists",
    existsSync("lib/stripe/billing-portal-payment-method.ts"),
  );
  assert(
    "portal return URL helper exists",
    existsSync("lib/stripe/billing-portal-return-url.ts"),
  );
  assert(
    "portal route exists",
    existsSync("app/api/stripe/billing-portal/payment-method/route.ts"),
  );

  const {
    buildPaymentMethodPortalReturnUrl,
    isSafeStripeBillingPortalUrl,
    getBillingPortalAppOrigin,
  } = await import("../lib/stripe/billing-portal-return-url.ts");

  const returnUrl = buildPaymentMethodPortalReturnUrl("https://dev.immifin.com");
  assert(
    "return URL is application-controlled billing path",
    returnUrl === "https://dev.immifin.com/account/billing?payment_method=updated",
  );
  assert(
    "return URL has no open-redirect host injection",
    !returnUrl.includes("evil.com"),
  );

  assert(
    "safe Stripe portal URL accepted",
    isSafeStripeBillingPortalUrl("https://billing.stripe.com/p/session/test_abc"),
  );
  assert(
    "http portal URL rejected",
    !isSafeStripeBillingPortalUrl("http://billing.stripe.com/p/session/test_abc"),
  );
  assert(
    "arbitrary https host rejected",
    !isSafeStripeBillingPortalUrl("https://evil.example/steal"),
  );

  const prevAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const prevNodeEnv = process.env.NODE_ENV;
  process.env.NEXT_PUBLIC_APP_URL = "https://dev.immifin.com/";
  assert("origin from NEXT_PUBLIC_APP_URL", getBillingPortalAppOrigin() === "https://dev.immifin.com");
  delete process.env.NEXT_PUBLIC_APP_URL;
  process.env.NODE_ENV = "development";
  assert("dev origin localhost fallback", getBillingPortalAppOrigin() === "http://localhost:3000");
  if (prevAppUrl === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = prevAppUrl;
  }
  process.env.NODE_ENV = prevNodeEnv;

  let sessionCreateCalls = 0;
  let subscriptionUpdateCalls = 0;
  let lastSessionArgs = null;
  let configCreateCalls = 0;

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
          billingPortal: {
            configurations: {
              list: async () => ({ data: [] }),
              create: async (params) => {
                configCreateCalls += 1;
                assert(
                  "portal config enables payment_method_update only",
                  params.features.payment_method_update.enabled === true,
                );
                assert(
                  "portal config disables subscription_cancel",
                  params.features.subscription_cancel.enabled === false,
                );
                assert(
                  "portal config disables subscription_update",
                  params.features.subscription_update.enabled === false,
                );
                return { id: "bpc_test_pm_only" };
              },
            },
            sessions: {
              create: async (params) => {
                sessionCreateCalls += 1;
                lastSessionArgs = params;
                return {
                  url: "https://billing.stripe.com/p/session/test_hosted_pm",
                };
              },
            },
          },
          subscriptions: {
            update: async () => {
              subscriptionUpdateCalls += 1;
              throw new Error("subscriptions.update must not run from PM portal flow");
            },
          },
        }),
      };
    }

    return originalLoad(request, parent, isMain);
  };

  const { createPaymentMethodPortalSession } = await import(
    "../lib/stripe/billing-portal-payment-method.ts"
  );

  await expectAsyncThrow(
    () =>
      createPaymentMethodPortalSession({
        profile: { id: "p1" },
        subscription: null,
      }),
    "missing subscription rejected",
    (error) => error?.status === 404 || error?.message?.includes("subscription"),
  );

  await expectAsyncThrow(
    () =>
      createPaymentMethodPortalSession({
        profile: { id: "p1" },
        subscription: {
          plan: "free",
          stripe_customer_id: "cus_should_not_matter",
        },
      }),
    "free plan cannot open PM portal",
    (error) => error?.status === 409,
  );

  await expectAsyncThrow(
    () =>
      createPaymentMethodPortalSession({
        profile: { id: "p1" },
        subscription: {
          plan: "pro",
          stripe_customer_id: null,
        },
      }),
    "paid plan without Stripe customer rejected",
    (error) => error?.status === 409,
  );

  // Browser cannot supply customer id — function only accepts profile/subscription.
  const result = await createPaymentMethodPortalSession({
    profile: { id: "p1" },
    subscription: {
      plan: "pro",
      stripe_customer_id: "cus_resolved_server_side",
    },
  });

  assert("Stripe-hosted session URL returned", result.url.startsWith("https://billing.stripe.com/"));
  assert("session created once", sessionCreateCalls === 1);
  assert("narrow config created when missing", configCreateCalls === 1);
  assert(
    "session uses server-resolved customer",
    lastSessionArgs.customer === "cus_resolved_server_side",
  );
  assert(
    "session deep-links payment_method_update",
    lastSessionArgs.flow_data?.type === "payment_method_update",
  );
  assert(
    "session return_url is app-controlled",
    typeof lastSessionArgs.return_url === "string" &&
      lastSessionArgs.return_url.includes("/account/billing?payment_method=updated"),
  );
  assert(
    "flow after_completion redirect is app-controlled",
    lastSessionArgs.flow_data?.after_completion?.redirect?.return_url.includes(
      "/account/billing?payment_method=updated",
    ),
  );
  assert("Change PM does NOT call subscriptions.update", subscriptionUpdateCalls === 0);

  // Route / client source contracts
  const routeSrc = readSource("app/api/stripe/billing-portal/payment-method/route.ts");
  assert("route uses requireUser", routeSrc.includes("requireUser"));
  assert("route returns only createPaymentMethodPortalSession result", routeSrc.includes("createPaymentMethodPortalSession"));
  assertSourceAbsent(
    "app/api/stripe/billing-portal/payment-method/route.ts",
    "request.json",
    "route does not accept browser JSON Stripe IDs",
  );

  assertSource(
    "lib/stripe/client-billing-portal.ts",
    "/api/stripe/billing-portal/payment-method",
    "client hits portal PM endpoint",
  );

  const dialogSrc = readSource("components/billing/PlanChangeConfirmationDialog.tsx");
  assert("existing PM shows Change payment method", dialogSrc.includes("Change payment method"));
  assert("missing PM shows Add payment method", dialogSrc.includes("Add payment method"));
  assert("missing PM copy present", dialogSrc.includes("No payment method available."));

  const centerSrc = readSource("components/billing/BillingCenter.tsx");
  assert("return invalidates confirmation / refreshes preview", centerSrc.includes("Payment method settings refreshed."));
  assert("stores pending upgrade without preview auth", centerSrc.includes("storePendingUpgradeAfterPaymentMethod"));
  assert("consumes pending upgrade after return", centerSrc.includes("consumePendingUpgradeAfterPaymentMethod"));
  assert("opens fresh preview after return", centerSrc.includes("openReviewForAction(action)"));
  assert(
    "pending storage helper forbids previewAuthorization",
    !readSource("lib/billing/pending-upgrade-after-payment-method.ts").includes("previewAuthorization"),
  );
  assertSource(
    "components/billing/BillingCenter.tsx",
    "previewAuthorization: null",
    "fresh review clears stale previewAuthorization",
  );

  // UX-003 / Checkout / FetchHttpClient unchanged contracts
  assertSource(
    "lib/stripe/server.ts",
    "Stripe.createFetchHttpClient()",
    "FetchHttpClient remains unchanged",
  );
  assertSource(
    "lib/stripe/subscription-change.ts",
    "always_invoice",
    "UX-003 charge-now execution remains",
  );
  assertSource(
    "lib/stripe/checkout.ts",
    "checkout.sessions.create",
    "Free→Paid Checkout path remains",
  );

  // Safe display rules remain (UX-004)
  assertSource(
    "lib/stripe/subscription-change-preview-payment-method.ts",
    "displayLabel",
    "payment method safe-display rules remain intact",
  );
  assertSourceAbsent(
    "components/billing/PlanChangeConfirmationDialog.tsx",
    "cardNumber",
    "dialog has no raw card number field",
  );
  assertSourceAbsent(
    "components/billing/PlanChangeConfirmationDialog.tsx",
    "cvc",
    "dialog has no CVC field",
  );

  console.log("\nS7-BILLING-UX-005 verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
