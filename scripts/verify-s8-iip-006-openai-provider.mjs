/**
 * S8-IIP-006 — OpenAI Provider Adapter Foundation verification.
 * Run: npx tsx scripts/verify-s8-iip-006-openai-provider.mjs
 *
 * Uses an injected fake OpenAI-compatible client — no real network / API key.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
} from "openai";
import { assembleIntelligenceContext } from "../lib/intelligence/context/index.ts";
import { assembleIntelligenceRequest } from "../lib/intelligence/request/index.ts";
import { buildIntelligencePromptPayload } from "../lib/intelligence/prompt/index.ts";
import {
  INTELLIGENCE_PROVIDER_CAPABILITY,
  INTELLIGENCE_PROVIDER_ERROR,
  INTELLIGENCE_PROVIDER_IDS,
  createIntelligenceProviderRegistry,
  createOpenAIProvider,
  isIntelligenceProviderError,
  mapOpenAIErrorToProviderError,
  mapPromptPayloadToOpenAIResponsesRequest,
  resolveIntelligenceProvider,
  resolveOpenAIProviderConfig,
  validateOpenAIProviderConfig,
} from "../lib/intelligence/providers/index.ts";
import {
  mapPromptPayloadToOpenAIInput,
  mapPromptPayloadToOpenAIInstructions,
} from "../lib/intelligence/providers/openai/openai-provider.mapper.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

function makeProfile() {
  return {
    id: "profile-1",
    clerk_user_id: "user_clerk_1",
    email: "secret@example.com",
    plan: "pro",
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

function makeSubscription() {
  return {
    id: "sub-1",
    profile_id: "profile-1",
    plan: "pro",
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

function readyPayload() {
  const context = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile(),
    immigrationProfile: makeImmigration(),
    subscription: makeSubscription(),
    visaBulletin: {
      bulletinMonth: "2026-08",
      finalActionDate: "2018-01-01",
      dateForFiling: "C",
    },
    generatedAt: "2026-07-25T12:00:00.000Z",
  });
  const request = assembleIntelligenceRequest({
    question: "When might my priority date become current?",
    context,
    requestId: "11111111-1111-4111-8111-111111111111",
    createdAt: "2026-07-25T12:00:01.000Z",
  });
  return buildIntelligencePromptPayload(request, {
    createdAt: "2026-07-25T12:00:02.000Z",
  });
}

function incompletePayload() {
  const context = assembleIntelligenceContext({
    firstName: "Alex",
    profile: makeProfile(),
    immigrationProfile: makeImmigration({
      default_category: null,
      priority_date: null,
    }),
    subscription: makeSubscription(),
    visaBulletin: {
      bulletinMonth: null,
      finalActionDate: null,
      dateForFiling: null,
    },
    generatedAt: "2026-07-25T12:00:00.000Z",
  });
  const request = assembleIntelligenceRequest({
    question: "What should I do next?",
    context,
    requestId: "22222222-2222-4222-8222-222222222222",
    createdAt: "2026-07-25T12:00:01.000Z",
  });
  return buildIntelligencePromptPayload(request, {
    createdAt: "2026-07-25T12:00:02.000Z",
  });
}

function createFakeClient(handler) {
  let calls = 0;
  const lastBodies = [];
  return {
    client: {
      responses: {
        async create(body) {
          calls += 1;
          lastBodies.push(body);
          return handler(body, calls);
        },
      },
    },
    getCalls: () => calls,
    getLastBody: () => lastBodies[lastBodies.length - 1],
  };
}

function assertNoSecret(value, label) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  assert(
    `${label} omits API key material`,
    !text.includes("sk-test-secret") && !text.includes("sk-live"),
  );
}

async function main() {
  const payload = readyPayload();
  const incomplete = incompletePayload();

  const fake = createFakeClient(() => ({
    id: "resp_test",
    status: "completed",
    output_text: "  Deterministic OpenAI fixture text.  ",
    output: [],
  }));

  const provider = createOpenAIProvider({
    apiKey: "sk-test-secret",
    model: "gpt-4.1-mini",
    client: fake.client,
  });

  assert("1. provider satisfies interface fields", typeof provider.generate === "function");
  assert("2. provider id is openai", provider.id === INTELLIGENCE_PROVIDER_IDS.OPENAI);
  assert("3. provider metadata safe name", provider.name === "OpenAI");
  assert(
    "4. only text_generation capability",
    provider.capabilities.length === 1 &&
      provider.capabilities[0] === INTELLIGENCE_PROVIDER_CAPABILITY.TEXT_GENERATION,
  );

  let missingKey = null;
  try {
    validateOpenAIProviderConfig({ apiKey: "", model: "gpt-4.1-mini" });
  } catch (error) {
    missingKey = error;
  }
  assert("5/6. blank API key rejected", missingKey?.code === INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED);
  assertNoSecret(missingKey?.message ?? "", "5/6. blank key error");

  let missingModel = null;
  try {
    validateOpenAIProviderConfig({ apiKey: "sk-test-secret", model: "   " });
  } catch (error) {
    missingModel = error;
  }
  assert("7/8. blank model rejected", missingModel?.code === INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED);
  assertNoSecret(missingModel?.message ?? "", "7/8. blank model error");

  let missingEnv = null;
  try {
    resolveOpenAIProviderConfig({ env: {} });
  } catch (error) {
    missingEnv = error;
  }
  assert("5. missing env API key rejected", missingEnv?.code === INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED);
  assertNoSecret(String(missingEnv), "9. missing env error object");

  const mapped = mapPromptPayloadToOpenAIResponsesRequest(payload, "gpt-4.1-mini");
  const instructions = mapPromptPayloadToOpenAIInstructions(payload);
  const input = mapPromptPayloadToOpenAIInput(payload);
  assert("10. mapping deterministic model", mapped.model === "gpt-4.1-mini");
  assert("10. mapping store false", mapped.store === false);
  assert("11. question preserved in input", input.includes(payload.userQuestion));
  assert("12. instructions preserve role", instructions.includes(payload.instructions.role));
  assert(
    "12. instructions preserve first principle",
    instructions.includes(payload.instructions.principles[0]),
  );
  assert(
    "13. user context category from payload only",
    input.includes(payload.userContext.immigration.employmentBasedCategory),
  );
  assert(
    "14. readiness warnings preserved in mapping",
    input.includes(JSON.stringify(payload.readiness.warnings)),
  );
  const mappedAgain = mapPromptPayloadToOpenAIResponsesRequest(payload, "gpt-4.1-mini");
  assert(
    "10. mapping stable for same payload",
    JSON.stringify(mapped) === JSON.stringify(mappedAgain),
  );

  let notReadyError = null;
  try {
    await provider.generate({ payload: incomplete });
  } catch (error) {
    notReadyError = error;
  }
  assert(
    "15. not-ready payload rejected",
    notReadyError?.code === INTELLIGENCE_PROVIDER_ERROR.INVALID_REQUEST,
  );
  assert("16. not-ready causes zero client calls", fake.getCalls() === 0);

  const response = await provider.generate({ payload });
  assert("17. ready payload causes exactly one client call", fake.getCalls() === 1);
  assert("18. Responses API body used", Boolean(fake.getLastBody()?.input));
  assert("19. configured model passed", fake.getLastBody()?.model === "gpt-4.1-mini");
  assert("20. response storage disabled", fake.getLastBody()?.store === false);
  assert(
    "21. successful output text normalized",
    response.output.text === "Deterministic OpenAI fixture text.",
  );
  assert("22. requestId normalized from payload", response.requestId === payload.requestId);
  assert("23. usage metadata absent from contract response", !("usage" in response));
  assert("31. raw SDK response not returned", !("output_text" in response) && !("id" in response));
  assertNoSecret(response, "32. normalized output");

  const emptyFake = createFakeClient(() => ({
    id: "resp_empty",
    status: "completed",
    output_text: "   ",
    output: [],
  }));
  const emptyProvider = createOpenAIProvider({
    apiKey: "sk-test-secret",
    model: "gpt-4.1-mini",
    client: emptyFake.client,
  });
  let emptyError = null;
  try {
    await emptyProvider.generate({ payload });
  } catch (error) {
    emptyError = error;
  }
  assert("24. empty response structured error", emptyError?.code === INTELLIGENCE_PROVIDER_ERROR.EMPTY_RESPONSE);

  const authErr = mapOpenAIErrorToProviderError({
    name: "AuthenticationError",
    status: 401,
    message: "unauthorized",
  });
  assert(
    "25. authentication error mapped",
    authErr.code === INTELLIGENCE_PROVIDER_ERROR.AUTHENTICATION_FAILED,
  );
  assertNoSecret(authErr.message, "25. auth error message");
  assert("33. prompt absent from auth error", !authErr.message.includes(payload.userQuestion));

  const rateErr = mapOpenAIErrorToProviderError({
    name: "RateLimitError",
    status: 429,
    message: "rate",
  });
  assert("26. rate-limit error mapped", rateErr.code === INTELLIGENCE_PROVIDER_ERROR.RATE_LIMITED);

  const timeoutErr = mapOpenAIErrorToProviderError({
    name: "APIConnectionTimeoutError",
    message: "timeout",
  });
  assert("27. timeout error mapped", timeoutErr.code === INTELLIGENCE_PROVIDER_ERROR.TIMEOUT);
  const timeoutSdkErr = mapOpenAIErrorToProviderError(new APIConnectionTimeoutError());
  assert(
    "27b. SDK timeout instance mapped",
    timeoutSdkErr.code === INTELLIGENCE_PROVIDER_ERROR.TIMEOUT,
  );

  const invalidErr = mapOpenAIErrorToProviderError({
    name: "BadRequestError",
    status: 400,
    message: "invalid",
  });
  assert("28. invalid-request error mapped", invalidErr.code === INTELLIGENCE_PROVIDER_ERROR.INVALID_REQUEST);

  const unavailableErr = mapOpenAIErrorToProviderError({
    name: "InternalServerError",
    status: 500,
    message: "down",
  });
  assert("29. provider-server error mapped", unavailableErr.code === INTELLIGENCE_PROVIDER_ERROR.UNAVAILABLE);

  const unknownErr = mapOpenAIErrorToProviderError(new Error("mystery"));
  assert("30. unknown error mapped safely", unknownErr.code === INTELLIGENCE_PROVIDER_ERROR.PROVIDER_FAILURE);

  const connErr = mapOpenAIErrorToProviderError(new APIConnectionError({ message: "conn" }));
  assert(
    "connection error mapped",
    connErr.code === INTELLIGENCE_PROVIDER_ERROR.CONNECTION_FAILED,
  );

  // Also exercise official SDK-generated errors when constructible.
  const sdkAuth = APIError.generate(
    401,
    { error: { message: "unauthorized" } },
    "unauthorized",
    new Headers(),
  );
  const sdkAuthMapped = mapOpenAIErrorToProviderError(sdkAuth);
  assert(
    "25b. SDK-generated 401 maps to authentication failure",
    sdkAuthMapped.code === INTELLIGENCE_PROVIDER_ERROR.AUTHENTICATION_FAILED,
  );

  const registryCalls = createFakeClient(() => ({
    output_text: "unused",
  }));
  const registryProvider = createOpenAIProvider({
    apiKey: "sk-test-secret",
    model: "gpt-4.1-mini",
    client: registryCalls.client,
  });
  const registry = createIntelligenceProviderRegistry();
  registry.register(registryProvider);
  assert("34. provider can be registered", registry.has(INTELLIGENCE_PROVIDER_IDS.OPENAI));
  assert("36. registration causes zero OpenAI calls", registryCalls.getCalls() === 0);
  const resolved = resolveIntelligenceProvider({
    registry,
    providerId: INTELLIGENCE_PROVIDER_IDS.OPENAI,
  });
  assert("35. provider can be resolved", resolved === registryProvider);
  const listed = registry.list();
  assert(
    "3. listing metadata safe",
    listed[0].id === "openai" &&
      listed[0].name === "OpenAI" &&
      !("apiKey" in listed[0]) &&
      !("client" in listed[0]),
  );

  const packageJson = readSource("package.json");
  assert("44. openai dependency present", /"openai"\s*:/.test(packageJson));
  assert("44. no anthropic dependency", !/"@anthropic-ai\//.test(packageJson));
  assert("44. no langchain dependency", !/"langchain"\s*:/.test(packageJson));
  assert("44. no ai sdk dependency", !/"ai"\s*:/.test(packageJson));

  for (const file of [
    "openai-provider.ts",
    "openai-provider.config.ts",
    "openai-provider.mapper.ts",
    "openai-provider.errors.ts",
    "openai-provider.types.ts",
    "index.ts",
  ]) {
    const src = readSource(`lib/intelligence/providers/openai/${file}`);
    assert(`42. ${file} has no console logging`, !/\bconsole\.(log|info|warn|error|debug)\b/.test(src));
    assert(
      `40. ${file} has no database access`,
      !/from\s+["']@\/lib\/supabase|from\s+["']@supabase/.test(src),
    );
    assert(
      `41. ${file} has no persistence APIs`,
      !/\blocalStorage\b|\bindexedDB\b|\bcreateClient\b/.test(src),
    );
  }

  const providerSrc = readSource("lib/intelligence/providers/openai/openai-provider.ts");
  assert(
    "18. uses responses.create",
    /responses\.create/.test(providerSrc),
  );
  assert(
    "37/38. no auto-registration side effects",
    !/\.register\(/.test(providerSrc) && !/createIntelligenceProviderRegistry\(/.test(providerSrc),
  );
  assert("cancellation deferred — no AbortSignal in generate contract", !/AbortSignal/.test(providerSrc));

  const serverSrc = readSource("lib/intelligence/providers/server.ts");
  assert('20. server barrel remains server-only', serverSrc.includes('import "server-only"'));
  assert("server barrel exports createOpenAIProvider", serverSrc.includes("createOpenAIProvider"));

  // S8-IIP-008 may add authenticated /api/intelligence/ask — direct openai/ai API folders remain forbidden.
  assert(
    "no direct openai/ai API route folders",
    !readdirSync("app/api").some((name) => /^(openai|ai)$/i.test(name)),
  );
  assert("39. no dedicated /ai chat app route", !existsSync("app/ai"));

  const envExample = readSource(".env.example");
  assert("env example documents OPENAI_API_KEY", /OPENAI_API_KEY=/.test(envExample));
  assert("env example documents OPENAI_MODEL", /OPENAI_MODEL=/.test(envExample));
  assert("env example has no secret values", !/sk-[a-zA-Z0-9]{10,}/.test(envExample));
  assert("no NEXT_PUBLIC_OPENAI", !/NEXT_PUBLIC_OPENAI/.test(envExample));

  // Import-time: creating the module graph already happened; ensure no calls yet on a fresh client.
  const importSafety = createFakeClient(() => ({ output_text: "x" }));
  createOpenAIProvider({
    apiKey: "sk-test-secret",
    model: "gpt-4.1-mini",
    client: importSafety.client,
  });
  assert("37. construction causes zero OpenAI calls", importSafety.getCalls() === 0);

  console.log("\nS8-IIP-006 OpenAI Provider Adapter verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
