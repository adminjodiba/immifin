/**
 * S7-STR-004A — Development Subscription Mode flag verification.
 * Run: node scripts/verify-s7-str-004a-dev-subscription-mode.mjs
 */

function isDevelopmentSubscriptionModeEnabled(env) {
  if (env.NODE_ENV === "production") {
    return false;
  }

  return env.IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE === "true";
}

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  assert(
    "development + flag true → enabled",
    isDevelopmentSubscriptionModeEnabled({
      NODE_ENV: "development",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "true",
    }),
  );

  assert(
    "development + flag false → disabled",
    !isDevelopmentSubscriptionModeEnabled({
      NODE_ENV: "development",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "false",
    }),
  );

  assert(
    "development + flag missing → disabled",
    !isDevelopmentSubscriptionModeEnabled({
      NODE_ENV: "development",
    }),
  );

  assert(
    "development + empty flag → disabled",
    !isDevelopmentSubscriptionModeEnabled({
      NODE_ENV: "development",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "",
    }),
  );

  assert(
    "development + loose truthy 1 → disabled",
    !isDevelopmentSubscriptionModeEnabled({
      NODE_ENV: "development",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "1",
    }),
  );

  assert(
    "production hard stop with flag true → disabled",
    !isDevelopmentSubscriptionModeEnabled({
      NODE_ENV: "production",
      IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE: "true",
    }),
  );

  console.log("\nAll Development Subscription Mode flag checks passed.");
}

main();
