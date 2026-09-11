/**
 * S8-IIP-002 — Intelligence Request Envelope Foundation verification.
 * Run: npx tsx scripts/verify-s8-iip-002-intelligence-request.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assembleIntelligenceContext } from "../lib/intelligence/context/index.ts";
import { isUtcIso8601Timestamp } from "../lib/intelligence/context/index.ts";
import {
  assembleIntelligenceRequest,
  INTELLIGENCE_QUESTION_MAX_LENGTH,
  INTELLIGENCE_REQUEST_ERROR,
  INTELLIGENCE_REQUEST_VERSION,
  IntelligenceRequestError,
  isIntelligenceRequestError,
  validateIntelligenceQuestion,
} from "../lib/intelligence/request/index.ts";
import { IntelligenceContextError } from "../lib/intelligence/context/intelligence-context.types.ts";

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

function usableContext() {
  return assembleIntelligenceContext({
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
}

function incompleteContext() {
  return assembleIntelligenceContext({
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
}

function assertNoProhibitedFields(request) {
  const serialized = JSON.stringify(request);
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
  assert("root has no email", !("email" in request));
  assert("root has no stripe ids", !("stripe_customer_id" in request));
}

function expectRequestError(label, fn, code) {
  try {
    fn();
    throw new Error(`FAIL: ${label} — expected throw`);
  } catch (error) {
    assert(label, isIntelligenceRequestError(error) && error.code === code);
  }
}

function main() {
  const createdAt = "2026-07-25T15:00:00.000Z";
  const requestId = "11111111-2222-4333-8444-555555555555";
  const context = usableContext();

  // 1. Valid question produces envelope
  const request = assembleIntelligenceRequest({
    question: "When might my priority date become current?",
    context,
    requestId,
    createdAt,
  });
  assert("1. valid question produces envelope", request.input.question.length > 0);
  assert("context attached without remapping version", request.context === context);

  // 2. Whitespace trimmed
  const trimmed = assembleIntelligenceRequest({
    question: "  Will Final Action Date move next month?  \n",
    context,
    requestId,
    createdAt,
  });
  assert(
    "2. leading/trailing whitespace removed",
    trimmed.input.question === "Will Final Action Date move next month?",
  );

  // 3–5. Reject empty / whitespace-only / too long
  expectRequestError(
    "3. empty question rejected",
    () => validateIntelligenceQuestion(""),
    INTELLIGENCE_REQUEST_ERROR.QUESTION_EMPTY,
  );
  expectRequestError(
    "4. whitespace-only question rejected",
    () => validateIntelligenceQuestion("   \n\t  "),
    INTELLIGENCE_REQUEST_ERROR.QUESTION_EMPTY,
  );
  expectRequestError(
    "5. over-max question rejected",
    () => validateIntelligenceQuestion("x".repeat(INTELLIGENCE_QUESTION_MAX_LENGTH + 1)),
    INTELLIGENCE_REQUEST_ERROR.QUESTION_TOO_LONG,
  );

  // 6. Max-length accepted
  const maxQuestion = "y".repeat(INTELLIGENCE_QUESTION_MAX_LENGTH);
  const maxRequest = assembleIntelligenceRequest({
    question: maxQuestion,
    context,
    requestId,
    createdAt,
  });
  assert("6. max-length question accepted", maxRequest.input.question.length === INTELLIGENCE_QUESTION_MAX_LENGTH);

  // 7. requestVersion stable
  assert("7. requestVersion constant", INTELLIGENCE_REQUEST_VERSION === "1.0.0");
  assert("7. requestVersion on envelope", request.requestVersion === "1.0.0");

  // 8. requestId present and not derived from user data
  assert("8. requestId present", typeof request.requestId === "string" && request.requestId.length > 0);
  assert("8. requestId not clerk id", request.requestId !== "user_clerk_1");
  assert("8. requestId not email", request.requestId !== "secret@example.com");
  assert("8. requestId not profile id", request.requestId !== "profile-1");
  const generatedIdRequest = assembleIntelligenceRequest({
    question: "Is my category current?",
    context,
    createdAt,
  });
  assert(
    "8. generated requestId looks like UUID",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      generatedIdRequest.requestId,
    ),
  );

  // 9. createdAt UTC ISO-8601
  assert("9. createdAt injectable", request.createdAt === createdAt);
  assert("9. createdAt ISO helper", isUtcIso8601Timestamp(request.createdAt));
  const liveStamp = assembleIntelligenceRequest({
    question: "What is my Date for Filing?",
    context,
  });
  assert("9. live createdAt is UTC ISO-8601", isUtcIso8601Timestamp(liveStamp.createdAt));

  // 10. Usable context → ready
  assert("10. usable context → ready", request.readiness.status === "ready");
  assert("10. ready has no blocking reasons", request.readiness.blockingReasons.length === 0);
  assert("10. warnings carried forward", request.readiness.warnings.length > 0);

  // 11–12. Incomplete context → needs_profile_information; fields carried
  const incomplete = incompleteContext();
  const incompleteRequest = assembleIntelligenceRequest({
    question: "How long until my green card?",
    context: incomplete,
    requestId,
    createdAt,
  });
  assert(
    "11. incomplete context → needs_profile_information",
    incompleteRequest.readiness.status === "needs_profile_information",
  );
  assert(
    "12. missing fields carried as blockingReasons",
    incompleteRequest.readiness.blockingReasons.includes(
      "immigration.employmentBasedCategory",
    ) &&
      incompleteRequest.readiness.blockingReasons.includes("immigration.priorityDate"),
  );
  assert(
    "12. warnings carried without fabrication",
    incompleteRequest.readiness.warnings.includes(
      "immigration.currentImmigrationStatus_unavailable",
    ),
  );
  assert(
    "12. null category not fabricated",
    incompleteRequest.context.immigration.employmentBasedCategory === null,
  );

  // 13. Operational context failures remain operational
  const operational = new IntelligenceContextError(
    "INTELLIGENCE_CONTEXT_VISA_BULLETIN_UNAVAILABLE",
    "Unable to load Visa Bulletin cutoff data.",
  );
  assert("13. operational error is IntelligenceContextError", operational instanceof IntelligenceContextError);
  assert(
    "13. operational error is not request validation / incomplete readiness",
    !(operational instanceof IntelligenceRequestError) &&
      incompleteRequest.readiness.status === "needs_profile_information",
  );

  // 14. No prohibited private fields
  assertNoProhibitedFields(request);
  assertNoProhibitedFields(incompleteRequest);

  // 15. No logging of question/context — static source review
  const prepareSource = readFileSync(
    resolve("lib/intelligence/request/prepare-intelligence-request.ts"),
    "utf8",
  );
  const assembleSource = readFileSync(
    resolve("lib/intelligence/request/assemble-intelligence-request.ts"),
    "utf8",
  );
  const validationSource = readFileSync(
    resolve("lib/intelligence/request/intelligence-request.validation.ts"),
    "utf8",
  );
  for (const [label, source] of [
    ["prepare", prepareSource],
    ["assemble", assembleSource],
    ["validation", validationSource],
  ]) {
    assert(
      `15. ${label} has no console logging`,
      !source.includes("console.log") &&
        !source.includes("console.debug") &&
        !source.includes("console.info") &&
        !source.includes("console.warn") &&
        !source.includes("console.error"),
    );
  }

  // 16. prepareIntelligenceRequest consumes buildIntelligenceContext
  assert(
    "16. prepare imports buildIntelligenceContext",
    prepareSource.includes(
      'from "@/lib/intelligence/context/build-intelligence-context"',
    ) && prepareSource.includes("buildIntelligenceContext()"),
  );
  assert(
    "16. prepare does not import requireUser / profiles / supabase server",
    !prepareSource.includes("requireUser") &&
      !prepareSource.includes("@/lib/supabase/server") &&
      !prepareSource.includes("getProfileWithRelations"),
  );
  assert("16. prepare is server-only", prepareSource.includes('import "server-only"'));

  expectRequestError(
    "non-string question rejected",
    () => validateIntelligenceQuestion(42),
    INTELLIGENCE_REQUEST_ERROR.QUESTION_INVALID_TYPE,
  );

  console.log("\nS8-IIP-002 Intelligence Request Envelope verification passed.");
}

main();
