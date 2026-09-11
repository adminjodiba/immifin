/**
 * S8-IIP-004 — AI Provider Interface verification.
 * Run: npx tsx scripts/verify-s8-iip-004-provider-interface.mjs
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  isIntelligenceProviderError,
} from "../lib/intelligence/providers/index.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readProvidersDir() {
  const dir = resolve("lib/intelligence/providers");
  return readdirSync(dir).filter((f) => f.endsWith(".ts"));
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

function makeImmigration() {
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

async function main() {
  const files = readProvidersDir();
  const allowedProviderFiles = [
    "provider.interface.ts",
    "provider.types.ts",
    "provider.errors.ts",
    "provider.capabilities.ts",
    "provider-registry.ts",
    "provider-registry.types.ts",
    "provider-resolver.ts",
    "server.ts",
    "index.ts",
  ];
  assert(
    "1. expected provider contract files present",
    [
      "provider.interface.ts",
      "provider.types.ts",
      "provider.errors.ts",
      "provider.capabilities.ts",
      "index.ts",
    ].every((f) => files.includes(f)),
  );
  assert(
    "1. no unexpected provider modules",
    files.every((f) => allowedProviderFiles.includes(f)),
  );

  assert(
    "2. interface version constant",
    INTELLIGENCE_PROVIDER_INTERFACE_VERSION === "1.0.0",
  );
  assert(
    "2. text_generation capability exported",
    INTELLIGENCE_PROVIDER_CAPABILITY.TEXT_GENERATION === "text_generation",
  );
  assert(
    "2. reserved provider ids include openai/anthropic/gemini/azure/internal",
    INTELLIGENCE_PROVIDER_IDS.OPENAI === "openai" &&
      INTELLIGENCE_PROVIDER_IDS.ANTHROPIC === "anthropic" &&
      INTELLIGENCE_PROVIDER_IDS.GEMINI === "gemini" &&
      INTELLIGENCE_PROVIDER_IDS.AZURE_OPENAI === "azure_openai" &&
      INTELLIGENCE_PROVIDER_IDS.INTERNAL === "internal",
  );

  const payload = readyPayload();
  assert("3. prompt payload available for provider request", Boolean(payload.requestId));

  /** @type {import("../lib/intelligence/providers/index.ts").IntelligenceProvider} */
  const stubProvider = {
    id: INTELLIGENCE_PROVIDER_IDS.INTERNAL,
    name: "Verify Stub (not a production adapter)",
    capabilities: [INTELLIGENCE_PROVIDER_CAPABILITY.TEXT_GENERATION],
    async generate(request) {
      return {
        responseVersion: INTELLIGENCE_PROVIDER_INTERFACE_VERSION,
        providerId: this.id,
        providerName: this.name,
        requestId: request.payload.requestId,
        createdAt: "2026-07-25T12:00:03.000Z",
        output: { text: "stub" },
      };
    },
  };

  const response = await stubProvider.generate({ payload });
  assert("3. provider interface accepts Prompt Payload", response.requestId === payload.requestId);
  assert("3. response carries interface version", response.responseVersion === "1.0.0");
  assert("3. response has structured text output", response.output.text === "stub");
  assert(
    "3. response has no vendor message arrays",
    !("messages" in response) && !("openai" in response) && !("anthropic" in response),
  );

  const err = new IntelligenceProviderError(
    INTELLIGENCE_PROVIDER_ERROR.NOT_CONFIGURED,
    "adapter not configured",
  );
  assert("4. structured error class", err instanceof Error && err.code === "INTELLIGENCE_PROVIDER_NOT_CONFIGURED");
  assert("4. isIntelligenceProviderError type guard", isIntelligenceProviderError(err));
  assert("4. non-error rejected by type guard", !isIntelligenceProviderError(new Error("x")));

  const bannedImportPatterns = [
    /from\s+["']openai/,
    /from\s+["']@anthropic-ai/,
    /from\s+["']@google\/generative/,
    /from\s+["']ai["']/,
    /from\s+["']@\/lib\/auth/,
    /from\s+["']@\/lib\/clerk/,
    /from\s+["']@\/lib\/stripe/,
    /from\s+["']@\/lib\/supabase/,
    /from\s+["']@clerk/,
    /requireUser/,
    /getStoredSubscriptionTier/,
  ];

  for (const file of files) {
    const src = readSource(`lib/intelligence/providers/${file}`);
    assert(`5. ${file} has no console logging`, !/\bconsole\.(log|info|warn|error|debug)\b/.test(src));
    assert(`5. ${file} has no fetch/http client`, !/\bfetch\b|\baxios\b|\bhttp\.request\b/.test(src));
    // Top-level contract modules must stay vendor-SDK-free; adapter code lives under openai/.
    for (const pattern of bannedImportPatterns) {
      assert(`5. ${file} avoids ${pattern}`, !pattern.test(src));
    }
    assert(
      `5. ${file} is not a concrete OpenAI/Anthropic/Gemini adapter class`,
      !/class\s+(OpenAI|Anthropic|Gemini|AzureOpenAI)\w*/.test(src),
    );
  }

  const packageJson = readSource("package.json");
  // S8-IIP-006 may add the official `openai` SDK. Other AI SDKs remain forbidden here.
  assert("6. package.json has no anthropic dependency", !/"@anthropic-ai\//.test(packageJson));
  assert("6. package.json has no gemini dependency", !/"@google\/generative-ai"\s*:/.test(packageJson));
  assert("6. package.json has no langchain dependency", !/"langchain"\s*:/.test(packageJson));

  const interfaceSrc = readSource("lib/intelligence/providers/provider.interface.ts");
  assert(
    "7. interface declares generate method",
    /generate\s*\(/.test(interfaceSrc) && /IntelligenceProviderGenerateRequest/.test(interfaceSrc),
  );
  const typesSrc = readSource("lib/intelligence/providers/provider.types.ts");
  assert(
    "7. generate request uses IntelligencePromptPayload",
    /payload:\s*IntelligencePromptPayload/.test(typesSrc),
  );
  assert(
    "7. types import prompt payload types",
    /from\s+["']@\/lib\/intelligence\/prompt\//.test(typesSrc),
  );

  // S8-IIP-009 may add /intelligence workspace — dedicated /ai chat app route remains forbidden.
  assert("8. no dedicated /ai chat app route", !existsSync("app/ai"));

  console.log("\nS8-IIP-004 Intelligence Provider Interface verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
