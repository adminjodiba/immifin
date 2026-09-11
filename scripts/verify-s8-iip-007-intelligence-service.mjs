/**
 * S8-IIP-007 — Intelligence Service and Controlled Provider Bootstrap verification.
 * Run: npx tsx scripts/verify-s8-iip-007-intelligence-service.mjs
 *
 * Injected fakes only — no real OpenAI / network / database.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { assembleIntelligenceContext } from "../lib/intelligence/context/index.ts";
import { assembleIntelligenceRequest } from "../lib/intelligence/request/index.ts";
import { buildIntelligencePromptPayload } from "../lib/intelligence/prompt/index.ts";
import {
  INTELLIGENCE_PROVIDER_CAPABILITY,
  INTELLIGENCE_PROVIDER_ERROR,
  INTELLIGENCE_PROVIDER_IDS,
  INTELLIGENCE_PROVIDER_INTERFACE_VERSION,
  IntelligenceProviderError,
  createIntelligenceProviderRegistry,
  isIntelligenceProviderError,
  resolveIntelligenceProvider,
} from "../lib/intelligence/providers/index.ts";
import { createBootstrappedIntelligenceProviderRegistry } from "../lib/intelligence/bootstrap/index.ts";
import {
  INTELLIGENCE_SERVICE_ERROR,
  executeIntelligenceRequest,
  isIntelligenceServiceError,
} from "../lib/intelligence/service/index.ts";

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

function readyRequest(question = "When might my priority date become current?") {
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
  return assembleIntelligenceRequest({
    question,
    context,
    requestId: "11111111-1111-4111-8111-111111111111",
    createdAt: "2026-07-25T12:00:01.000Z",
  });
}

function incompleteRequest(question = "What should I do next?") {
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
  return assembleIntelligenceRequest({
    question,
    context,
    requestId: "22222222-2222-4222-8222-222222222222",
    createdAt: "2026-07-25T12:00:01.000Z",
  });
}

function createFakeProvider(overrides = {}) {
  let calls = 0;
  const provider = {
    id: INTELLIGENCE_PROVIDER_IDS.OPENAI,
    name: "OpenAI",
    capabilities: [INTELLIGENCE_PROVIDER_CAPABILITY.TEXT_GENERATION],
    async generate(request) {
      calls += 1;
      if (typeof overrides.generate === "function") {
        return overrides.generate(request, calls);
      }
      return {
        responseVersion: INTELLIGENCE_PROVIDER_INTERFACE_VERSION,
        providerId: this.id,
        providerName: this.name,
        requestId: request.payload.requestId,
        createdAt: "2026-07-25T12:00:03.000Z",
        output: { text: "Normalized fixture answer" },
      };
    },
  };
  return { provider, getCalls: () => calls };
}

async function main() {
  let prepareCalls = 0;
  let payloadCalls = 0;
  let resolveCalls = 0;
  const question = "When might my priority date become current?";

  const { provider, getCalls } = createFakeProvider();
  const registry = createIntelligenceProviderRegistry();
  registry.register(provider);

  const deps = {
    async prepareRequest(q) {
      prepareCalls += 1;
      assert("2. service uses original question", q === question);
      return readyRequest(q);
    },
    buildPromptPayload(request) {
      payloadCalls += 1;
      return buildIntelligencePromptPayload(request, {
        createdAt: "2026-07-25T12:00:02.000Z",
      });
    },
    providerRegistry: registry,
    resolveProvider(input) {
      resolveCalls += 1;
      return resolveIntelligenceProvider(input);
    },
  };

  let missingProviderId = null;
  try {
    await executeIntelligenceRequest({ question }, deps);
  } catch (error) {
    missingProviderId = error;
  }
  assert(
    "3. service requires explicit providerId",
    isIntelligenceServiceError(missingProviderId) &&
      missingProviderId.code === INTELLIGENCE_SERVICE_ERROR.INVALID_INPUT,
  );

  const completed = await executeIntelligenceRequest(
    { question, providerId: INTELLIGENCE_PROVIDER_IDS.OPENAI },
    deps,
  );

  assert("1. service accepts approved input (question + providerId)", completed.status === "completed");
  assert("4. service uses request builder", prepareCalls === 1);
  assert("5. service uses prompt payload builder", payloadCalls === 1);
  assert("8. ready request builds one Prompt Payload", payloadCalls === 1);
  assert("9. ready request resolves one provider", resolveCalls === 1);
  assert("10. ready request executes provider exactly once", getCalls() === 1);
  assert("11. ready result preserves request ID", completed.requestId === "11111111-1111-4111-8111-111111111111");
  assert("12. ready result preserves provider ID", completed.providerId === "openai");
  assert("13. ready result returns normalized output text", completed.outputText === "Normalized fixture answer");
  assert("14. ready result does not expose Prompt Payload", !("payload" in completed) && !("userContext" in completed));
  assert("15. ready result does not expose raw provider response", !("output_text" in completed) && !("output" in completed));
  assert("28. service does not rewrite question", prepareCalls === 1 && question.includes("priority date"));
  assert("31. service does not infer a provider", completed.providerId === "openai");
  assert("32/33. no retry / no fallback", getCalls() === 1 && resolveCalls === 1);

  const executeSrc = readSource("lib/intelligence/service/execute-intelligence-request.ts");
  assert("6. service does not build context directly", !/buildIntelligenceContext/.test(executeSrc));
  assert("7. service does not query database directly", !/supabase|from\(["']profiles/.test(executeSrc));
  assert("29. service does not add Prompt Payload policy", !/INTELLIGENCE_PROMPT_PRINCIPLES/.test(executeSrc));
  assert("30. service does not select a model", !/OPENAI_MODEL|model:/.test(executeSrc));
  assert("45. service has no network clients", !/\bfetch\b|\baxios\b/.test(executeSrc));
  assert("48. service has no console logging", !/\bconsole\.(log|info|warn|error|debug)\b/.test(executeSrc));

  // Not-ready short-circuit
  let notReadyPrepare = 0;
  let notReadyPayload = 0;
  let notReadyResolve = 0;
  const { provider: unusedProvider, getCalls: unusedCalls } = createFakeProvider();
  const notReadyRegistry = createIntelligenceProviderRegistry();
  notReadyRegistry.register(unusedProvider);

  const notReadyDeps = {
    async prepareRequest(q) {
      notReadyPrepare += 1;
      return incompleteRequest(q);
    },
    buildPromptPayload(request) {
      notReadyPayload += 1;
      return buildIntelligencePromptPayload(request);
    },
    providerRegistry: notReadyRegistry,
    resolveProvider(input) {
      notReadyResolve += 1;
      return resolveIntelligenceProvider(input);
    },
  };

  const notReady = await executeIntelligenceRequest(
    { question: "What should I do next?", providerId: "openai" },
    notReadyDeps,
  );

  assert("16. not-ready returns readiness result", notReady.status === "needs_profile_information");
  assert("17. not-ready preserves blocking reasons", notReady.blockingReasons.length > 0);
  assert("18. not-ready preserves warnings", Array.isArray(notReady.warnings));
  assert("19. not-ready makes zero provider calls", unusedCalls() === 0);
  assert("20. not-ready avoids provider resolution", notReadyResolve === 0);
  assert("20b. not-ready skips prompt payload build", notReadyPayload === 0);
  assert("not-ready still prepared request", notReadyPrepare === 1);

  // Provider not found
  const emptyRegistry = createIntelligenceProviderRegistry();
  let notFound = null;
  try {
    await executeIntelligenceRequest(
      { question, providerId: "openai" },
      {
        async prepareRequest() {
          return readyRequest(question);
        },
        buildPromptPayload: buildIntelligencePromptPayload,
        providerRegistry: emptyRegistry,
        resolveProvider: resolveIntelligenceProvider,
      },
    );
  } catch (error) {
    notFound = error;
  }
  assert(
    "21. provider-not-found preserved",
    isIntelligenceProviderError(notFound) &&
      notFound.code === INTELLIGENCE_PROVIDER_ERROR.NOT_FOUND,
  );

  // Config / auth / rate / timeout / unavailable via fake provider throws
  async function expectProviderCode(code, generateImpl) {
    const { provider: p } = createFakeProvider({ generate: generateImpl });
    const reg = createIntelligenceProviderRegistry();
    reg.register(p);
    try {
      await executeIntelligenceRequest(
        { question, providerId: "openai" },
        {
          async prepareRequest() {
            return readyRequest(question);
          },
          buildPromptPayload: buildIntelligencePromptPayload,
          providerRegistry: reg,
          resolveProvider: resolveIntelligenceProvider,
        },
      );
      throw new Error(`expected ${code}`);
    } catch (error) {
      assert(`provider error ${code}`, isIntelligenceProviderError(error) && error.code === code);
    }
  }

  await expectProviderCode(INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED, async () => {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED,
      "OpenAI API key is not configured",
    );
  });
  assert("22. provider configuration error preserved", true);

  await expectProviderCode(INTELLIGENCE_PROVIDER_ERROR.AUTHENTICATION_FAILED, async () => {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.AUTHENTICATION_FAILED,
      "OpenAI authentication failed",
    );
  });
  assert("23. provider authentication error preserved", true);

  await expectProviderCode(INTELLIGENCE_PROVIDER_ERROR.RATE_LIMITED, async () => {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.RATE_LIMITED,
      "OpenAI rate limit exceeded",
    );
  });
  assert("24. provider rate-limit error preserved", true);

  await expectProviderCode(INTELLIGENCE_PROVIDER_ERROR.TIMEOUT, async () => {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.TIMEOUT,
      "OpenAI request timed out",
    );
  });
  assert("25. provider timeout error preserved", true);

  await expectProviderCode(INTELLIGENCE_PROVIDER_ERROR.UNAVAILABLE, async () => {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.UNAVAILABLE,
      "OpenAI service is unavailable",
    );
  });
  assert("26. provider unavailable error preserved", true);

  await expectProviderCode(INTELLIGENCE_PROVIDER_ERROR.PROVIDER_FAILURE, async () => {
    throw new IntelligenceProviderError(
      INTELLIGENCE_PROVIDER_ERROR.PROVIDER_FAILURE,
      "OpenAI provider request failed",
    );
  });
  assert("27. unknown operational error remains structured", true);

  // Bootstrap
  let factoryCalls = 0;
  const bootRegistry = createBootstrappedIntelligenceProviderRegistry({
    createOpenAIProvider() {
      factoryCalls += 1;
      return createFakeProvider().provider;
    },
  });
  assert("34. bootstrap returns registry", typeof bootRegistry.register === "function");
  assert("35. bootstrap registers OpenAI explicitly", bootRegistry.has("openai"));
  assert("36. bootstrap causes zero provider network/factory calls until generate", factoryCalls === 0);

  const listed = bootRegistry.list();
  assert(
    "37. bootstrap metadata has no secrets",
    listed[0].id === "openai" && !("apiKey" in listed[0]) && !JSON.stringify(listed).includes("sk-"),
  );

  const again = createBootstrappedIntelligenceProviderRegistry({
    registry: bootRegistry,
    createOpenAIProvider() {
      factoryCalls += 1;
      return createFakeProvider().provider;
    },
  });
  assert("38. bootstrap idempotent on existing openai registration", again === bootRegistry && factoryCalls === 0);

  // Missing config via lazy factory → NOT_CONFIGURED on request
  const missingConfigRegistry = createBootstrappedIntelligenceProviderRegistry({
    createOpenAIProvider() {
      throw new IntelligenceProviderError(
        INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED,
        "OpenAI API key is not configured",
      );
    },
  });
  let configError = null;
  try {
    await executeIntelligenceRequest(
      { question, providerId: "openai" },
      {
        async prepareRequest() {
          return readyRequest(question);
        },
        buildPromptPayload: buildIntelligencePromptPayload,
        providerRegistry: missingConfigRegistry,
        resolveProvider: resolveIntelligenceProvider,
      },
    );
  } catch (error) {
    configError = error;
  }
  assert(
    "40. missing OpenAI config structured error when requested",
    configError?.code === INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED,
  );

  // Import bootstrap without env must not throw
  assert("39. bootstrap import/create safe without OpenAI env", Boolean(createBootstrappedIntelligenceProviderRegistry({ skipOpenAI: true })));

  assert("41. fake provider injectable", getCalls() === 1);
  assert("42. fake request builder injectable", prepareCalls >= 1);
  assert("43. fake prompt builder injectable", payloadCalls >= 1);
  assert(
    "44. no real OpenAI client constructed in service/bootstrap",
    !/new\s+OpenAI\b/.test(readSource("lib/intelligence/service/execute-intelligence-request.ts")) &&
      !/new\s+OpenAI\b/.test(
        readSource("lib/intelligence/bootstrap/create-bootstrapped-intelligence-provider-registry.ts"),
      ),
  );

  // S8-IIP-008 adds authenticated /api/intelligence/ask — Server Actions / chat UI remain forbidden.
  assert(
    "49. intelligence API is ask-only when present",
    !readdirSync("app/api").includes("intelligence") ||
      (existsSync("app/api/intelligence/ask/route.ts") &&
        readdirSync("app/api/intelligence").every((name) => name === "ask")),
  );
  assert(
    "50. no Server Action intelligence file",
    !existsSync("app/actions/intelligence.ts") && !existsSync("lib/intelligence/actions.ts"),
  );
  assert("51. no dedicated /ai chat app route", !existsSync("app/ai"));

  for (const file of [
    "lib/intelligence/service/execute-intelligence-request.ts",
    "lib/intelligence/bootstrap/create-bootstrapped-intelligence-provider-registry.ts",
  ]) {
    const src = readSource(file);
    assert(`46/47. ${file} has no persistence APIs`, !/\blocalStorage\b|\bcreateClient\b|\.insert\(/.test(src));
  }

  const serverService = readSource("lib/intelligence/service/server.ts");
  assert('25. service server entry is server-only', serverService.includes('import "server-only"'));
  const serverBootstrap = readSource("lib/intelligence/bootstrap/server.ts");
  assert('25. bootstrap server entry is server-only', serverBootstrap.includes('import "server-only"'));

  console.log("\nS8-IIP-007 Intelligence Service verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
