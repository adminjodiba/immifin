/**
 * Deterministic Prompt Payload → OpenAI Responses API mapping (S8-IIP-006).
 *
 * Translates the approved payload only — does not invent facts or rewrite the question.
 */

import type { IntelligencePromptPayload } from "@/lib/intelligence/prompt/intelligence-prompt-payload.types";
import type { OpenAIResponsesCreateParams } from "@/lib/intelligence/providers/openai/openai-provider.types";

function stableSerialize(value: unknown): string {
  return JSON.stringify(value, (_key, current) => {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      const record = current as Record<string, unknown>;
      const ordered: Record<string, unknown> = {};
      for (const key of Object.keys(record).sort()) {
        const entry = record[key];
        if (typeof entry !== "function") {
          ordered[key] = entry;
        }
      }
      return ordered;
    }
    return current;
  });
}

/**
 * Build OpenAI `instructions` from static IMMIFIN role / principles / prohibitions.
 */
export function mapPromptPayloadToOpenAIInstructions(
  payload: IntelligencePromptPayload,
): string {
  const lines = [
    `Role: ${payload.instructions.role}`,
    "",
    "Principles:",
    ...payload.instructions.principles.map((item) => `- ${item}`),
    "",
    "Prohibited behaviors:",
    ...payload.instructions.prohibitedBehaviors.map((item) => `- ${item}`),
  ];
  return lines.join("\n");
}

/**
 * Build OpenAI `input` with labeled context, readiness, and the exact user question.
 */
export function mapPromptPayloadToOpenAIInput(
  payload: IntelligencePromptPayload,
): string {
  const sections = [
    "USER_CONTEXT",
    stableSerialize(payload.userContext),
    "",
    "READINESS",
    stableSerialize(payload.readiness),
    "",
    "USER_QUESTION",
    payload.userQuestion,
  ];
  return sections.join("\n");
}

/**
 * Map a Prompt Payload into a non-streaming Responses API create body.
 */
export function mapPromptPayloadToOpenAIResponsesRequest(
  payload: IntelligencePromptPayload,
  model: string,
): OpenAIResponsesCreateParams {
  return {
    model,
    instructions: mapPromptPayloadToOpenAIInstructions(payload),
    input: mapPromptPayloadToOpenAIInput(payload),
    store: false,
  };
}
