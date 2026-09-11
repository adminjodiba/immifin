/**
 * BLP-BILL-DEV-001 — Development Subscription Mode dedicated local test user.
 * Run: npx tsx scripts/verify-blp-bill-dev-001-dedicated-test-user.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canUseDevSubscriptionTools,
  getDevelopmentSubscriptionModeAccessForEnv,
  resolveConfiguredDevSubscriptionTestUserId,
} from "../lib/subscription/devSubscriptionAccess.ts";
import {
  getCheckoutPlanButtonConfig,
  isPricingCurrentPlanCard,
} from "../lib/pricing/checkout-plan-actions.ts";

const DESIGNATED = "user_designated_test_only";
const OTHER = "user_other_localhost";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function access(userId, env) {
  return getDevelopmentSubscriptionModeAccessForEnv(userId, env);
}

function main() {
  console.log("\nBLP-BILL-DEV-001 dedicated Dev Subscription Mode test user\n");

  const devModeOn = {
    NODE_ENV: "development",
    IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "true",
    IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID: DESIGNATED,
  };

  // 1–2. Production always denied
  assert(
    "Production + matching test user → denied",
    access(DESIGNATED, {
      NODE_ENV: "production",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "true",
      IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID: DESIGNATED,
    }).eligible === false &&
      access(DESIGNATED, {
        NODE_ENV: "production",
        IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "true",
        IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID: DESIGNATED,
      }).reason === "production",
  );
  assert(
    "Production + any user → denied",
    access(OTHER, {
      NODE_ENV: "production",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "true",
      IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID: DESIGNATED,
    }).eligible === false,
  );

  // 3. Mode disabled
  assert(
    "Development + mode disabled → denied",
    access(DESIGNATED, {
      NODE_ENV: "development",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "false",
      IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID: DESIGNATED,
    }).reason === "mode_disabled",
  );

  // 4–5. Missing / empty config fail closed
  assert(
    "Development + missing test-user config → denied",
    access(DESIGNATED, {
      NODE_ENV: "development",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "true",
    }).reason === "test_user_not_configured",
  );
  assert(
    "Development + empty test-user config → denied",
    access(DESIGNATED, {
      NODE_ENV: "development",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "true",
      IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID: "   ",
    }).reason === "test_user_not_configured",
  );

  // 6. Wrong user
  assert(
    "Development + different authenticated user → denied",
    access(OTHER, devModeOn).reason === "user_not_designated" &&
      access(OTHER, devModeOn).eligible === false,
  );

  // 7. Exact match allowed
  const allowed = access(DESIGNATED, devModeOn);
  assert(
    "Development + exact configured Clerk ID → allowed",
    allowed.eligible === true && allowed.reason === "allowed",
  );

  // 8. Whitespace normalization
  assert(
    "Leading/trailing whitespace in configured ID → normalized",
    access(DESIGNATED, {
      ...devModeOn,
      IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID: `  ${DESIGNATED}  `,
    }).eligible === true,
  );
  assert(
    "resolveConfiguredDevSubscriptionTestUserId trims",
    resolveConfiguredDevSubscriptionTestUserId(`  ${DESIGNATED}  `) === DESIGNATED,
  );

  // 9. Client-provided fake ID cannot grant access (resolver only trusts passed auth id;
  //    API uses requireUser().profile.clerk_user_id — never body)
  assert(
    "Fake body-style ID without matching auth → denied",
    access("user_spoofed_from_client", devModeOn).eligible === false,
  );

  // Convenience wrapper
  const prevNodeEnv = process.env.NODE_ENV;
  const prevFlag = process.env.IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE;
  const prevTestUser = process.env.IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID;
  try {
    process.env.NODE_ENV = "development";
    process.env.IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE = "true";
    process.env.IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID = DESIGNATED;
    assert("canUseDevSubscriptionTools(designated) true", canUseDevSubscriptionTools(DESIGNATED));
    assert("canUseDevSubscriptionTools(other) false", !canUseDevSubscriptionTools(OTHER));
    process.env.NODE_ENV = "production";
    assert(
      "canUseDevSubscriptionTools production hard-off",
      !canUseDevSubscriptionTools(DESIGNATED),
    );
  } finally {
    process.env.NODE_ENV = prevNodeEnv;
    if (prevFlag === undefined) {
      delete process.env.IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE;
    } else {
      process.env.IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE = prevFlag;
    }
    if (prevTestUser === undefined) {
      delete process.env.IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID;
    } else {
      process.env.IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID = prevTestUser;
    }
  }

  // 10–12 conceptual: Dev plan switching uses updateSubscriptionPlan (plan/status only)
  const profilesSrc = readFileSync(resolve("lib/supabase/profiles.ts"), "utf8");
  const updateFn = profilesSrc.slice(
    profilesSrc.indexOf("export async function updateSubscriptionPlan"),
    profilesSrc.indexOf("export async function updateSubscriptionPlan") + 2500,
  );
  assert(
    "Dev plan update writes plan + status only (no stripe_subscription_id assign)",
    updateFn.includes("plan,") &&
      updateFn.includes("status: subscriptionStatus") &&
      !updateFn.includes("stripe_subscription_id:") &&
      !updateFn.includes("billing_interval:"),
  );

  // 13. API enforces canUseDevSubscriptionTools(clerkUserId)
  const routeSrc = readFileSync(resolve("app/api/account/subscription/route.ts"), "utf8");
  assert(
    "PATCH uses canUseDevSubscriptionTools(clerkUserId)",
    routeSrc.includes("canUseDevSubscriptionTools(clerkUserId)") &&
      routeSrc.includes("profile.clerk_user_id"),
  );
  assert(
    "PATCH does not trust body user identity fields",
    !routeSrc.includes("body.userId") && !routeSrc.includes("body.clerk"),
  );
  assert(
    "Forbidden message is safe (no config leak)",
    routeSrc.includes("Development subscription mode is not enabled.") &&
      !routeSrc.includes("IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID"),
  );

  // 14–16 covered by updateSubscriptionPlan source inspection above (no Stripe fields)

  // 17–19 Pricing / Billing UI authority
  const pricingPage = readFileSync(resolve("app/pricing/page.tsx"), "utf8");
  assert(
    "Pricing page uses canUseDevSubscriptionTools(userId) from auth()",
    pricingPage.includes("canUseDevSubscriptionTools(userId)") &&
      pricingPage.includes('await auth()'),
  );
  assert(
    "Pricing page no longer uses global mode flag alone",
    !pricingPage.includes("isDevelopmentSubscriptionModeEnabled()"),
  );

  const pricingUi = readFileSync(resolve("components/pricing/PricingPlans.tsx"), "utf8");
  assert(
    "Pricing override UX gated on developmentSubscriptionOverrideActive",
    pricingUi.includes("developmentSubscriptionOverrideActive"),
  );

  const billingUi = readFileSync(resolve("components/billing/BillingCenter.tsx"), "utf8");
  assert(
    "Billing Center override requires devSubscriptionMode",
    billingUi.includes("devSubscriptionMode && simulatedPaidEntitlement"),
  );

  // Pricing: authorized override vs unauthorized
  assert(
    "Authorized Dev Pro: current entitlement",
    isPricingCurrentPlanCard({
      planId: "pro",
      currentTier: "pro",
      isSignedIn: true,
      currentBillingInterval: null,
      displayedBillingInterval: "monthly",
      hasPaidStripeSubscription: false,
      developmentSubscriptionOverrideActive: true,
    }),
  );
  assert(
    "Unauthorized Pro without Stripe: not Current Plan",
    !isPricingCurrentPlanCard({
      planId: "pro",
      currentTier: "pro",
      isSignedIn: true,
      currentBillingInterval: null,
      displayedBillingInterval: "monthly",
      hasPaidStripeSubscription: false,
      developmentSubscriptionOverrideActive: false,
    }),
  );

  const realPro = getCheckoutPlanButtonConfig(
    { id: "pro", cta: "Upgrade to Pro", ctaStyle: "btn-primary" },
    "pro",
    true,
    "month",
    "monthly",
    true,
    false,
  );
  assert(
    "Real Pro Monthly Current Plan unchanged",
    realPro.isCurrentPlan && !String(realPro.helperText).includes("Development plan override"),
  );

  // 20–24 static safety
  const accessSrc = readFileSync(resolve("lib/subscription/devSubscriptionAccess.ts"), "utf8");
  assert(
    "Access module documents server-only / no logging of ID",
    accessSrc.includes("Never log") && accessSrc.includes("Do not import this module from client"),
  );
  assert(
    "No NEXT_PUBLIC_ test-user variable",
    !accessSrc.includes("NEXT_PUBLIC_DEV_SUBSCRIPTION_TEST_USER") &&
      !readFileSync(resolve(".env.example"), "utf8").includes(
        "NEXT_PUBLIC_IMMIFIN_DEV_SUBSCRIPTION_TEST_USER",
      ),
  );
  const envExample = readFileSync(resolve(".env.example"), "utf8");
  assert(
    ".env.example documents empty IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID=",
    envExample.includes("IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID="),
  );
  assert(
    ".env.example does not embed a real user_ value",
    !/IMMIFIN_DEV_SUBSCRIPTION_TEST_USER_ID=user_/.test(envExample),
  );

  // Client hooks must not import server access module
  const clientHook = readFileSync(resolve("lib/hooks/useCanUseDevSubscriptionTools.ts"), "utf8");
  assert(
    "Client hook uses subscription API flag only",
    clientHook.includes("devSubscriptionMode") &&
      !clientHook.includes("devSubscriptionAccess"),
  );

  console.log("\nPASS: BLP-BILL-DEV-001 dedicated test user verification\n");
}

main();
