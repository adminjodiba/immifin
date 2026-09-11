/**
 * S8-IIP-009 — Power-Plan Intelligence Workspace UI Foundation verification.
 * Run: npx tsx scripts/verify-s8-iip-009-intelligence-workspace.mjs
 *
 * Deterministic source + unit checks — no live OpenAI / Clerk session.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  INTELLIGENCE_ASK_CLIENT_PROVIDER_ID,
  INTELLIGENCE_ASK_ENDPOINT,
  INTELLIGENCE_SUGGESTED_QUESTIONS,
  formatIntelligenceBlockingReason,
  mapIntelligenceAskHttpError,
} from "../lib/intelligence/client/index.ts";
import { CAPABILITY, canAccessAI, hasCapability } from "../lib/subscription/capabilities.ts";
import {
  getMyImmifinPremiumPreview,
  getVisibleMyImmifinMenuItems,
} from "../lib/my-immifin-menu.ts";
import { INTELLIGENCE_QUESTION_MAX_LENGTH } from "../lib/intelligence/request/intelligence-request.constants.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

function assertNoForbiddenClientImports(relPath) {
  const src = readSource(relPath);
  assert(
    `${relPath} does not import server service`,
    !/intelligence\/service\/server|createOpenAIProvider|from\s+["']openai["']/.test(src),
  );
  assert(
    `${relPath} does not import Supabase server`,
    !/from\s+["']@\/lib\/supabase\/server["']/.test(src),
  );
  assert(
    `${relPath} does not import Stripe`,
    !/from\s+["']@\/lib\/stripe/.test(src) && !/from\s+["']stripe["']/.test(src),
  );
  assert(`${relPath} has no console content logging`, !/console\.(log|info|debug|warn|error)/.test(src));
  assert(
    `${relPath} has no persistence APIs`,
    !/localStorage|sessionStorage|\.insert\(|createClient\(/.test(src),
  );
}

async function main() {
  assert("1. workspace route present", existsSync("app/intelligence/page.tsx"));
  assert("1. api route still present", existsSync("app/api/intelligence/ask/route.ts"));
  assert("components/intelligence present", existsSync("components/intelligence/IntelligenceWorkspace.tsx"));
  assert("access gate present", existsSync("components/intelligence/IntelligenceAccessGate.tsx"));
  assert("locked state present", existsSync("components/intelligence/IntelligenceLockedState.tsx"));
  assert("client hook present", existsSync("lib/intelligence/client/use-intelligence-ask.ts"));

  const pageSrc = readSource("app/intelligence/page.tsx");
  assert("page uses ContactOnboardingGuard", pageSrc.includes("ContactOnboardingGuard"));
  assert("page uses IntelligenceAccessGate", pageSrc.includes("IntelligenceAccessGate"));
  assert("page uses IntelligenceWorkspace", pageSrc.includes("IntelligenceWorkspace"));

  assert("2/5. Free accessAI false", hasCapability("free", CAPABILITY.ai) === false);
  assert("3/4. Pro accessAI false", hasCapability("pro", CAPABILITY.ai) === false);
  assert("5. Power accessAI true", canAccessAI("power") === true);

  const menuFree = getVisibleMyImmifinMenuItems("free");
  const intelligenceItem = menuFree.find((item) => item.id === "intelligence");
  assert("nav Intelligence item present", Boolean(intelligenceItem));
  assert("nav href /intelligence", intelligenceItem?.href === "/intelligence");
  assert(
    "Free nav preview locks Intelligence",
    getMyImmifinPremiumPreview(intelligenceItem, "free") === "intelligence",
  );
  assert(
    "Pro nav preview locks Intelligence",
    getMyImmifinPremiumPreview(intelligenceItem, "pro") === "intelligence",
  );
  assert(
    "Power nav preview unlocked",
    getMyImmifinPremiumPreview(intelligenceItem, "power") === null,
  );

  const workspaceSrc = readSource("components/intelligence/IntelligenceWorkspace.tsx");
  assert("6. posts via ask hook / endpoint", workspaceSrc.includes("useIntelligenceAsk"));
  assert("no provider selector UI", !/providerId|select.*model|OpenAI|GPT/i.test(workspaceSrc));
  assert("no streaming UI", !/EventSource|text\/event-stream|streamResponse/.test(workspaceSrc));
  assert(
    "no conversation history UI",
    !/messages\.map|chatThread|conversationHistory|messageList/i.test(workspaceSrc),
  );
  assert("suggested questions render", workspaceSrc.includes("INTELLIGENCE_SUGGESTED_QUESTIONS"));
  assert("suggestion click does not auto-submit", workspaceSrc.includes("applySuggestion"));
  assert(
    "privacy copy present",
    /not save(?:d as a)? chat history|does not save chat history/i.test(workspaceSrc),
  );
  assert("disclaimer present", workspaceSrc.includes("does not determine eligibility"));
  assert("profile CTA to user-profile", workspaceSrc.includes('href="/user-profile"'));
  assert("character limit bound", workspaceSrc.includes("INTELLIGENCE_QUESTION_MAX_LENGTH"));
  assert("no dangerouslySetInnerHTML", !/dangerouslySetInnerHTML/.test(workspaceSrc));
  assert("plain-text answer rendering", workspaceSrc.includes("whitespace-pre-wrap"));
  assert("aria-live status", workspaceSrc.includes('aria-live="polite"'));
  assert("loading copy present", workspaceSrc.includes("preparing your response"));

  assert("suggested questions count", INTELLIGENCE_SUGGESTED_QUESTIONS.length >= 3);
  assert(
    "suggested questions are static educational",
    INTELLIGENCE_SUGGESTED_QUESTIONS.every((q) => typeof q === "string" && q.length > 10),
  );
  assert(
    "no unsafe suggested promises",
    !INTELLIGENCE_SUGGESTED_QUESTIONS.some((q) =>
      /eligible|guarantee|predict|best legal|quit my job|USCIS will/i.test(q),
    ),
  );

  const askSrc = readSource("lib/intelligence/client/ask-intelligence.ts");
  assert("client uses ask endpoint", askSrc.includes("INTELLIGENCE_ASK_ENDPOINT"));
  assert(
    "provider hardcoded via client constant",
    askSrc.includes("INTELLIGENCE_ASK_CLIENT_PROVIDER_ID") &&
      INTELLIGENCE_ASK_CLIENT_PROVIDER_ID === "openai" &&
      INTELLIGENCE_ASK_ENDPOINT === "/api/intelligence/ask",
  );
  assert("no model override field", !/"model"\s*:/.test(askSrc));
  assert("no plan in body", !/"plan"\s*:/.test(askSrc));
  assert("no userId in body", !/"userId"\s*:/.test(askSrc));

  const hookSrc = readSource("lib/intelligence/client/use-intelligence-ask.ts");
  assert("AbortController used", hookSrc.includes("AbortController"));
  assert("sequence stale protection", hookSrc.includes("sequenceRef"));
  assert("no retry loop", !/for\s*\(.*retry|while\s*\(.*retry/.test(hookSrc));
  assert("no setInterval polling", !/\bsetInterval\b/.test(hookSrc));

  const authErr = mapIntelligenceAskHttpError(401, {
    ok: false,
    error: { code: "INTELLIGENCE_API_UNAUTHENTICATED", message: "x" },
  });
  assert("auth error maps", authErr.errorKind === "unauthenticated");

  const capErr = mapIntelligenceAskHttpError(403, {
    ok: false,
    error: { code: "AI_CAPABILITY_REQUIRED", message: "AI features require Power." },
  });
  assert("capability error maps", capErr.errorKind === "capability_required");
  assert("capability message safe", !capErr.message.includes("stripe"));

  const rateErr = mapIntelligenceAskHttpError(429, {
    ok: false,
    error: { code: "INTELLIGENCE_ABUSE_LIMIT_EXCEEDED", message: "x" },
  });
  assert("rate-limit maps", rateErr.errorKind === "rate_limited");

  const timeoutErr = mapIntelligenceAskHttpError(504, {
    ok: false,
    error: { code: "INTELLIGENCE_PROVIDER_TIMEOUT", message: "x" },
  });
  assert("timeout maps", timeoutErr.errorKind === "timeout");

  const configErr = mapIntelligenceAskHttpError(503, {
    ok: false,
    error: { code: "INTELLIGENCE_PROVIDER_NOT_CONFIGURED", message: "x" },
  });
  assert("config maps", configErr.errorKind === "not_configured");
  assert("config hides env names", !/OPENAI_API_KEY/.test(configErr.message));

  assert(
    "blocking reason label friendly",
    formatIntelligenceBlockingReason("priorityDate") === "Priority date",
  );

  assert("question max remains 2000", INTELLIGENCE_QUESTION_MAX_LENGTH === 2000);

  const lockedSrc = readSource("components/intelligence/IntelligenceLockedState.tsx");
  assert("locked state Power messaging", lockedSrc.includes("Power"));
  assert("locked links pricing", lockedSrc.includes("/pricing"));
  assert("no unlimited claim", !/unlimited/i.test(lockedSrc));
  assert("no free trial claim", !/free trial/i.test(lockedSrc));
  assert("no OpenAI branding", !/OpenAI|GPT/i.test(lockedSrc));

  for (const file of [
    "components/intelligence/IntelligenceWorkspace.tsx",
    "components/intelligence/IntelligenceAccessGate.tsx",
    "lib/intelligence/client/ask-intelligence.ts",
    "lib/intelligence/client/use-intelligence-ask.ts",
  ]) {
    assertNoForbiddenClientImports(file);
  }

  assert("no app/ai route", !existsSync("app/ai"));
  assert(
    "intelligence app folder is page-only foundation",
    readdirSync("app/intelligence").every((name) => name === "page.tsx"),
  );

  const gateSrc = readSource("components/intelligence/IntelligenceAccessGate.tsx");
  assert("gate uses canAccessAI", gateSrc.includes("canAccessAI"));

  console.log("\nS8-IIP-009 Intelligence Workspace verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
