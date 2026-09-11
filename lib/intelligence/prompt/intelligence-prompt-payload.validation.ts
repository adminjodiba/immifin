/**
 * IMMIFIN Intelligence Prompt Payload — contract validation.
 *
 * Structural checks only. Does not log payload or question text.
 */

import { isUtcIso8601Timestamp } from "@/lib/intelligence/context/intelligence-context.validation";
import {
  INTELLIGENCE_PROMPT_INSTRUCTION_ROLE,
  INTELLIGENCE_PROMPT_PAYLOAD_VERSION,
  INTELLIGENCE_PROMPT_PRINCIPLES,
  INTELLIGENCE_PROMPT_PROHIBITED_BEHAVIORS,
} from "@/lib/intelligence/prompt/intelligence-prompt-payload.constants";
import type { IntelligencePromptPayload } from "@/lib/intelligence/prompt/intelligence-prompt-payload.types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Intelligence Prompt Payload validation failed: ${message}`);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown, path: string): asserts value is string[] {
  assert(Array.isArray(value), `${path} must be an array`);
  assert(
    value.every((entry) => typeof entry === "string"),
    `${path} must contain only strings`,
  );
}

/**
 * Validates the assembled prompt payload contract shape.
 */
export function validateIntelligencePromptPayload(
  payload: IntelligencePromptPayload,
): void {
  assert(isPlainObject(payload), "payload must be an object");
  assert(
    payload.payloadVersion === INTELLIGENCE_PROMPT_PAYLOAD_VERSION,
    `payloadVersion must be ${INTELLIGENCE_PROMPT_PAYLOAD_VERSION}`,
  );
  assert(typeof payload.requestId === "string" && payload.requestId.length > 0, "requestId required");
  assert(typeof payload.createdAt === "string", "createdAt must be a string");
  assert(isUtcIso8601Timestamp(payload.createdAt), "createdAt must be UTC ISO-8601");

  assert(isPlainObject(payload.instructions), "instructions must be an object");
  assert(
    payload.instructions.role === INTELLIGENCE_PROMPT_INSTRUCTION_ROLE,
    "instructions.role must match centralized constant",
  );
  assertStringArray(payload.instructions.principles, "instructions.principles");
  assertStringArray(
    payload.instructions.prohibitedBehaviors,
    "instructions.prohibitedBehaviors",
  );
  assert(
    payload.instructions.principles.length === INTELLIGENCE_PROMPT_PRINCIPLES.length,
    "instructions.principles length must match constants",
  );
  assert(
    payload.instructions.prohibitedBehaviors.length ===
      INTELLIGENCE_PROMPT_PROHIBITED_BEHAVIORS.length,
    "instructions.prohibitedBehaviors length must match constants",
  );

  assert(isPlainObject(payload.userContext), "userContext must be an object");
  assert(
    typeof payload.userContext.contextVersion === "string",
    "userContext.contextVersion required",
  );
  assert(isPlainObject(payload.userContext.journey), "userContext.journey required");
  assert(isPlainObject(payload.userContext.immigration), "userContext.immigration required");
  assert(isPlainObject(payload.userContext.greenCard), "userContext.greenCard required");
  assert(isPlainObject(payload.userContext.visaBulletin), "userContext.visaBulletin required");
  assert(isPlainObject(payload.userContext.subscription), "userContext.subscription required");
  assert(isPlainObject(payload.userContext.readiness), "userContext.readiness required");

  assert(typeof payload.userQuestion === "string", "userQuestion must be a string");
  assert(payload.userQuestion.length > 0, "userQuestion must not be empty");

  assert(isPlainObject(payload.readiness), "readiness must be an object");
  assert(
    payload.readiness.status === "ready" ||
      payload.readiness.status === "needs_profile_information",
    "readiness.status invalid",
  );
  assertStringArray(payload.readiness.blockingReasons, "readiness.blockingReasons");
  assertStringArray(payload.readiness.warnings, "readiness.warnings");

  assert(isPlainObject(payload.metadata), "metadata must be an object");
  assert(typeof payload.metadata.requestVersion === "string", "metadata.requestVersion required");
  assert(typeof payload.metadata.contextVersion === "string", "metadata.contextVersion required");
  assert(
    isUtcIso8601Timestamp(payload.metadata.contextGeneratedAt),
    "metadata.contextGeneratedAt must be UTC ISO-8601",
  );
  assert(
    isUtcIso8601Timestamp(payload.metadata.requestCreatedAt),
    "metadata.requestCreatedAt must be UTC ISO-8601",
  );

  // Provider-neutrality: no vendor message shapes on the contract root.
  const prohibitedProviderKeys = [
    "messages",
    "system",
    "contents",
    "openai",
    "anthropic",
    "gemini",
    "model",
    "temperature",
  ] as const;
  for (const key of prohibitedProviderKeys) {
    assert(!(key in payload), `provider-specific field present: ${key}`);
  }

  const prohibitedPrivateKeys = [
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
  for (const key of prohibitedPrivateKeys) {
    assert(!(key in payload), `prohibited private field present: ${key}`);
  }
}
