/**
 * OpenAI adapter types (S8-IIP-006).
 *
 * Injected-client surface for deterministic verification — not a second provider contract.
 */

/** Minimal OpenAI Responses API create body used by Version 1. */
export type OpenAIResponsesCreateParams = {
  model: string;
  instructions: string;
  input: string;
  store: false;
};

/** Minimal OpenAI Responses API result used for normalization. */
export type OpenAIResponsesCreateResult = {
  id?: string | null;
  status?: string | null;
  output_text?: string | null;
  output?: unknown;
  error?: { message?: string | null; code?: string | null } | null;
};

/**
 * OpenAI-compatible client injectable for tests.
 * Production uses the official `openai` SDK instance.
 */
export type OpenAICompatibleClient = {
  responses: {
    create: (
      body: OpenAIResponsesCreateParams,
    ) => Promise<OpenAIResponsesCreateResult>;
  };
};

export type OpenAIProviderConfig = {
  apiKey: string;
  model: string;
};

export type CreateOpenAIProviderOptions = {
  /** Explicit API key. When omitted, reads OPENAI_API_KEY. */
  apiKey?: string;
  /** Explicit model id. When omitted, reads OPENAI_MODEL. */
  model?: string;
  /** Injected client for tests — skips real SDK construction. */
  client?: OpenAICompatibleClient;
  /** Optional env bag for deterministic config tests. */
  env?: NodeJS.ProcessEnv;
};
