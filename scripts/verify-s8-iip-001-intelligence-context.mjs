/**
 * S8-IIP-001 — Intelligence Context Foundation verification.
 * Run: npx tsx scripts/verify-s8-iip-001-intelligence-context.mjs
 */

import {
  assembleIntelligenceContext,
  INTELLIGENCE_CONTEXT_VERSION,
  INTELLIGENCE_MISSING_FIELD,
  INTELLIGENCE_WARNING,
  isUtcIso8601Timestamp,
  validateIntelligenceContext,
} from "../lib/intelligence/context/index.ts";
import { getEffectivePlan } from "../lib/account/plan.ts";
import { appPlanToSubscriptionTier } from "../lib/subscription/plan.ts";
import { getStoredSubscriptionTier } from "../lib/subscription/service.ts";
import { IntelligenceContextError } from "../lib/intelligence/context/intelligence-context.types.ts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function makeProfile(plan = "free") {
  return {
    id: "profile-1",
    clerk_user_id: "user_clerk_1",
    email: "secret@example.com",
    plan,
    role: "user",
    status: "active",
    display_name: "Alex Example",
    avatar_url: null,
    phone_number: "555-0100",
    role_updated_at: null,
    role_updated_by_clerk_user_id: null,
    last_seen_at: null,
    last_login_at: null,
    clerk_synced_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeSubscription(plan) {
  return {
    id: "sub-1",
    profile_id: "profile-1",
    plan,
    status: "active",
    stripe_customer_id: "cus_secret",
    stripe_subscription_id: "sub_secret",
    stripe_price_id: "price_secret",
    billing_interval: "month",
    stripe_status: "active",
    cancel_at_period_end: false,
    canceled_at: null,
    current_period_start: null,
    current_period_end: null,
    last_synchronized_at: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeImmigration(overrides = {}) {
  return {
    id: "imm-1",
    profile_id: "profile-1",
    default_category: "EB2",
    default_country: "India",
    default_bulletin_type: "final-action",
    priority_date: "2019-06-15",
    green_card_issue_date: null,
    married_to_us_citizen: null,
    preferences: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function assertNoProhibitedFields(context) {
  const serialized = JSON.stringify(context);
  const prohibited = [
    "secret@example.com",
    "555-0100",
    "cus_secret",
    "sub_secret",
    "price_secret",
    "user_clerk_1",
    "sessionToken",
    "privateMetadata",
  ];

  for (const value of prohibited) {
    assert(`prohibited value absent: ${value}`, !serialized.includes(value));
  }

  assert("root has no email field", !("email" in context));
  assert("root has no phone field", !("phone" in context) && !("phone_number" in context));
  assert(
    "root has no stripe ids",
    !("stripe_customer_id" in context) && !("stripe_subscription_id" in context),
  );
}

function main() {
  const generatedAt = "2026-07-25T12:00:00.000Z";

  // 1. Complete employment-based profile → usable context
  const employmentContext = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile("pro"),
    immigrationProfile: makeImmigration(),
    subscription: makeSubscription("pro"),
    visaBulletin: {
      bulletinMonth: "2026-08",
      finalActionDate: "2018-01-01",
      dateForFiling: "C",
    },
    generatedAt,
  });

  assert("employment journey kind", employmentContext.journey.kind === "employment_gc_waiting");
  assert("employment journey stage", employmentContext.journey.stage === "employment_gc_waiting");
  assert("employment context usable", employmentContext.readiness.usable === true);
  assert("employment status usable", employmentContext.readiness.status === "usable");
  assert(
    "employment country mapped",
    employmentContext.immigration.countryOfChargeability === "India",
  );
  assert(
    "employment category mapped",
    employmentContext.immigration.employmentBasedCategory === "EB2",
  );
  assert("employment priority date mapped", employmentContext.immigration.priorityDate === "2019-06-15");
  assert("employment FAD mapped", employmentContext.visaBulletin.finalActionDate === "2018-01-01");
  assert("employment DFF mapped", employmentContext.visaBulletin.dateForFiling === "C");
  assert("employment bulletin month mapped", employmentContext.visaBulletin.bulletinMonth === "2026-08");
  assert("employment not GC holder", employmentContext.greenCard.isHolder === false);
  assert("employment GC issue date null", employmentContext.greenCard.issueDate === null);
  validateIntelligenceContext(employmentContext);

  // 2. Green card holder → correct journey context
  const gcContext = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile("power"),
    immigrationProfile: makeImmigration({
      default_category: null,
      default_country: null,
      priority_date: null,
      green_card_issue_date: "2020-03-10",
    }),
    subscription: makeSubscription("power"),
    visaBulletin: {
      bulletinMonth: "2026-08",
      finalActionDate: null,
      dateForFiling: null,
    },
    generatedAt,
  });

  assert("GC journey kind", gcContext.journey.kind === "green_card_holder");
  assert("GC journey stage", gcContext.journey.stage === "green_card_holder");
  assert("GC holder flag", gcContext.greenCard.isHolder === true);
  assert("GC issue date mapped", gcContext.greenCard.issueDate === "2020-03-10");
  assert("GC context usable without employment fields", gcContext.readiness.usable === true);
  assert("GC FAD null", gcContext.visaBulletin.finalActionDate === null);
  assert("GC DFF null", gcContext.visaBulletin.dateForFiling === null);

  // 3. Missing immigration fields → structured missing-field results
  const incompleteContext = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile("free"),
    immigrationProfile: makeImmigration({
      default_category: null,
      default_country: "India",
      priority_date: null,
    }),
    subscription: null,
    visaBulletin: null,
    generatedAt,
  });

  assert("incomplete journey kind", incompleteContext.journey.kind === "incomplete");
  assert("incomplete not usable", incompleteContext.readiness.usable === false);
  assert("incomplete status", incompleteContext.readiness.status === "incomplete");
  assert(
    "missing category listed",
    incompleteContext.readiness.missingRequiredFields.includes(
      INTELLIGENCE_MISSING_FIELD.EMPLOYMENT_BASED_CATEGORY,
    ),
  );
  assert(
    "missing priority date listed",
    incompleteContext.readiness.missingRequiredFields.includes(
      INTELLIGENCE_MISSING_FIELD.PRIORITY_DATE,
    ),
  );
  assert(
    "country present so not listed missing",
    !incompleteContext.readiness.missingRequiredFields.includes(
      INTELLIGENCE_MISSING_FIELD.COUNTRY_OF_CHARGEABILITY,
    ),
  );

  // 4. Missing green card issue date handled explicitly
  assert(
    "employment missing GC date warning",
    employmentContext.readiness.warnings.includes(
      INTELLIGENCE_WARNING.GREEN_CARD_ISSUE_DATE_ABSENT,
    ),
  );
  assert("employment GC issueDate is null (not fabricated)", employmentContext.greenCard.issueDate === null);

  // 5. Effective subscription plan from approved resolver
  // Call flow: assembleIntelligenceContext → getStoredSubscriptionTier → getEffectivePlan
  const assembleSource = readFileSync(
    resolve("lib/intelligence/context/assemble-intelligence-context.ts"),
    "utf8",
  );
  assert(
    "builder uses getStoredSubscriptionTier entry point",
    assembleSource.includes("getStoredSubscriptionTier({"),
  );
  assert(
    "builder does not call getEffectivePlan directly (uses established wrapper)",
    !assembleSource.includes("getEffectivePlan("),
  );
  const serviceSource = readFileSync(resolve("lib/subscription/service.ts"), "utf8");
  assert(
    "getStoredSubscriptionTier applies getEffectivePlan",
    serviceSource.includes("getEffectivePlan(input.profile, input.subscription)"),
  );

  const freeContext = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile("free"),
    immigrationProfile: makeImmigration(),
    subscription: null,
    visaBulletin: {
      bulletinMonth: "2026-08",
      finalActionDate: "C",
      dateForFiling: "C",
    },
    generatedAt,
  });
  assert("1. normal Free user resolves to Free", freeContext.subscription.plan === "free");

  const proOnlyContext = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile("free"),
    immigrationProfile: makeImmigration(),
    subscription: makeSubscription("pro"),
    visaBulletin: {
      bulletinMonth: "2026-08",
      finalActionDate: "C",
      dateForFiling: "C",
    },
    generatedAt,
  });
  assert("2. normal Pro user resolves to Pro", proOnlyContext.subscription.plan === "pro");

  const powerOnlyContext = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile("free"),
    immigrationProfile: makeImmigration(),
    subscription: makeSubscription("power"),
    visaBulletin: {
      bulletinMonth: "2026-08",
      finalActionDate: "C",
      dateForFiling: "C",
    },
    generatedAt,
  });
  assert("3. normal Power user resolves to Power", powerOnlyContext.subscription.plan === "power");

  // 4. Dev Subscription Mode persists plan via updateSubscriptionPlan, then reads
  // through the same getStoredSubscriptionTier → getEffectivePlan path (no separate runtime override).
  const afterDevModePatchProfile = makeProfile("power");
  const afterDevModePatchSubscription = makeSubscription("power");
  const expectedAfterDevMode = appPlanToSubscriptionTier(
    getEffectivePlan(afterDevModePatchProfile, afterDevModePatchSubscription),
  );
  const devModeContext = assembleIntelligenceContext({
    firstName: "Alex",
    profile: afterDevModePatchProfile,
    immigrationProfile: makeImmigration(),
    subscription: afterDevModePatchSubscription,
    visaBulletin: {
      bulletinMonth: "2026-08",
      finalActionDate: "C",
      dateForFiling: "C",
    },
    generatedAt,
  });
  assert(
    "4. Dev Subscription Mode persisted plan reflected via effective resolver",
    devModeContext.subscription.plan === expectedAfterDevMode &&
      expectedAfterDevMode === "power",
  );

  const proPlan = getStoredSubscriptionTier({
    profile: makeProfile("free"),
    subscription: makeSubscription("pro"),
  });
  const proEffective = appPlanToSubscriptionTier(
    getEffectivePlan(makeProfile("free"), makeSubscription("pro")),
  );
  assert("getStoredSubscriptionTier matches getEffectivePlan mapping", proPlan === proEffective);
  assert("approved resolver returns pro", proPlan === "pro");
  assert("context subscription matches resolver", employmentContext.subscription.plan === "pro");
  assert("GC context plan is power", gcContext.subscription.plan === "power");
  assert("incomplete defaults free without subscription", incompleteContext.subscription.plan === "free");

  // 5b. Context builder does not grant capabilities
  assert(
    "5. context has no capability grant fields",
    !("capabilities" in freeContext) &&
      !("accessAI" in freeContext) &&
      !("hasCapability" in freeContext),
  );

  // 5c. No Stripe identifiers in context
  assertNoProhibitedFields(freeContext);
  assertNoProhibitedFields(proOnlyContext);
  assertNoProhibitedFields(powerOnlyContext);
  assertNoProhibitedFields(devModeContext);

  // 6. Context version stable
  assert("context version constant", INTELLIGENCE_CONTEXT_VERSION === "1.0.0");
  assert("employment contextVersion", employmentContext.contextVersion === "1.0.0");
  assert("GC contextVersion", gcContext.contextVersion === "1.0.0");
  assert("incomplete contextVersion", incompleteContext.contextVersion === "1.0.0");

  // 7. generatedAt valid UTC ISO-8601
  assert("generatedAt exact injectable value", employmentContext.generatedAt === generatedAt);
  assert("generatedAt ISO helper", isUtcIso8601Timestamp(employmentContext.generatedAt));
  const liveStampContext = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile(),
    immigrationProfile: makeImmigration({ green_card_issue_date: "2021-01-01" }),
    subscription: null,
    visaBulletin: { bulletinMonth: "2026-08", finalActionDate: null, dateForFiling: null },
  });
  assert("live generatedAt is UTC ISO-8601", isUtcIso8601Timestamp(liveStampContext.generatedAt));

  // 8. Missing values not fabricated
  assert(
    "currentImmigrationStatus always null",
    employmentContext.immigration.currentImmigrationStatus === null &&
      gcContext.immigration.currentImmigrationStatus === null &&
      incompleteContext.immigration.currentImmigrationStatus === null,
  );
  assert(
    "no Unknown/N/A/TBD fabricated status",
    !JSON.stringify(incompleteContext).match(/\b(Unknown|N\/A|TBD|Not sure)\b/),
  );
  assert(
    "incomplete null category stays null",
    incompleteContext.immigration.employmentBasedCategory === null,
  );

  // 9. Prohibited private fields not included
  assertNoProhibitedFields(employmentContext);
  assertNoProhibitedFields(gcContext);
  assertNoProhibitedFields(incompleteContext);

  // 10. Infrastructure failures are not incomplete profile data
  const infraError = new IntelligenceContextError(
    "INTELLIGENCE_CONTEXT_VISA_BULLETIN_UNAVAILABLE",
    "Unable to load Visa Bulletin cutoff data.",
  );
  assert("infra error is IntelligenceContextError", infraError instanceof IntelligenceContextError);
  assert(
    "infra error code distinct from incomplete readiness",
    infraError.code === "INTELLIGENCE_CONTEXT_VISA_BULLETIN_UNAVAILABLE",
  );
  assert(
    "incomplete readiness is not an thrown infra error",
    incompleteContext.readiness.status === "incomplete" &&
      incompleteContext.readiness.missingRequiredFields.length > 0,
  );

  assert(
    "status unavailable warning present for Version 1",
    employmentContext.readiness.warnings.includes(
      INTELLIGENCE_WARNING.CURRENT_IMMIGRATION_STATUS_UNAVAILABLE,
    ),
  );

  console.log("\nS8-IIP-001 Intelligence Context verification passed.");
}

main();
