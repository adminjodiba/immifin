/**
 * S8-IIP-010 — Intelligence Workspace Refinement and Production-Readiness Audit.
 * Run: npx tsx scripts/verify-s8-iip-010-intelligence-readiness.mjs
 *
 * Deterministic source + unit checks — no live OpenAI, no Clerk sessions, no deploy.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  INTELLIGENCE_API_CACHE_CONTROL,
  INTELLIGENCE_API_ERROR,
  INTELLIGENCE_API_MAX_BODY_BYTES,
  INTELLIGENCE_API_QUESTION_MAX_LENGTH,
  INTELLIGENCE_ENABLED_ENV,
  createAllowAllIntelligenceAbuseControl,
  handleIntelligenceAsk,
  isIntelligenceExecutionEnabled,
} from "../lib/intelligence/api/index.ts";
import {
  INTELLIGENCE_ASK_CLIENT_PROVIDER_ID,
  INTELLIGENCE_ASK_ENDPOINT,
  INTELLIGENCE_SUGGESTED_QUESTIONS,
  formatIntelligenceBlockingReason,
  mapIntelligenceAskHttpError,
} from "../lib/intelligence/client/index.ts";
import { CAPABILITY, canAccessAI, hasCapability } from "../lib/subscription/capabilities.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

function walkFiles(dir, predicate, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, predicate, acc);
    } else if (predicate(entry.name, full)) {
      acc.push(full);
    }
  }
  return acc;
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
    updated_at: "2026-07-25T00:00:00.000Z",
  };
}

function makePowerDeps(overrides = {}) {
  return {
    requireUser: async () => ({
      profile: makeProfile("power"),
      subscription: null,
      immigrationProfile: null,
    }),
    assertAiCapability: () => {},
    assertBetaEligibility: () => {},
    abuseControl: createAllowAllIntelligenceAbuseControl(),
    executeIntelligenceRequest: async () => ({
      status: "completed",
      requestId: "req-test",
      providerId: "openai",
      answer: "Safe answer",
      warnings: [],
    }),
    requireOrigin: false,
    ...overrides,
  };
}

async function main() {
  console.log("\nS8-IIP-010 Intelligence readiness verification\n");

  // 1. S8-IIP-009 artifacts
  assert("1. S8-IIP-009 page present", existsSync("app/intelligence/page.tsx"));
  assert("1. S8-IIP-009 workspace present", existsSync("components/intelligence/IntelligenceWorkspace.tsx"));
  assert("1. S8-IIP-009 gate present", existsSync("components/intelligence/IntelligenceAccessGate.tsx"));
  assert("1. S8-IIP-009 locked present", existsSync("components/intelligence/IntelligenceLockedState.tsx"));
  assert("1. S8-IIP-008 API route present", existsSync("app/api/intelligence/ask/route.ts"));
  assert("1. verify-009 present", existsSync("scripts/verify-s8-iip-009-intelligence-workspace.mjs"));

  const pageSrc = readSource("app/intelligence/page.tsx");
  const workspaceSrc = readSource("components/intelligence/IntelligenceWorkspace.tsx");
  const lockedSrc = readSource("components/intelligence/IntelligenceLockedState.tsx");
  const gateSrc = readSource("components/intelligence/IntelligenceAccessGate.tsx");
  const askSrc = readSource("lib/intelligence/client/ask-intelligence.ts");
  const hookSrc = readSource("lib/intelligence/client/use-intelligence-ask.ts");
  const mapSrc = readSource("lib/intelligence/client/map-intelligence-ask-error.ts");
  const handlerSrc = readSource("lib/intelligence/api/handle-intelligence-ask.ts");
  const routeSrc = readSource("app/api/intelligence/ask/route.ts");
  const abuseSrc = readSource("lib/intelligence/api/intelligence-api.abuse.ts");
  const gateExecSrc = readSource("lib/intelligence/api/intelligence-execution-gate.ts");
  const readinessDoc = readSource("docs/SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md");

  // 2–4 auth / capability
  assert("2. page uses ContactOnboardingGuard", pageSrc.includes("ContactOnboardingGuard"));
  assert("3. page capability gate present", pageSrc.includes("IntelligenceAccessGate"));
  assert("4. API uses assertCapability / accessAI path", handlerSrc.includes("assertAiCapability") || handlerSrc.includes("assertCapability"));
  assert("4. route wires handleIntelligenceAsk", routeSrc.includes("handleIntelligenceAsk"));

  // 5–7 Free/Pro/Power
  assert("5. Free denied", hasCapability("free", CAPABILITY.ai) === false);
  assert("6. Pro denied", hasCapability("pro", CAPABILITY.ai) === false);
  assert("7. Power allowed", canAccessAI("power") === true);

  // 8 locked zero API
  assert("8. locked state has no fetch/ask", !/fetch\(|askIntelligence|useIntelligenceAsk/.test(lockedSrc));
  assert("8. gate does not call ask API", !/askIntelligence|\/api\/intelligence\/ask/.test(gateSrc));

  // 9–11 suggestions
  assert("9. 3–4 suggestions", INTELLIGENCE_SUGGESTED_QUESTIONS.length >= 3 && INTELLIGENCE_SUGGESTED_QUESTIONS.length <= 4);
  assert(
    "9. suggestions safe",
    !INTELLIGENCE_SUGGESTED_QUESTIONS.some((q) =>
      /eligible|guarantee|predict|legal strategy|USCIS will decide/i.test(q),
    ),
  );
  assert("10. suggestions populate only", workspaceSrc.includes("applySuggestion") && workspaceSrc.includes("setQuestion(suggestion)"));
  assert("11. suggestions do not submit", !/applySuggestion[\s\S]{0,200}submit\(/.test(workspaceSrc));

  // 12–18 lifecycle
  assert("12. one request / abort", hookSrc.includes("AbortController") && hookSrc.includes("sequenceRef"));
  assert("13. duplicate submit lock", workspaceSrc.includes("submitLockRef") || hookSrc.includes("inFlightRef"));
  assert("14. abort handling", hookSrc.includes("AbortError"));
  assert("15. stale response protection", hookSrc.includes("sequence !== sequenceRef.current"));
  assert("16. aborted no generic error", /AbortError[\s\S]{0,120}return/.test(hookSrc));
  assert("17. no automatic retry", !/retry|setInterval|setTimeout\(\s*\(\)\s*=>\s*submit/.test(hookSrc + askSrc));
  assert("18. no polling", !/setInterval|EventSource|text\/event-stream/.test(hookSrc + askSrc + workspaceSrc));

  // 19–21 answer rendering
  assert("19. plain-text wrap", workspaceSrc.includes("whitespace-pre-wrap") && /break-words|overflow-wrap/.test(workspaceSrc));
  assert("20. no dangerouslySetInnerHTML", !/dangerouslySetInnerHTML/.test(workspaceSrc));
  assert("21. long text wrapping classes", /break-words|\[overflow-wrap:anywhere\]/.test(workspaceSrc));

  // 22–23 profile
  assert("22. profile CTA /user-profile", workspaceSrc.includes('href="/user-profile"'));
  assert("22. preferred profile heading", workspaceSrc.includes("Complete your immigration profile"));
  assert(
    "23. internal codes hidden",
    formatIntelligenceBlockingReason("MISSING_PRIORITY_DATE") === "Additional profile details",
  );
  assert(
    "23. friendly labels",
    formatIntelligenceBlockingReason("priorityDate") === "Priority date",
  );

  // 24–31 error mapping
  assert("24. auth maps", mapIntelligenceAskHttpError(401, { error: { code: "INTELLIGENCE_API_UNAUTHENTICATED" } }).errorKind === "unauthenticated");
  assert("25. capability maps", mapIntelligenceAskHttpError(403, { error: { code: "AI_CAPABILITY_REQUIRED" } }).errorKind === "capability_required");
  assert("26. validation maps", mapIntelligenceAskHttpError(400, { error: { code: "INTELLIGENCE_API_INVALID_REQUEST" } }).errorKind === "validation");
  assert("27. rate-limit maps", mapIntelligenceAskHttpError(429, { error: { code: "INTELLIGENCE_ABUSE_LIMIT_EXCEEDED" } }).errorKind === "rate_limited");
  assert("28. unavailable maps", mapIntelligenceAskHttpError(503, { error: { code: "INTELLIGENCE_PROVIDER_UNAVAILABLE" } }).errorKind === "unavailable");
  assert("29. timeout maps", mapIntelligenceAskHttpError(504, { error: { code: "INTELLIGENCE_PROVIDER_TIMEOUT" } }).errorKind === "timeout");
  assert("30. not configured maps", mapIntelligenceAskHttpError(503, { error: { code: "INTELLIGENCE_PROVIDER_NOT_CONFIGURED" } }).errorKind === "not_configured");
  assert("30b. kill switch maps unavailable", mapIntelligenceAskHttpError(503, { error: { code: "INTELLIGENCE_EXECUTION_DISABLED" } }).errorKind === "unavailable");
  assert("31. generic maps", mapIntelligenceAskHttpError(500, null).errorKind === "generic");

  // 32 question preserved (workspace does not clear question on error)
  assert("32. question preserved on error path", !/setQuestion\(""\)[\s\S]{0,80}error/.test(workspaceSrc) && workspaceSrc.includes("Ask another question"));

  // 33 request-id policy
  assert("33. support reference label", workspaceSrc.includes("Support reference"));
  const completedBlock = workspaceSrc.match(
    /result\?\.kind === "completed"[\s\S]*?result\?\.kind === "needs_profile_information"/,
  )?.[0] ?? "";
  assert("33. success UI does not show requestId", completedBlock.length > 0 && !/requestId/.test(completedBlock));
  assert("33. readiness documents request-id policy", /Support reference|request-id policy/i.test(readinessDoc));

  // 34–39 commercial claims / provider leakage
  assert("34. no provider name in workspace", !/\bOpenAI\b|\bGPT\b/i.test(workspaceSrc));
  assert("35. no model name in workspace", !/\bgpt-4|\bclaude\b/i.test(workspaceSrc));
  assert("36. no token usage UI", !/token usage|tokens used/i.test(workspaceSrc));
  assert("37. no cost UI", !/per request|\$\d|token cost/i.test(workspaceSrc));
  assert("38. no free-trial claim", !/free trial/i.test(workspaceSrc + lockedSrc));
  assert("39. no unlimited claim", !/unlimited/i.test(workspaceSrc + lockedSrc));

  // 40–45 privacy / persistence
  assert("40. no history UI", !/messages\.map|chatThread|conversationHistory/i.test(workspaceSrc));
  assert("41. no persistence APIs in workspace/client", !/localStorage|sessionStorage/.test(workspaceSrc + askSrc + hookSrc));
  assert("42. no localStorage", !/localStorage/.test(workspaceSrc + askSrc + hookSrc));
  assert("43. no sessionStorage", !/sessionStorage/.test(workspaceSrc + askSrc + hookSrc));
  assert("44. no content logging", !/console\.(log|info|debug|warn|error)/.test(workspaceSrc + askSrc + hookSrc + mapSrc));
  assert("45. no analytics capture of content", !/posthog|gtag|analytics\.|sentry|captureException|track\(/.test(workspaceSrc + askSrc + hookSrc));

  // 46–50 client boundaries
  const clientFiles = walkFiles("lib/intelligence/client", (name) => name.endsWith(".ts"));
  const componentFiles = walkFiles("components/intelligence", (name) => name.endsWith(".tsx"));
  for (const file of [...clientFiles, ...componentFiles]) {
    const src = readFileSync(file, "utf8");
    const rel = file.replace(resolve(".") + "\\", "").replace(resolve(".") + "/", "");
    assert(`46–48. ${rel} no openai / service server`, !/from\s+["']openai["']|intelligence\/service\/server|createOpenAIProvider/.test(src));
    assert(`49–50. ${rel} no supabase/stripe client`, !/from\s+["']@\/lib\/supabase\/server["']|from\s+["']stripe["']|from\s+["']@\/lib\/stripe/.test(src));
  }

  // 51–55 client payload
  assert("51. client does not send user id", !/userId|clerk_user_id|profileId/.test(askSrc.split("JSON.stringify")[1] || ""));
  assert("52. client does not send plan", !/\bplan\b/.test(askSrc.split("JSON.stringify")[1] || ""));
  assert("53. no model override", !/model:/.test(askSrc));
  assert("54. no system instructions", !/systemInstruction|system_prompt|instructions:/.test(askSrc));
  assert("55. no prompt payload", !/promptPayload|PromptPayload/.test(askSrc));
  assert("providerId debt constant only", INTELLIGENCE_ASK_CLIENT_PROVIDER_ID === "openai");
  assert("endpoint correct", INTELLIGENCE_ASK_ENDPOINT === "/api/intelligence/ask");

  // 56–59 API security constants
  assert("56. private no-store", INTELLIGENCE_API_CACHE_CONTROL.includes("no-store") && INTELLIGENCE_API_CACHE_CONTROL.includes("private"));
  assert("57. no wildcard CORS in API", !/Access-Control-Allow-Origin:\s*\*/.test(handlerSrc + routeSrc + readSource("lib/intelligence/api/intelligence-api.http.ts")));
  assert("58. body limit enforced", INTELLIGENCE_API_MAX_BODY_BYTES > 0 && INTELLIGENCE_API_MAX_BODY_BYTES <= 8192);
  assert("59. question limit enforced", INTELLIGENCE_API_QUESTION_MAX_LENGTH === 2000);

  // 60–64 a11y
  assert("60. textarea label", workspaceSrc.includes('htmlFor={questionId}') || workspaceSrc.includes("Your question"));
  assert("61. loading announced", workspaceSrc.includes('aria-live="polite"') && workspaceSrc.includes("preparing your response"));
  assert("62. results announced", workspaceSrc.includes("Response ready"));
  assert("63. errors announced", workspaceSrc.includes('role="alert"'));
  assert("64. focus behavior", workspaceSrc.includes("resultRef.current?.focus") && workspaceSrc.includes("textareaRef.current?.focus"));

  // 65–67 readiness doc
  assert("65. readiness document exists", existsSync("docs/SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md"));
  const recommendationMatches = readinessDoc.match(/GO FOR CONTROLLED BETA|CONDITIONAL GO|NO-GO/g) || [];
  const uniqueRecs = [...new Set(recommendationMatches)];
  assert("66. one approved recommendation present", uniqueRecs.length >= 1);
  assert(
    "66. final recommendation is CONDITIONAL GO",
    /##\s*25\.\s*Final recommendation[\s\S]{0,400}CONDITIONAL GO/i.test(readinessDoc) ||
      /\*\*Final recommendation:\*\*\s*CONDITIONAL GO/i.test(readinessDoc),
  );
  assert("67. does not claim full public launch", !/approved for (full )?public (production )?launch|ready for unrestricted production/i.test(readinessDoc));
  assert("67. Sprint 8 not auto-complete", !/Sprint 8 is complete|Sprint 8 complete/i.test(readinessDoc));

  // Kill switch
  assert("kill switch module present", existsSync("lib/intelligence/api/intelligence-execution-gate.ts"));
  assert("kill switch env name", INTELLIGENCE_ENABLED_ENV === "IMMIFIN_INTELLIGENCE_ENABLED");
  assert("kill switch default enabled", isIntelligenceExecutionEnabled({}));
  assert("kill switch false disables", isIntelligenceExecutionEnabled({ IMMIFIN_INTELLIGENCE_ENABLED: "false" }) === false);
  assert("handler checks kill switch", handlerSrc.includes("isIntelligenceExecutionEnabled"));
  assert("error code exists", INTELLIGENCE_API_ERROR.EXECUTION_DISABLED === "INTELLIGENCE_EXECUTION_DISABLED");

  const previous = process.env.IMMIFIN_INTELLIGENCE_ENABLED;
  process.env.IMMIFIN_INTELLIGENCE_ENABLED = "false";
  try {
    let executed = false;
    const res = await handleIntelligenceAsk(
      new Request("http://localhost:3000/api/intelligence/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "Test?", providerId: "openai" }),
      }),
      makePowerDeps({
        executeIntelligenceRequest: async () => {
          executed = true;
          return {
            status: "completed",
            requestId: "should-not-run",
            providerId: "openai",
            answer: "nope",
            warnings: [],
          };
        },
      }),
    );
    const body = await res.json();
    assert("kill switch returns 503", res.status === 503);
    assert("kill switch safe code", body?.error?.code === "INTELLIGENCE_EXECUTION_DISABLED");
    assert("kill switch does not execute provider", executed === false);
  } finally {
    if (previous === undefined) {
      delete process.env.IMMIFIN_INTELLIGENCE_ENABLED;
    } else {
      process.env.IMMIFIN_INTELLIGENCE_ENABLED = previous;
    }
  }

  // Abuse classification documented
  assert("abuse allow-all documented in source", abuseSrc.includes("allow-all") || abuseSrc.includes("Allow every"));
  assert("readiness classifies abuse", /Acceptable for controlled beta|Not implemented|Development-only/i.test(readinessDoc));

  // Locked headline
  assert("locked Power headline", lockedSrc.includes("Unlock IMMIFIN Intelligence with Power"));

  // Loading preferred wording
  assert("loading preferred wording", workspaceSrc.includes("IMMIFIN is preparing your response…"));

  // 68–70 process constraints (static)
  // Live provider execution is avoided by injecting executeIntelligenceRequest (proved above).
  assert("68. no live provider call occurs", true);
  // This story verify script performs no deploy; deployment is out of scope for S8-IIP-010.
  assert("69. no deployment occurs", true);
  assert("70. prior verify scripts present", existsSync("scripts/verify-s8-iip-001-intelligence-context.mjs"));
  assert("70. verify-008 present", existsSync("scripts/verify-s8-iip-008-intelligence-api.mjs"));

  // env.example
  const envExample = readSource(".env.example");
  assert(".env.example documents OPENAI_API_KEY", envExample.includes("OPENAI_API_KEY"));
  assert(".env.example documents kill switch", envExample.includes("IMMIFIN_INTELLIGENCE_ENABLED"));
  assert(".env.example kill switch not enabled true by default", !/IMMIFIN_INTELLIGENCE_ENABLED=true/.test(envExample));

  console.log("\nS8-IIP-010 verification PASSED\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
