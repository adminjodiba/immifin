/**
 * IMMIFIN Intelligence Context — structural validation.
 *
 * Distinguishes:
 * 1. Valid and usable context
 * 2. Valid but incomplete context
 * 3. Invalid contract shape (throws — programming / assembly bug)
 *
 * Incomplete profile data is not an infrastructure failure.
 */

import { INTELLIGENCE_CONTEXT_VERSION } from "@/lib/intelligence/context/intelligence-context.constants";
import type {
  IntelligenceContext,
  IntelligenceContextReadiness,
  IntelligenceJourneyKind,
} from "@/lib/intelligence/context/intelligence-context.types";
import type { JourneyStage } from "@/lib/dashboard/journeyStage";
import { isSubscriptionTier } from "@/lib/subscription/tiers";

const JOURNEY_KINDS: readonly IntelligenceJourneyKind[] = [
  "employment_gc_waiting",
  "green_card_holder",
  "incomplete",
];

const JOURNEY_STAGES: readonly JourneyStage[] = [
  "employment_gc_waiting",
  "green_card_holder",
  "citizen_future",
];

const ISO_8601_UTC_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Intelligence Context validation failed: ${message}`);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringOrNull(value: unknown, path: string): asserts value is string | null {
  assert(value === null || typeof value === "string", `${path} must be string | null`);
}

function assertStringArray(value: unknown, path: string): asserts value is string[] {
  assert(Array.isArray(value), `${path} must be an array`);
  assert(
    value.every((entry) => typeof entry === "string"),
    `${path} must contain only strings`,
  );
}

/** True when generatedAt is a UTC ISO-8601 timestamp. */
export function isUtcIso8601Timestamp(value: string): boolean {
  if (!ISO_8601_UTC_PATTERN.test(value)) {
    return false;
  }

  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

/**
 * Validates the assembled context contract shape.
 * Returns the readiness block for caller convenience.
 */
export function validateIntelligenceContext(
  context: IntelligenceContext,
): IntelligenceContextReadiness {
  assert(isPlainObject(context), "context must be an object");
  assert(
    context.contextVersion === INTELLIGENCE_CONTEXT_VERSION,
    `contextVersion must be ${INTELLIGENCE_CONTEXT_VERSION}`,
  );
  assert(typeof context.generatedAt === "string", "generatedAt must be a string");
  assert(
    isUtcIso8601Timestamp(context.generatedAt),
    "generatedAt must be a valid UTC ISO-8601 timestamp",
  );

  assert(isPlainObject(context.user), "user must be an object");
  assertStringOrNull(context.user.firstName, "user.firstName");

  assert(isPlainObject(context.subscription), "subscription must be an object");
  assert(
    isSubscriptionTier(context.subscription.plan),
    "subscription.plan must be free | pro | power",
  );

  assert(isPlainObject(context.journey), "journey must be an object");
  assert(
    JOURNEY_KINDS.includes(context.journey.kind),
    "journey.kind is invalid",
  );
  assert(
    JOURNEY_STAGES.includes(context.journey.stage),
    "journey.stage is invalid",
  );

  assert(isPlainObject(context.immigration), "immigration must be an object");
  assertStringOrNull(
    context.immigration.countryOfChargeability,
    "immigration.countryOfChargeability",
  );
  assertStringOrNull(
    context.immigration.employmentBasedCategory,
    "immigration.employmentBasedCategory",
  );
  assertStringOrNull(context.immigration.priorityDate, "immigration.priorityDate");
  assert(
    context.immigration.currentImmigrationStatus === null,
    "immigration.currentImmigrationStatus must be null in Version 1",
  );

  assert(isPlainObject(context.greenCard), "greenCard must be an object");
  assert(typeof context.greenCard.isHolder === "boolean", "greenCard.isHolder must be boolean");
  assertStringOrNull(context.greenCard.issueDate, "greenCard.issueDate");

  assert(isPlainObject(context.visaBulletin), "visaBulletin must be an object");
  assertStringOrNull(context.visaBulletin.bulletinMonth, "visaBulletin.bulletinMonth");
  assertStringOrNull(
    context.visaBulletin.finalActionDate,
    "visaBulletin.finalActionDate",
  );
  assertStringOrNull(context.visaBulletin.dateForFiling, "visaBulletin.dateForFiling");

  assert(isPlainObject(context.readiness), "readiness must be an object");
  assert(
    context.readiness.status === "usable" || context.readiness.status === "incomplete",
    "readiness.status must be usable | incomplete",
  );
  assert(typeof context.readiness.usable === "boolean", "readiness.usable must be boolean");
  assertStringArray(
    context.readiness.missingRequiredFields,
    "readiness.missingRequiredFields",
  );
  assertStringArray(context.readiness.warnings, "readiness.warnings");

  assert(
    context.readiness.usable === (context.readiness.status === "usable"),
    "readiness.usable must match readiness.status",
  );
  assert(
    context.readiness.usable
      ? context.readiness.missingRequiredFields.length === 0
      : context.readiness.missingRequiredFields.length > 0,
    "readiness.missingRequiredFields must align with usable status",
  );

  // Prohibited private fields must never appear on the contract root.
  const prohibitedKeys = [
    "email",
    "phone",
    "phone_number",
    "stripe_customer_id",
    "stripe_subscription_id",
    "clerk_user_id",
    "sessionToken",
    "privateMetadata",
    "supabase",
  ] as const;

  for (const key of prohibitedKeys) {
    assert(!(key in context), `prohibited field present: ${key}`);
  }

  return context.readiness;
}
