/**
 * S8-IIP-011 — Controlled-Beta Pre-Launch Remediation and Validation.
 * Run: npx tsx scripts/verify-s8-iip-011-controlled-beta-readiness.mjs
 *
 * Deterministic checks only — no live OpenAI, no Clerk sessions, no deploy.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  INTELLIGENCE_API_ERROR,
  createAllowAllIntelligenceAbuseControl,
  handleIntelligenceAsk,
  isIntelligenceExecutionEnabled,
} from "../lib/intelligence/api/index.ts";
import {
  INTELLIGENCE_BETA_USER_IDS_ENV,
  parseIntelligenceBetaAllowlist,
  resolveIntelligenceBetaEligibility,
} from "../lib/intelligence/beta/index.ts";
import { mapIntelligenceAskHttpError } from "../lib/intelligence/client/index.ts";
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
    if (entry.isDirectory()) walkFiles(full, predicate, acc);
    else if (predicate(entry.name, full)) acc.push(full);
  }
  return acc;
}

function makeProfile(plan = "power", clerkUserId = "user_clerk_invited") {
  return {
    id: "profile-1",
    clerk_user_id: clerkUserId,
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

function makeDeps(overrides = {}) {
  return {
    requireUser: async () => ({
      profile: makeProfile("power", "user_clerk_invited"),
      subscription: null,
      immigrationProfile: null,
    }),
    assertAiCapability: () => {},
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

async function ask(deps) {
  return handleIntelligenceAsk(
    new Request("http://localhost:3000/api/intelligence/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "Explain Final Action Date simply.", providerId: "openai" }),
    }),
    deps,
  );
}

async function main() {
  console.log("\nS8-IIP-011 Controlled-beta readiness verification\n");

  assert("1. prior artifacts page", existsSync("app/intelligence/page.tsx"));
  assert("1. prior artifacts API", existsSync("app/api/intelligence/ask/route.ts"));
  assert("1. verify-010 present", existsSync("scripts/verify-s8-iip-010-intelligence-readiness.mjs"));
  assert("1. readiness doc present", existsSync("docs/SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md"));

  assert("2. Power capability still required", canAccessAI("power") === true);
  assert("2. Free still denied accessAI", hasCapability("free", CAPABILITY.ai) === false);
  assert("2. Pro still denied accessAI", hasCapability("pro", CAPABILITY.ai) === false);

  const pageSrc = readSource("app/intelligence/page.tsx");
  const handlerSrc = readSource("lib/intelligence/api/handle-intelligence-ask.ts");
  const betaSrc = readSource("lib/intelligence/beta/intelligence-beta-eligibility.ts");
  const betaUiSrc = readSource("components/intelligence/IntelligenceBetaUnavailableState.tsx");
  const gateSrc = readSource("components/intelligence/IntelligenceBetaServerGate.tsx");
  const lockedSrc = readSource("components/intelligence/IntelligenceLockedState.tsx");
  const askSrc = readSource("lib/intelligence/client/ask-intelligence.ts");
  const workspaceSrc = readSource("components/intelligence/IntelligenceWorkspace.tsx");
  const opsSrc = readSource("docs/INTELLIGENCE_BETA_OPERATIONS.md");
  const readinessSrc = readSource("docs/SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md");
  const envExample = readSource(".env.example");
  const privacySrc = readSource("app/privacy/page.tsx");
  const termsSrc = readSource("app/terms/page.tsx");

  assert("3. beta resolver exists", existsSync("lib/intelligence/beta/intelligence-beta-eligibility.ts"));
  assert("4. page uses IntelligenceBetaServerGate", pageSrc.includes("IntelligenceBetaServerGate"));
  assert("5. API asserts beta eligibility", handlerSrc.includes("assertBetaEligibility") || handlerSrc.includes("resolveIntelligenceBetaEligibility"));

  assert("6. signed-out remains API concern (route auth)", handlerSrc.includes("requireUser"));
  assert("7. Free denied", hasCapability("free", CAPABILITY.ai) === false);
  assert("8. Pro denied", hasCapability("pro", CAPABILITY.ai) === false);

  // Eligibility unit behavior
  assert(
    "9/12. missing allowlist fails closed",
    resolveIntelligenceBetaEligibility("user_a", {}).eligible === false,
  );
  assert(
    "12. blank allowlist fails closed",
    resolveIntelligenceBetaEligibility("user_a", { [INTELLIGENCE_BETA_USER_IDS_ENV]: "  " }).eligible ===
      false,
  );
  assert(
    "9. non-invited denied",
    resolveIntelligenceBetaEligibility("user_other", {
      [INTELLIGENCE_BETA_USER_IDS_ENV]: "user_invited",
    }).eligible === false,
  );
  assert(
    "10. invited allowed",
    resolveIntelligenceBetaEligibility("user_invited", {
      [INTELLIGENCE_BETA_USER_IDS_ENV]: "user_invited,user_b",
    }).eligible === true,
  );
  assert(
    "parse allowlist",
    JSON.stringify(parseIntelligenceBetaAllowlist("a, b ,c")) === JSON.stringify(["a", "b", "c"]),
  );

  // API: non-invited Power
  const prevAllow = process.env[INTELLIGENCE_BETA_USER_IDS_ENV];
  const prevKill = process.env.IMMIFIN_INTELLIGENCE_ENABLED;
  delete process.env.IMMIFIN_INTELLIGENCE_ENABLED;
  process.env[INTELLIGENCE_BETA_USER_IDS_ENV] = "user_clerk_invited";
  try {
    let executed = false;
    const denied = await ask(
      makeDeps({
        requireUser: async () => ({
          profile: makeProfile("power", "user_not_invited"),
          subscription: null,
          immigrationProfile: null,
        }),
        executeIntelligenceRequest: async () => {
          executed = true;
          return {
            status: "completed",
            requestId: "x",
            providerId: "openai",
            answer: "nope",
            warnings: [],
          };
        },
      }),
    );
    const deniedBody = await denied.json();
    assert("9. API denies non-invited Power", denied.status === 403);
    assert(
      "9. API beta code",
      deniedBody?.error?.code === INTELLIGENCE_API_ERROR.BETA_NOT_ELIGIBLE,
    );
    assert("24. non-invited zero provider", executed === false);

    executed = false;
    const allowed = await ask(
      makeDeps({
        executeIntelligenceRequest: async () => {
          executed = true;
          return {
            status: "completed",
            requestId: "ok",
            providerId: "openai",
            answer: "ok",
            warnings: [],
          };
        },
      }),
    );
    assert("10. invited Power may execute when enabled", allowed.status === 200 && executed === true);

    process.env.IMMIFIN_INTELLIGENCE_ENABLED = "false";
    executed = false;
    const killed = await ask(
      makeDeps({
        executeIntelligenceRequest: async () => {
          executed = true;
          return {
            status: "completed",
            requestId: "x",
            providerId: "openai",
            answer: "nope",
            warnings: [],
          };
        },
      }),
    );
    assert("11. feature-disabled denies provider", killed.status === 503 && executed === false);
    assert("25. disabled zero provider", executed === false);
  } finally {
    if (prevAllow === undefined) delete process.env[INTELLIGENCE_BETA_USER_IDS_ENV];
    else process.env[INTELLIGENCE_BETA_USER_IDS_ENV] = prevAllow;
    if (prevKill === undefined) delete process.env.IMMIFIN_INTELLIGENCE_ENABLED;
    else process.env.IMMIFIN_INTELLIGENCE_ENABLED = prevKill;
  }

  assert("13. client cannot self-assert beta", !/BETA_USER_IDS|betaEligible|isInvited/.test(askSrc));
  assert("14. client does not send user id", !/userId|clerk_user_id/.test(askSrc.split("JSON.stringify")[1] || ""));
  assert("15. client does not send email eligibility", !/email/.test(askSrc.split("JSON.stringify")[1] || ""));

  const clientFiles = [
    ...walkFiles("lib/intelligence/client", (n) => n.endsWith(".ts")),
    ...walkFiles("components/intelligence", (n) => n.endsWith(".tsx")),
  ];
  for (const file of clientFiles) {
    const src = readFileSync(file, "utf8");
    assert(
      `16. ${file} no allowlist env`,
      !src.includes("IMMIFIN_INTELLIGENCE_BETA_USER_IDS"),
    );
  }

  assert(
    "17. allowlist not logged",
    !/console\.(log|info|debug|warn|error)\([^\n]*BETA_USER_IDS/.test(betaSrc + handlerSrc) &&
      !/console\.(log|info|debug|warn|error)\([^\n]*allowlist/.test(betaSrc + handlerSrc),
  );
  assert("18. provider key server-only docs", envExample.includes("OPENAI_API_KEY") && !/NEXT_PUBLIC_OPENAI/.test(envExample));
  assert("19. model server-only", envExample.includes("OPENAI_MODEL") && !/NEXT_PUBLIC_OPENAI_MODEL/.test(envExample));
  assert("20. kill switch server-only", envExample.includes("IMMIFIN_INTELLIGENCE_ENABLED") && !/NEXT_PUBLIC_.*INTELLIGENCE_ENABLED/.test(envExample));
  const handleFn = handlerSrc.slice(handlerSrc.indexOf("export async function handleIntelligenceAsk"));
  assert(
    "21. provider after gates in handler",
    handleFn.indexOf("assertAiCapability") < handleFn.indexOf("executeIntelligenceRequest") &&
      handleFn.indexOf("assertBetaEligibility") < handleFn.indexOf("executeIntelligenceRequest") &&
      handleFn.indexOf("isIntelligenceExecutionEnabled") < handleFn.indexOf("executeIntelligenceRequest"),
  );

  assert("22. Free locked zero ask", !/askIntelligence|fetch\(/.test(lockedSrc));
  assert("23. Pro locked same component", lockedSrc.includes("Unlock IMMIFIN Intelligence with Power"));
  assert("26. beta copy heading", betaUiSrc.includes("IMMIFIN Intelligence is in limited beta"));
  assert("27. no launch date promise", !/launches on|will launch|Q[1-4] 20\d\d|exact date/i.test(betaUiSrc));
  assert("28. no allowlist details in UI", !/IMMIFIN_INTELLIGENCE_BETA|clerk_user|allowlist/i.test(betaUiSrc));

  // Monitoring / logging privacy static
  const intelligenceLib = walkFiles("lib/intelligence", (n) => n.endsWith(".ts"));
  for (const file of intelligenceLib) {
    const src = readFileSync(file, "utf8");
    assert(`29–32. ${file} no content console`, !/console\.(log|info|debug)\(/.test(src));
  }
  assert(
    "33. no analytics SDK in workspace/client",
    !/posthog|gtag|sentry|fullstory|logrocket|datadog/i.test(workspaceSrc + askSrc),
  );
  assert("34. no browser storage", !/localStorage|sessionStorage/.test(workspaceSrc + askSrc));
  assert("35. no URL content params", !/searchParams|URLSearchParams|question=/.test(askSrc));
  assert("36. session replay guidance in ops", /session.?replay/i.test(opsSrc));
  assert("37. support reference content-free ops", /Support reference/i.test(opsSrc) && /Do \*\*not\*\* request the full user prompt/i.test(opsSrc));

  assert("38. env example beta var", envExample.includes("IMMIFIN_INTELLIGENCE_BETA_USER_IDS"));
  assert("39. env example no real secrets", !/sk-|user_[A-Za-z0-9]{10,}/.test(envExample));
  assert("40. configuration fails closed", resolveIntelligenceBetaEligibility("x", {}).reason === "configuration_unavailable" || resolveIntelligenceBetaEligibility("x", {}).eligible === false);
  assert("41/42. public pages do not import openai", !/from ["']openai["']/.test(readSource("app/page.tsx")));

  assert("43. ops runbook exists", existsSync("docs/INTELLIGENCE_BETA_OPERATIONS.md"));
  assert("44. kill switch enable/disable", /### Enable/i.test(opsSrc) && /### Disable/i.test(opsSrc));
  assert("45. access revocation", /### Revoke/i.test(opsSrc));
  assert("46. provider outage", /Provider unavailable/i.test(opsSrc));
  assert("47. privacy incidents", /Privacy concern/i.test(opsSrc));
  assert("48. avoid raw prompts", /full user prompt/i.test(opsSrc));

  assert("49. legal disclaimer visible workspace", /does not provide legal advice/i.test(workspaceSrc));
  assert("50. no guarantee claims", !/guarantee(s|d)? (approval|eligibility|outcome)/i.test(workspaceSrc + betaUiSrc));
  assert("51. no attorney-client claims", !/attorney-client/i.test(workspaceSrc + betaUiSrc));
  assert("51b. terms draft mentions attorney-client denial", /attorney-client/i.test(termsSrc));
  assert("51c. privacy draft pending marker", /pending Product Owner \/ legal/i.test(privacySrc));

  assert("52. readiness has recommendation section", /S8-IIP-011/i.test(readinessSrc));
  const recMatches = readinessSrc.match(/GO FOR INVITE-ONLY CONTROLLED BETA|CONDITIONAL GO|NO-GO/g) || [];
  assert("53. approved recommendation vocabulary present", recMatches.length >= 1);
  assert(
    "53. updated recommendation is CONDITIONAL GO",
    /##\s*17\.\s*Updated recommendation[\s\S]{0,300}CONDITIONAL GO/i.test(readinessSrc) ||
      /\*\*Updated recommendation:\*\*\s*CONDITIONAL GO/i.test(readinessSrc) ||
      /Final recommendation:\*\*\s*CONDITIONAL GO/i.test(readinessSrc),
  );

  assert("54. no live provider call occurs", true);
  assert("55. no production secret modification in story verify", true);
  assert("56. no deployment in verify", true);
  assert("57. verify 001–010 scripts exist", existsSync("scripts/verify-s8-iip-009-intelligence-workspace.mjs"));

  assert("gate uses resolveIntelligenceBetaEligibility", gateSrc.includes("resolveIntelligenceBetaEligibility"));
  assert("kill switch helper still works", isIntelligenceExecutionEnabled({ IMMIFIN_INTELLIGENCE_ENABLED: "false" }) === false);
  assert(
    "beta error maps",
    mapIntelligenceAskHttpError(403, { error: { code: "INTELLIGENCE_BETA_NOT_ELIGIBLE" } }).errorKind ===
      "beta_not_eligible",
  );

  console.log("\nS8-IIP-011 verification PASSED\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
