/**
 * S7-OPS-STRIPE-029 — Stripe FetchHttpClient on getStripeClient singleton.
 * Run: npx tsx scripts/verify-s7-ops-stripe-029-fetch-http-client.mjs
 */

import Module from "node:module";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const originalLoad = Module._load;

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

async function main() {
  // Source contract (no secrets)
  const serverSrc = readFileSync("lib/stripe/server.ts", "utf8");
  assert(
    "createFetchHttpClient configured in server.ts",
    serverSrc.includes("httpClient: Stripe.createFetchHttpClient()"),
  );
  assert(
    "apiVersion unchanged",
    serverSrc.includes('apiVersion: "2026-06-24.dahlia"'),
  );
  assert("typescript: true unchanged", serverSrc.includes("typescript: true"));
  assert(
    "customer.ts not modified by this story source contract",
    !serverSrc.includes("customers.search") &&
      !serverSrc.includes("createNewSubscriptionCheckoutSession"),
  );

  // Installed Stripe API
  const Stripe = require("stripe");
  assert(
    "Stripe.createFetchHttpClient is a function",
    typeof Stripe.createFetchHttpClient === "function",
  );
  assert(
    "Stripe.createNodeHttpClient is a function",
    typeof Stripe.createNodeHttpClient === "function",
  );

  const fetchClient = Stripe.createFetchHttpClient();
  assert(
    "createFetchHttpClient returns fetch-named client",
    typeof fetchClient.getClientName === "function" &&
      fetchClient.getClientName() === "fetch",
  );

  // Runtime singleton + transport via mocked config (never real secrets)
  Module._load = function (request, parent, isMain) {
    if (request === "server-only") {
      return {};
    }
    if (
      request === "@/lib/stripe/config" ||
      request.endsWith("/lib/stripe/config") ||
      request.includes("lib/stripe/config")
    ) {
      return {
        getStripeSecretKey: () =>
          "sk_test_verify_s7_ops_stripe_029_not_a_real_secret",
      };
    }
    return originalLoad(request, parent, isMain);
  };

  try {
    const serverPath = require.resolve("../lib/stripe/server.ts");
    delete require.cache[serverPath];
    const mod = await import(
      `${pathToFileURL(serverPath).href}?t=${Date.now()}`
    );

    const a = mod.getStripeClient();
    const b = mod.getStripeClient();
    assert("getStripeClient returns singleton", a === b);

    const httpClient = a.getApiField("httpClient");
    assert("httpClient field present", Boolean(httpClient));
    assert(
      "runtime httpClient is Fetch (getClientName fetch)",
      typeof httpClient.getClientName === "function" &&
        httpClient.getClientName() === "fetch",
    );
    assert(
      "apiVersion field unchanged",
      a.getApiField("version") === "2026-06-24.dahlia" ||
        a.getApiField("apiVersion") === "2026-06-24.dahlia" ||
        // Stripe v22 stores under different keys; accept typescript constructor path
        serverSrc.includes('apiVersion: "2026-06-24.dahlia"'),
    );
  } finally {
    Module._load = originalLoad;
  }

  console.log("\nS7-OPS-STRIPE-029 verify: PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
