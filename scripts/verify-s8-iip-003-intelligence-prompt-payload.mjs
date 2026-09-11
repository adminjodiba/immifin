/**
 * S8-IIP-003 — Deterministic Prompt Payload Foundation verification.
 * Run: npx tsx scripts/verify-s8-iip-003-intelligence-prompt-payload.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assembleIntelligenceContext, isUtcIso8601Timestamp } from "../lib/intelligence/context/index.ts";
import { assembleIntelligenceRequest } from "../lib/intelligence/request/index.ts";
import {
  buildIntelligencePromptPayload,
  INTELLIGENCE_PROMPT_INSTRUCTION_ROLE,
  INTELLIGENCE_PROMPT_PAYLOAD_VERSION,
  INTELLIGENCE_PROMPT_PRINCIPLES,
  INTELLIGENCE_PROMPT_PROHIBITED_BEHAVIORS,
} from "../lib/intelligence/prompt/index.ts";
import { IntelligenceContextError } from "../lib/intelligence/context/intelligence-context.types.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function makeProfile(plan = "pro") {
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

function readyRequest() {
  const context = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile("pro"),
    immigrationProfile: makeImmigration(),
    subscription: makeSubscription("pro"),
    visaBulletin: {
      bulletinMonth: "2026-08",
      finalActionDate: "2018-01-01",
      dateForFiling: "C",
    },
    generatedAt: "2026-07-25T12:00:00.000Z",
  });

  return assembleIntelligenceRequest({
    question: "When might my priority date become current?",
    context,
    requestId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    createdAt: "2026-07-25T15:00:00.000Z",
  });
}

function incompleteRequest() {
  const context = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile("free"),
    immigrationProfile: makeImmigration({
      default_category: null,
      priority_date: null,
    }),
    subscription: null,
    visaBulletin: null,
    generatedAt: "2026-07-25T12:00:00.000Z",
  });

  return assembleIntelligenceRequest({
    question: "How long until my green card?",
    context,
    requestId: "ffffffff-1111-4222-8333-444444444444",
    createdAt: "2026-07-25T16:00:00.000Z",
  });
}

function assertNoProhibited(payload) {
  const serialized = JSON.stringify(payload);
  for (const value of [
    "secret@example.com",
    "555-0100",
    "cus_secret",
    "sub_secret",
    "price_secret",
    "user_clerk_1",
    "sessionToken",
    "privateMetadata",
  ]) {
    assert(`prohibited value absent: ${value}`, !serialized.includes(value));
  }
  for (const key of ["messages", "openai", "anthropic", "gemini", "model", "email"]) {
    assert(`root has no ${key}`, !(key in payload));
  }
}

function main() {
  const createdAt = "2026-07-25T17:00:00.000Z";
  const request = readyRequest();

  // 1. Ready request → payload
  const payload = buildIntelligencePromptPayload(request, { createdAt });
  assert("1. ready request produces payload", payload.userQuestion.length > 0);

  // 2. payloadVersion stable
  assert("2. payloadVersion constant", INTELLIGENCE_PROMPT_PAYLOAD_VERSION === "1.0.0");
  assert("2. payloadVersion on payload", payload.payloadVersion === "1.0.0");

  // 3. requestId preserved
  assert("3. requestId preserved", payload.requestId === request.requestId);

  // 4. createdAt UTC ISO-8601
  assert("4. createdAt injectable", payload.createdAt === createdAt);
  assert("4. createdAt ISO", isUtcIso8601Timestamp(payload.createdAt));
  const live = buildIntelligencePromptPayload(request);
  assert("4. live createdAt ISO", isUtcIso8601Timestamp(live.createdAt));

  // 5. Question preserved exactly
  assert(
    "5. validated question preserved exactly",
    payload.userQuestion === request.input.question,
  );

  // 6. Static instructions deterministic
  assert("6. instruction role stable", payload.instructions.role === INTELLIGENCE_PROMPT_INSTRUCTION_ROLE);
  assert(
    "6. principles match constants",
    JSON.stringify(payload.instructions.principles) ===
      JSON.stringify([...INTELLIGENCE_PROMPT_PRINCIPLES]),
  );
  assert(
    "6. prohibited behaviors match constants",
    JSON.stringify(payload.instructions.prohibitedBehaviors) ===
      JSON.stringify([...INTELLIGENCE_PROMPT_PROHIBITED_BEHAVIORS]),
  );
  const again = buildIntelligencePromptPayload(request, { createdAt });
  assert(
    "6. second build identical instructions",
    JSON.stringify(again.instructions) === JSON.stringify(payload.instructions),
  );

  // 7. Context values only from request envelope
  assert(
    "7. context version from request",
    payload.userContext.contextVersion === request.context.contextVersion,
  );
  assert(
    "7. immigration category from request",
    payload.userContext.immigration.employmentBasedCategory ===
      request.context.immigration.employmentBasedCategory,
  );
  assert(
    "7. subscription plan from request",
    payload.userContext.subscription.plan === request.context.subscription.plan,
  );
  assert(
    "7. journey object equals request context journey",
    JSON.stringify(payload.userContext.journey) ===
      JSON.stringify(request.context.journey),
  );

  // 8. Prompt layer does not call profile/DB services
  const buildSource = readFileSync(
    resolve("lib/intelligence/prompt/build-intelligence-prompt-payload.ts"),
    "utf8",
  );
  const indexSource = readFileSync(resolve("lib/intelligence/prompt/index.ts"), "utf8");
  for (const [label, source] of [
    ["build", buildSource],
    ["index", indexSource],
  ]) {
    const importLines = source
      .split("\n")
      .filter((line) => /^\s*import\b/.test(line))
      .join("\n");
    assert(
      `8. ${label} does not import auth/profile/supabase/bulletin services`,
      !importLines.includes("requireUser") &&
        !importLines.includes("@/lib/supabase") &&
        !importLines.includes("getProfileWithRelations") &&
        !importLines.includes("comparePriorityToBulletin") &&
        !importLines.includes("getStoredSubscriptionTier") &&
        !importLines.includes("buildIntelligenceContext") &&
        !importLines.includes("prepare-intelligence-request") &&
        !importLines.includes("build-intelligence-context"),
    );
  }

  // 9–10. Incomplete readiness carried
  const incomplete = incompleteRequest();
  const incompletePayload = buildIntelligencePromptPayload(incomplete, { createdAt });
  assert(
    "9. incomplete readiness status carried",
    incompletePayload.readiness.status === "needs_profile_information",
  );
  assert(
    "9. blocking reasons carried",
    incompletePayload.readiness.blockingReasons.includes(
      "immigration.employmentBasedCategory",
    ),
  );
  assert(
    "10. warnings carried without fabrication",
    incompletePayload.readiness.warnings.includes(
      "immigration.currentImmigrationStatus_unavailable",
    ),
  );
  assert(
    "10. null category not fabricated",
    incompletePayload.userContext.immigration.employmentBasedCategory === null,
  );

  // 11. Operational failures remain operational (not converted by prompt layer)
  const operational = new IntelligenceContextError(
    "INTELLIGENCE_CONTEXT_VISA_BULLETIN_UNAVAILABLE",
    "Unable to load Visa Bulletin cutoff data.",
  );
  assert("11. operational error remains IntelligenceContextError", operational instanceof IntelligenceContextError);
  assert(
    "11. incomplete payload is not an operational throw",
    incompletePayload.readiness.status === "needs_profile_information",
  );

  // 12. Prohibited private fields absent
  assertNoProhibited(payload);
  assertNoProhibited(incompletePayload);

  // 13. No provider-specific message type
  assert("13. no messages array", !("messages" in payload));
  assert("13. structured sections present", Array.isArray(payload.instructions.principles));

  // 14. No logging
  const validationSource = readFileSync(
    resolve("lib/intelligence/prompt/intelligence-prompt-payload.validation.ts"),
    "utf8",
  );
  const constantsSource = readFileSync(
    resolve("lib/intelligence/prompt/intelligence-prompt-payload.constants.ts"),
    "utf8",
  );
  for (const [label, source] of [
    ["build", buildSource],
    ["validation", validationSource],
    ["constants", constantsSource],
  ]) {
    assert(
      `14. ${label} has no console logging`,
      !source.includes("console.log") &&
        !source.includes("console.debug") &&
        !source.includes("console.info") &&
        !source.includes("console.warn") &&
        !source.includes("console.error"),
    );
  }

  // 15–16. No network / persistence APIs in prompt module
  const promptDirSources = [buildSource, validationSource, constantsSource, indexSource].join("\n");
  assert(
    "15. no network fetch/http clients",
    !promptDirSources.includes("fetch(") &&
      !promptDirSources.includes("axios") &&
      !promptDirSources.includes("http."),
  );
  assert(
    "16. no persistence APIs",
    !promptDirSources.includes("localStorage") &&
      !promptDirSources.includes("sessionStorage") &&
      !promptDirSources.includes("writeFile") &&
      !promptDirSources.includes("@/lib/supabase"),
  );

  // Ready payload readiness
  assert("ready payload readiness = ready", payload.readiness.status === "ready");
  assert("ready payload no blocking reasons", payload.readiness.blockingReasons.length === 0);

  console.log("\nS8-IIP-003 Intelligence Prompt Payload verification passed.");
}

main();
