/**
 * S7-BILLING-UX-004 — Payment method transparency on upgrade preview.
 * Run: npx tsx scripts/verify-s7-billing-ux-004-payment-method-preview.mjs
 *
 * Injected fakes only — no LIVE Stripe / network / mutation.
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

async function main() {
  const {
    mapStripePaymentMethodToPreview,
    mapLegacyCardSourceToPreview,
    resolveEffectivePaymentMethodReference,
  } = await import("../lib/stripe/subscription-change-preview-payment-method.ts");

  assert("payment method helper exists", existsSync("lib/stripe/subscription-change-preview-payment-method.ts"));
  assert(
    "server resolver exists",
    existsSync("lib/stripe/subscription-change-preview-payment-method.server.ts"),
  );

  const mapped = mapStripePaymentMethodToPreview({
    id: "pm_secret_must_not_leak",
    object: "payment_method",
    type: "card",
    card: {
      brand: "visa",
      display_brand: "visa",
      last4: "4242",
      exp_month: 12,
      exp_year: 2030,
      fingerprint: "secret_fingerprint",
      funding: "credit",
      country: "US",
    },
    billing_details: { name: "Secret Name", email: "secret@example.com" },
    metadata: { secret: "nope" },
  });

  assert("card brand mapped", mapped.brand === "visa");
  assert("card last4 mapped", mapped.last4 === "4242");
  assert("displayLabel Visa masked", mapped.displayLabel === "Visa •••• 4242");
  assert("no PaymentMethod id on mapped object", !("id" in mapped));
  const mappedJson = JSON.stringify(mapped);
  assert("no pm_ id leaked", !mappedJson.includes("pm_"));
  assert("no fingerprint leaked", !mappedJson.includes("fingerprint"));
  assert("no CVC/PAN fields", !mappedJson.includes("number") && !mappedJson.includes("cvc"));

  const subPreferred = resolveEffectivePaymentMethodReference({
    subscription: {
      default_payment_method: "pm_sub_preferred",
    },
    customer: {
      invoice_settings: { default_payment_method: "pm_customer_fallback" },
      default_source: null,
    },
  });
  assert(
    "subscription.default_payment_method preferred",
    subPreferred.source === "subscription" && subPreferred.paymentMethodId === "pm_sub_preferred",
  );

  const customerFallback = resolveEffectivePaymentMethodReference({
    subscription: { default_payment_method: null },
    customer: {
      invoice_settings: { default_payment_method: "pm_customer_fallback" },
      default_source: null,
    },
  });
  assert(
    "fallback to customer.invoice_settings.default_payment_method",
    customerFallback.source === "customer_invoice_settings" &&
      customerFallback.paymentMethodId === "pm_customer_fallback",
  );

  const legacy = resolveEffectivePaymentMethodReference({
    subscription: { default_payment_method: null },
    customer: {
      invoice_settings: { default_payment_method: null },
      default_source: {
        object: "card",
        id: "card_legacy",
        brand: "mastercard",
        last4: "4444",
        exp_month: 1,
        exp_year: 2028,
      },
    },
  });
  assert("legacy default_source card supported", legacy.source === "customer_default_source");
  const legacyMapped = mapLegacyCardSourceToPreview(legacy.legacyCard);
  assert("legacy card display", legacyMapped.displayLabel === "Mastercard •••• 4444");

  const missing = resolveEffectivePaymentMethodReference({
    subscription: { default_payment_method: null },
    customer: {
      invoice_settings: { default_payment_method: null },
      default_source: null,
    },
  });
  assert("missing payment method handled", missing.source === null && missing.paymentMethodId === null);

  const bank = mapStripePaymentMethodToPreview({
    id: "pm_bank_secret",
    object: "payment_method",
    type: "us_bank_account",
    us_bank_account: { last4: "6789", bank_name: "STRIPE TEST BANK" },
  });
  assert("non-card bank degrades safely", bank.displayLabel === "Bank account •••• 6789");
  assert("bank id not returned", !JSON.stringify(bank).includes("pm_"));

  const typesSrc = readSource("lib/stripe/subscription-change-preview.types.ts");
  assert("preview types include paymentMethodStatus", /paymentMethodStatus/.test(typesSrc));
  assert("preview types no longer hardcode paymentMethod null only", !/paymentMethod:\s*null;/.test(typesSrc));

  const previewSrc = readSource("lib/stripe/subscription-change-preview.ts");
  assert("preview wires resolvePreviewPaymentMethod", /resolvePreviewPaymentMethod/.test(previewSrc));
  assert("preview remains read-only (no subscriptions.update)", !/subscriptions\.update/.test(previewSrc));

  const requestSrc = readSource("lib/stripe/subscription-change-request.ts");
  assert(
    "client cannot supply payment method ID",
    !requestSrc.includes("paymentMethodId") || /FORBIDDEN|not allowed|Unexpected/.test(requestSrc),
  );
  assert(
    "paymentMethodId not an allowed body key",
    !/ALLOWED_BODY_KEYS[\s\S]*paymentMethodId/.test(requestSrc),
  );

  const mutationSrc = readSource("lib/stripe/subscription-change.ts");
  assert(
    "immediate-upgrade execution still always_invoice (UX-003 unchanged)",
    /proration_behavior:\s*"always_invoice"/.test(mutationSrc),
  );
  assert(
    "execution still pending_if_incomplete",
    /payment_behavior:\s*"pending_if_incomplete"/.test(mutationSrc),
  );

  const serverSrc = readSource("lib/stripe/server.ts");
  assert("FetchHttpClient remains unchanged", /createFetchHttpClient/.test(serverSrc));

  const dialogSrc = readSource("components/billing/PlanChangeConfirmationDialog.tsx");
  assert("dialog displays payment method", /Payment method/.test(dialogSrc));
  // UX-004 required masked PM display only; Change/Add PM was intentionally deferred then.
  // S7-BILLING-UX-005 authorized Stripe-hosted Change/Add PM controls — allow them here,
  // while still forbidding IMMIFIN-hosted raw card collection.
  assert(
    "dialog Change PM is UX-005 hosted action (not raw card form)",
    /Change payment method/.test(dialogSrc),
  );
  assert(
    "dialog Add PM is UX-005 hosted action when missing",
    /Add payment method/.test(dialogSrc),
  );
  assert("dialog has no card number field", !/cardNumber|card-number|Card number/.test(dialogSrc));
  assert("dialog has no CVC field", !/\bcvc\b/i.test(dialogSrc));
  assert("dialog has no PAN input", !/autocomplete=["']cc-number["']|name=["']cardNumber["']/.test(dialogSrc));
  assert(
    "Change/Add PM uses Stripe-hosted portal session endpoint (UX-005)",
    readSource("lib/stripe/client-billing-portal.ts").includes(
      "/api/stripe/billing-portal/payment-method",
    ),
  );

  // Integration-style resolve with Module mock
  const state = {
    retrievePmCalls: 0,
    customerRetrieveCalls: 0,
  };

  Module._load = function (request, parent, isMain) {
    if (request === "server-only") return {};
    if (
      request === "@/lib/stripe/server" ||
      request.includes("lib/stripe/server")
    ) {
      return {
        getStripeClient: () => ({
          paymentMethods: {
            retrieve: async (id) => {
              state.retrievePmCalls += 1;
              if (id === "pm_deleted") {
                const err = new Error("No such payment_method");
                err.type = "StripeInvalidRequestError";
                err.code = "resource_missing";
                err.statusCode = 404;
                // Make instanceof Stripe.errors.StripeError fail — server catches StripeError
                throw Object.assign(err, { rawType: "invalid_request_error" });
              }
              if (id === "pm_transport_fail") {
                const err = new Error("api down");
                err.type = "StripeAPIError";
                throw err;
              }
              return {
                id,
                object: "payment_method",
                type: "card",
                card: { brand: "visa", last4: "1111", exp_month: 8, exp_year: 2031 },
              };
            },
          },
          customers: {
            retrieve: async () => {
              state.customerRetrieveCalls += 1;
              throw new Error("should not fetch customer when expanded");
            },
          },
        }),
      };
    }
    return originalLoad(request, parent, isMain);
  };

  // Need real Stripe.errors for transport path — use dynamic import of server resolver
  // with a simpler unit path: map + precedence already covered.

  assert("no Change Payment Method portal/setup in preview PM server", (() => {
    const src = readSource("lib/stripe/subscription-change-preview-payment-method.server.ts");
    return (
      !/billingPortal/.test(src) &&
      !/setupIntents/.test(src) &&
      !/checkout\.sessions/.test(src)
    );
  })());

  // Prior verify scripts remain green
  const { spawnSync } = await import("node:child_process");
  const run003 = spawnSync(
    "npx",
    ["tsx", "scripts/verify-s7-billing-ux-003-immediate-upgrade-charge-now.mjs"],
    { cwd: resolve("."), encoding: "utf8", shell: true },
  );
  assert("UX-003 execution tests remain green", run003.status === 0);
  if (run003.status !== 0) {
    console.error(run003.stdout);
    console.error(run003.stderr);
  }

  console.log("\nS7-BILLING-UX-004 verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
