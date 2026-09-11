/**
 * S8-IIP-008 — Authenticated Intelligence API Foundation verification.
 * Run: npx tsx scripts/verify-s8-iip-008-intelligence-api.mjs
 *
 * Injected fakes only — no real OpenAI / network / Clerk / database.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { AuthError } from "../lib/auth/errors.ts";
import { PUBLIC_ROUTE_PATTERNS } from "../lib/auth/publicRoutes.ts";
import {
  INTELLIGENCE_API_CACHE_CONTROL,
  INTELLIGENCE_API_ERROR,
  INTELLIGENCE_API_MAX_BODY_BYTES,
  INTELLIGENCE_API_QUESTION_MAX_LENGTH,
  INTELLIGENCE_ASK_ROUTE,
  IntelligenceApiError,
  assertIntelligenceAskOrigin,
  createAllowAllIntelligenceAbuseControl,
  createDenyingIntelligenceAbuseControl,
  createDefaultIntelligenceAskHandlerDependencies,
  getIntelligenceApiAllowedOrigins,
  handleIntelligenceAsk,
  validateIntelligenceAskRequest,
} from "../lib/intelligence/api/index.ts";
import { INTELLIGENCE_PROVIDER_ERROR, IntelligenceProviderError } from "../lib/intelligence/providers/index.ts";
import { CAPABILITY, canAccessAI, hasCapability } from "../lib/subscription/capabilities.ts";
import { assertCapability } from "../lib/subscription/assertCapability.ts";
import { getStoredSubscriptionTier } from "../lib/subscription/service.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

function makeProfile(plan = "power") {
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

function makeSubscription(plan = "power", status = "active") {
  return {
    id: "sub-1",
    profile_id: "profile-1",
    plan,
    status,
    stripe_customer_id: "cus_secret",
    stripe_subscription_id: "sub_secret",
    stripe_price_id: "price_secret",
    billing_interval: "month",
    stripe_status: status,
    cancel_at_period_end: false,
    canceled_at: null,
    current_period_start: null,
    current_period_end: null,
    last_synchronized_at: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeRelations(plan = "power", subscriptionStatus = "active") {
  const profile = makeProfile(plan);
  const subscription =
    plan === "free" && subscriptionStatus === "none"
      ? null
      : makeSubscription(plan === "free" ? "free" : plan, subscriptionStatus);
  return {
    profile,
    subscription,
    immigrationProfile: null,
  };
}

function jsonRequest(body, headers = {}) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return new Request("http://localhost:3000/api/intelligence/ask", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
      ...headers,
    },
    body: raw,
  });
}

function assertAiCapability(profileWithRelations) {
  try {
    assertCapability(profileWithRelations, CAPABILITY.ai);
  } catch (error) {
    if (error instanceof AuthError && error.status === 403) {
      throw new IntelligenceApiError(
        INTELLIGENCE_API_ERROR.AI_CAPABILITY_REQUIRED,
        error.message,
        403,
      );
    }
    throw error;
  }
}

function createDeps(overrides = {}) {
  let serviceCalls = 0;
  let subscriptionChecks = 0;
  const executeIntelligenceRequest =
    overrides.executeIntelligenceRequest ??
    (async (input) => {
      serviceCalls += 1;
      return {
        status: "completed",
        requestId: "req-1",
        contextVersion: "1.0.0",
        providerId: input.providerId,
        outputText: "Safe answer",
        metadata: {
          providerName: "OpenAI",
          responseVersion: "1.0.0",
          createdAt: "2026-07-25T00:00:00.000Z",
        },
      };
    });

  const requireUser =
    overrides.requireUser ??
    (async () => {
      return makeRelations("power");
    });

  const wrappedAssert =
    overrides.assertAiCapability ??
    ((profile) => {
      subscriptionChecks += 1;
      assertAiCapability(profile);
    });

  return {
    deps: {
      requireUser,
      assertAiCapability: wrappedAssert,
      // S8-IIP-011 beta gate: unit tests inject a no-op; production defaults enforce allowlist.
      assertBetaEligibility: overrides.assertBetaEligibility ?? (() => {}),
      abuseControl: overrides.abuseControl ?? createAllowAllIntelligenceAbuseControl(),
      executeIntelligenceRequest,
      requireOrigin: overrides.requireOrigin ?? false,
    },
    getServiceCalls: () => serviceCalls,
    getSubscriptionChecks: () => subscriptionChecks,
    bumpService: () => {
      serviceCalls += 1;
    },
  };
}

async function readJson(response) {
  return response.json();
}

async function main() {
  assert("1. route supports POST", existsSync("app/api/intelligence/ask/route.ts"));
  const routeSrc = readSource("app/api/intelligence/ask/route.ts");
  assert("1. route exports POST", /export async function POST/.test(routeSrc));
  assert("1. runtime nodejs", /export const runtime = "nodejs"/.test(routeSrc));
  assert("37. route does not import OpenAI SDK", !/from\s+["']openai["']/.test(routeSrc));
  assert(
    "38. route does not call provider adapter directly",
    !/createOpenAIProvider|providers\/openai/.test(routeSrc),
  );
  assert(
    "24. route delegates to Intelligence Service",
    /executeIntelligenceRequest/.test(routeSrc) && /handleIntelligenceAsk/.test(routeSrc),
  );

  // Capability map (already present — Free/Pro false, Power true)
  assert("10. AI capability key is accessAI", CAPABILITY.ai === "accessAI");
  assert("11. Free accessAI false", hasCapability("free", "accessAI") === false);
  assert("12. Pro accessAI false", hasCapability("pro", "accessAI") === false);
  assert("13. Power accessAI true", hasCapability("power", "accessAI") === true);
  assert("canAccessAI matches map", canAccessAI("power") && !canAccessAI("pro"));

  // Validation helpers
  const trimmed = validateIntelligenceAskRequest({
    question: "  Hello world  ",
    providerId: "openai",
  });
  assert("6. route trims question", trimmed.question === "Hello world");
  assert(
    "8. max length constant is 2000",
    INTELLIGENCE_API_QUESTION_MAX_LENGTH === 2000,
  );

  let tooLongErr;
  try {
    validateIntelligenceAskRequest({
      question: "x".repeat(2001),
      providerId: "openai",
    });
  } catch (error) {
    tooLongErr = error;
  }
  assert("7. rejects question above maximum", tooLongErr?.code === INTELLIGENCE_API_ERROR.INVALID_REQUEST);
  assert("8. does not silently truncate", !tooLongErr?.message?.includes("truncated"));

  let unexpectedErr;
  try {
    validateIntelligenceAskRequest({
      question: "ok",
      providerId: "openai",
      plan: "power",
      userId: "user_x",
    });
  } catch (error) {
    unexpectedErr = error;
  }
  assert(
    "12/21/22. rejects unexpected fields (plan/userId)",
    unexpectedErr?.code === INTELLIGENCE_API_ERROR.INVALID_REQUEST,
  );

  let badProvider;
  try {
    validateIntelligenceAskRequest({ question: "ok", providerId: "not-a-provider" });
  } catch (error) {
    badProvider = error;
  }
  assert("9. rejects invalid provider ID", badProvider?.code === INTELLIGENCE_API_ERROR.INVALID_REQUEST);

  // Malformed JSON / missing body
  {
    const { deps, getServiceCalls } = createDeps();
    const res = await handleIntelligenceAsk(
      new Request("http://localhost:3000/api/intelligence/ask", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: "{not-json",
      }),
      deps,
    );
    const body = await readJson(res);
    assert("2. rejects malformed JSON", res.status === 400 && body.ok === false);
    assert("2. malformed JSON safe code", body.error.code === INTELLIGENCE_API_ERROR.INVALID_JSON);
    assert("15. malformed path zero service calls", getServiceCalls() === 0);
  }

  {
    const { deps } = createDeps();
    const res = await handleIntelligenceAsk(
      new Request("http://localhost:3000/api/intelligence/ask", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000" },
        body: "   ",
      }),
      deps,
    );
    const body = await readJson(res);
    assert("3. rejects missing/blank body", res.status === 400 && body.ok === false);
  }

  {
    const { deps, getServiceCalls } = createDeps();
    const res = await handleIntelligenceAsk(
      jsonRequest({ providerId: "openai" }),
      deps,
    );
    const body = await readJson(res);
    assert("4. rejects missing question", res.status === 400 && body.error.code === INTELLIGENCE_API_ERROR.INVALID_REQUEST);
    assert("zero service on missing question", getServiceCalls() === 0);
  }

  {
    const { deps } = createDeps();
    const res = await handleIntelligenceAsk(
      jsonRequest({ question: "   ", providerId: "openai" }),
      deps,
    );
    assert("5. rejects blank question", res.status === 400);
  }

  {
    const { deps } = createDeps();
    const res = await handleIntelligenceAsk(
      new Request("http://localhost:3000/api/intelligence/ask", {
        method: "POST",
        headers: { "content-type": "text/plain", origin: "http://localhost:3000" },
        body: JSON.stringify({ question: "ok", providerId: "openai" }),
      }),
      deps,
    );
    const body = await readJson(res);
    assert(
      "10. rejects unsupported content type",
      res.status === 400 && body.error.code === INTELLIGENCE_API_ERROR.INVALID_CONTENT_TYPE,
    );
  }

  {
    const { deps } = createDeps();
    const huge = "x".repeat(INTELLIGENCE_API_MAX_BODY_BYTES + 10);
    const res = await handleIntelligenceAsk(
      new Request("http://localhost:3000/api/intelligence/ask", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "content-length": String(huge.length),
        },
        body: huge,
      }),
      deps,
    );
    assert("11. rejects body above approved size", res.status === 413);
  }

  // Unauthenticated
  {
    let subChecks = 0;
    const { deps, getServiceCalls } = createDeps({
      requireUser: async () => {
        throw new AuthError("Authentication required.", 401);
      },
      assertAiCapability: () => {
        subChecks += 1;
      },
    });
    const res = await handleIntelligenceAsk(
      jsonRequest({ question: "Hello", providerId: "openai" }),
      deps,
    );
    const body = await readJson(res);
    assert("13. unauthenticated returns 401", res.status === 401);
    assert(
      "13. unauthenticated code",
      body.error.code === INTELLIGENCE_API_ERROR.UNAUTHENTICATED,
    );
    assert("14. unauthenticated zero capability/subscription checks", subChecks === 0);
    assert("15. unauthenticated zero Intelligence Service calls", getServiceCalls() === 0);
    assert("53. no stack in error", !("stack" in body) && !String(JSON.stringify(body)).includes("at "));
    assert("55. no question in error", !JSON.stringify(body).includes("Hello"));
  }

  // Free / Pro denied, Power allowed
  for (const plan of ["free", "pro"]) {
    const { deps, getServiceCalls } = createDeps({
      requireUser: async () => makeRelations(plan),
    });
    const res = await handleIntelligenceAsk(
      jsonRequest({ question: "Hello", providerId: "openai" }),
      deps,
    );
    const body = await readJson(res);
    assert(
      `16/17. authenticated ${plan} denied`,
      res.status === 403 && body.error.code === INTELLIGENCE_API_ERROR.AI_CAPABILITY_REQUIRED,
    );
    assert(`23. ${plan} denial zero service calls`, getServiceCalls() === 0);
    assert(
      `25. ${plan} denial no billing internals`,
      !JSON.stringify(body).includes("cus_secret") &&
        !JSON.stringify(body).includes("stripe"),
    );
  }

  {
    const { deps, getServiceCalls } = createDeps({
      requireUser: async () => makeRelations("power"),
    });
    const res = await handleIntelligenceAsk(
      jsonRequest({ question: "  What does my profile mean?  ", providerId: "openai" }),
      deps,
    );
    const body = await readJson(res);
    assert("18. Power user allowed when eligible", res.status === 200 && body.ok === true);
    assert("32. ready request calls service exactly once", getServiceCalls() === 1);
    assert("39. completed maps to 200", res.status === 200);
    assert("40. safe answer fields", body.answer === "Safe answer" && body.providerId === "openai");
    assert("41. no Prompt Payload", !("payload" in body) && !("prompt" in body));
    assert("42. no raw provider response", !("raw" in body) && !("output_text" in body));
    assert(
      "57. private no-store caching",
      res.headers.get("cache-control") === INTELLIGENCE_API_CACHE_CONTROL,
    );
  }

  // Inactive / canceled → effective Free → denied
  {
    const relations = makeRelations("power", "canceled");
    const tier = getStoredSubscriptionTier({
      profile: relations.profile,
      subscription: relations.subscription,
    });
    assert("19. canceled subscription effective tier is free", tier === "free");
    const { deps, getServiceCalls } = createDeps({
      requireUser: async () => relations,
    });
    const res = await handleIntelligenceAsk(
      jsonRequest({ question: "Hello", providerId: "openai" }),
      deps,
    );
    assert(
      "19. inactive/canceled denied via capability",
      res.status === 403 && getServiceCalls() === 0,
    );
  }

  // Origin
  {
    const allowed = getIntelligenceApiAllowedOrigins({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    assert("26. approved localhost origin listed", allowed.has("http://localhost:3000"));
    assert("26. approved tunnel origin listed", allowed.has("https://dev.immifin.com"));

    let originErr;
    try {
      assertIntelligenceAskOrigin(
        new Request("http://localhost:3000/api/intelligence/ask", {
          method: "POST",
          headers: { origin: "https://evil.example" },
        }),
        { requireOrigin: true },
      );
    } catch (error) {
      originErr = error;
    }
    assert(
      "27. unapproved origin rejected when required",
      originErr?.code === INTELLIGENCE_API_ERROR.ORIGIN_REJECTED,
    );
  }

  assert("28. wildcard CORS not in route", !/Access-Control-Allow-Origin\s*:\s*\*/.test(routeSrc));
  assert(
    "28. route sets no CORS wildcard",
    !/Access-Control-Allow-Origin/.test(routeSrc) &&
      !/Access-Control-Allow-Origin/.test(readSource("lib/intelligence/api/intelligence-api.http.ts")),
  );

  // Abuse control before service
  {
    let serviceCalls = 0;
    const { deps } = createDeps({
      abuseControl: createDenyingIntelligenceAbuseControl(),
      executeIntelligenceRequest: async () => {
        serviceCalls += 1;
        return {
          status: "completed",
          requestId: "x",
          contextVersion: "1.0.0",
          providerId: "openai",
          outputText: "nope",
          metadata: {
            providerName: "x",
            responseVersion: "1.0.0",
            createdAt: "2026-07-25T00:00:00.000Z",
          },
        };
      },
    });
    const res = await handleIntelligenceAsk(
      jsonRequest({ question: "Hello", providerId: "openai" }),
      deps,
    );
    const body = await readJson(res);
    assert("29/30. abuse denial before service", res.status === 429 && serviceCalls === 0);
    assert(
      "31. rate-limit status 429",
      body.error.code === INTELLIGENCE_API_ERROR.ABUSE_LIMIT_EXCEEDED,
    );
  }

  // Pass-through of validated question + providerId
  {
    let seen;
    const { deps } = createDeps({
      executeIntelligenceRequest: async (input) => {
        seen = input;
        return {
          status: "completed",
          requestId: "req-pass",
          contextVersion: "1.0.0",
          providerId: input.providerId,
          outputText: "ok",
          metadata: {
            providerName: "OpenAI",
            responseVersion: "1.0.0",
            createdAt: "2026-07-25T00:00:00.000Z",
          },
        };
      },
    });
    await handleIntelligenceAsk(
      jsonRequest({ question: "  Exact question  ", providerId: "openai" }),
      deps,
    );
    assert("34. passes validated trimmed question", seen.question === "Exact question");
    assert("35. passes validated provider ID", seen.providerId === "openai");
    assert("36. does not pass model overrides", !("model" in seen));
    assert("33. identity via server auth only (no userId in service input)", !("userId" in seen));
  }

  // Not-ready
  {
    let serviceCalls = 0;
    const { deps } = createDeps({
      executeIntelligenceRequest: async () => {
        serviceCalls += 1;
        return {
          status: "needs_profile_information",
          requestId: "req-nr",
          blockingReasons: ["priorityDate"],
          warnings: ["status_unavailable"],
        };
      },
    });
    const res = await handleIntelligenceAsk(
      jsonRequest({ question: "Hello", providerId: "openai" }),
      deps,
    );
    const body = await readJson(res);
    assert("43. not-ready maps to 422", res.status === 422);
    assert("44. not-ready preserves blocking reasons", body.blockingReasons.includes("priorityDate"));
    assert("45. mocked service path called once (zero provider via mock)", serviceCalls === 1);
  }

  // Provider error mappings
  const providerCases = [
    [INTELLIGENCE_PROVIDER_ERROR.NOT_FOUND, 502, INTELLIGENCE_API_ERROR.PROVIDER_NOT_FOUND],
    [INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED, 503, INTELLIGENCE_API_ERROR.PROVIDER_NOT_CONFIGURED],
    [
      INTELLIGENCE_PROVIDER_ERROR.AUTHENTICATION_FAILED,
      502,
      INTELLIGENCE_API_ERROR.PROVIDER_AUTHENTICATION_FAILED,
    ],
    [INTELLIGENCE_PROVIDER_ERROR.RATE_LIMITED, 429, INTELLIGENCE_API_ERROR.PROVIDER_RATE_LIMITED],
    [INTELLIGENCE_PROVIDER_ERROR.TIMEOUT, 504, INTELLIGENCE_API_ERROR.PROVIDER_TIMEOUT],
    [INTELLIGENCE_PROVIDER_ERROR.UNAVAILABLE, 503, INTELLIGENCE_API_ERROR.PROVIDER_UNAVAILABLE],
  ];

  for (const [code, status, apiCode] of providerCases) {
    const { deps } = createDeps({
      executeIntelligenceRequest: async () => {
        throw new IntelligenceProviderError(code, "provider boom with sk-secret-key");
      },
    });
    const res = await handleIntelligenceAsk(
      jsonRequest({ question: "secret question text", providerId: "openai" }),
      deps,
    );
    const body = await readJson(res);
    assert(`provider ${code} → ${status}`, res.status === status && body.error.code === apiCode);
    assert(
      `safe mapping for ${code}`,
      !JSON.stringify(body).includes("sk-secret") &&
        !JSON.stringify(body).includes("secret question"),
    );
  }

  {
    const { deps } = createDeps({
      executeIntelligenceRequest: async () => {
        throw new Error("Unexpected boom stack");
      },
    });
    const res = await handleIntelligenceAsk(
      jsonRequest({ question: "Hello", providerId: "openai" }),
      deps,
    );
    const body = await readJson(res);
    assert("52. unexpected error maps safely", res.status === 500);
    assert("53. no stack trace returned", !JSON.stringify(body).includes("Unexpected boom"));
    assert("54. no API key returned", !JSON.stringify(body).toLowerCase().includes("api_key"));
    assert("56. no internal user id", !JSON.stringify(body).includes("profile-1"));
  }

  // Public route pattern for JSON 401
  assert(
    "middleware public pattern for ask route",
    PUBLIC_ROUTE_PATTERNS.some((p) => String(p).includes("/api/intelligence/ask")),
  );

  // Source constraints
  const handlerSrc = readSource("lib/intelligence/api/handle-intelligence-ask.ts");
  assert("63. no retry loop", !/for\s*\(.*retry|while\s*\(.*retry|Array\.from\(\s*\{\s*length:\s*3/.test(handlerSrc));
  assert("64. no fallback provider", !/fallback|anthropic|gemini/.test(handlerSrc));
  assert("65. no streaming", !/stream|SSE|text\/event-stream/.test(handlerSrc));
  assert("62. no console logging of content", !/console\.(log|info|debug|warn|error)/.test(handlerSrc));
  assert(
    "60/61. no persistence APIs in handler",
    !/\.insert\(|localStorage|createClient/.test(handlerSrc),
  );
  assert(
    "20. capability uses assertCapability/CAPABILITY.ai",
    handlerSrc.includes("CAPABILITY.ai") && handlerSrc.includes("assertCapability"),
  );
  const handleFn = handlerSrc.slice(handlerSrc.indexOf("export async function handleIntelligenceAsk"));
  assert(
    "29. abuse check before service",
    handleFn.indexOf("abuseControl.check") < handleFn.indexOf("deps.executeIntelligenceRequest"),
  );

  assert("66. no dedicated /ai chat app route", !existsSync("app/ai"));
  assert(
    "66b. workspace if present is single-turn foundation",
    !existsSync("app/intelligence") || existsSync("app/intelligence/page.tsx"),
  );
  assert(
    "ask-only API folder",
    readdirSync("app/api/intelligence").every((name) => name === "ask"),
  );

  assert(
    "58. missing OpenAI config does not break route import text",
    !/OPENAI_API_KEY|process\.env/.test(routeSrc),
  );

  assert(
    "commercial usage quota not invented",
    !/daily limit|monthly token|unlimited AI/i.test(readSource("lib/intelligence/api/intelligence-api.abuse.ts")),
  );

  // Default deps factory wires allow-all abuse control
  const wired = createDefaultIntelligenceAskHandlerDependencies(async () => ({
    status: "completed",
    requestId: "r",
    contextVersion: "1.0.0",
    providerId: "openai",
    outputText: "x",
    metadata: {
      providerName: "OpenAI",
      responseVersion: "1.0.0",
      createdAt: "2026-07-25T00:00:00.000Z",
    },
  }));
  assert(
    "abuse default allow-all",
    (await wired.abuseControl.check({ subjectKey: "p", route: INTELLIGENCE_ASK_ROUTE })).allowed ===
      true,
  );

  console.log("\nS8-IIP-008 Authenticated Intelligence API verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
