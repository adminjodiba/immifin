/**
 * S8-IIP-005 — Provider Registry and Resolver Foundation verification.
 * Run: npx tsx scripts/verify-s8-iip-005-provider-registry.mjs
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  INTELLIGENCE_PROVIDER_CAPABILITY,
  INTELLIGENCE_PROVIDER_ERROR,
  INTELLIGENCE_PROVIDER_INTERFACE_VERSION,
  IntelligenceProviderError,
  createIntelligenceProviderRegistry,
  isIntelligenceProviderError,
  resolveIntelligenceProvider,
} from "../lib/intelligence/providers/index.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

/** Verification-only fake — not a production adapter; not exported from lib. */
function createTestProvider(overrides = {}) {
  let generateCalls = 0;
  const provider = {
    id: "test-provider",
    name: "Test Provider Fixture",
    capabilities: [INTELLIGENCE_PROVIDER_CAPABILITY.TEXT_GENERATION],
    async generate(request) {
      generateCalls += 1;
      return {
        responseVersion: INTELLIGENCE_PROVIDER_INTERFACE_VERSION,
        providerId: this.id,
        providerName: this.name,
        requestId: request.payload.requestId,
        createdAt: "2026-07-25T12:00:00.000Z",
        output: { text: "fixture" },
      };
    },
    ...overrides,
  };
  return {
    provider,
    getGenerateCalls: () => generateCalls,
  };
}

async function main() {
  const registry = createIntelligenceProviderRegistry();
  assert("1. registry can be created", Boolean(registry));
  assert("2. registry starts empty", registry.size() === 0);
  assert("2. empty list", registry.list().length === 0);

  const { provider: fake, getGenerateCalls } = createTestProvider();
  assert("6. has() false before registration", registry.has("test-provider") === false);

  registry.register(fake);
  assert("3. valid fake provider can be registered", registry.size() === 1);
  assert("7. has() true after registration", registry.has("test-provider") === true);
  assert("13. registration does not call provider.generate", getGenerateCalls() === 0);

  const resolved = registry.resolve("test-provider");
  assert("4. registered provider can be resolved by ID", resolved.id === "test-provider");
  assert("5. resolved provider is the exact registered implementation", resolved === fake);

  let duplicateError = null;
  try {
    registry.register({
      ...fake,
      name: "Replacement Attempt",
    });
  } catch (error) {
    duplicateError = error;
  }
  assert("8. duplicate registration is rejected", isIntelligenceProviderError(duplicateError));
  assert(
    "8. duplicate uses DUPLICATE_REGISTRATION code",
    duplicateError?.code === INTELLIGENCE_PROVIDER_ERROR.DUPLICATE_REGISTRATION,
  );
  assert(
    "9. duplicate registration does not replace original",
    registry.resolve("test-provider") === fake &&
      registry.resolve("test-provider").name === "Test Provider Fixture",
  );

  let notFoundError = null;
  try {
    registry.resolve("missing-provider");
  } catch (error) {
    notFoundError = error;
  }
  assert("10. unknown provider throws structured error", isIntelligenceProviderError(notFoundError));
  assert(
    "10. unknown uses NOT_FOUND code",
    notFoundError?.code === INTELLIGENCE_PROVIDER_ERROR.NOT_FOUND,
  );

  const second = createTestProvider({
    id: "alpha-provider",
    name: "Alpha Fixture",
  }).provider;
  registry.register(second);
  const listed = registry.list();
  assert("11. listing contains only safe metadata keys", listed.every((item) => {
    const keys = Object.keys(item).sort();
    return (
      keys.length === 3 &&
      keys[0] === "capabilities" &&
      keys[1] === "id" &&
      keys[2] === "name" &&
      !("generate" in item)
    );
  }));
  assert(
    "12. listing ordering is deterministic by provider id",
    listed.map((item) => item.id).join(",") === "alpha-provider,test-provider",
  );

  const viaResolver = resolveIntelligenceProvider({
    registry,
    providerId: "test-provider",
  });
  assert("14. resolver delegates to registry", viaResolver === fake);

  let resolverMissing = null;
  try {
    resolveIntelligenceProvider({
      registry,
      providerId: "still-missing",
    });
  } catch (error) {
    resolverMissing = error;
  }
  assert(
    "15. resolver does not add fallback behavior",
    isIntelligenceProviderError(resolverMissing) &&
      resolverMissing.code === INTELLIGENCE_PROVIDER_ERROR.NOT_FOUND,
  );

  let inferredDefault = null;
  try {
    resolveIntelligenceProvider({
      registry,
      providerId: "openai",
    });
  } catch (error) {
    inferredDefault = error;
  }
  assert(
    "16. no default provider is inferred for unknown id",
    inferredDefault?.code === INTELLIGENCE_PROVIDER_ERROR.NOT_FOUND,
  );

  const packageJson = readSource("package.json");
  // Official `openai` SDK may be present (S8-IIP-006). Registry modules themselves must not import it.
  assert("17. no anthropic SDK dependency", !/"@anthropic-ai\//.test(packageJson));
  assert("17. no gemini SDK dependency", !/"@google\/generative-ai"\s*:/.test(packageJson));
  assert("17. no langchain SDK dependency", !/"langchain"\s*:/.test(packageJson));
  for (const file of [
    "provider-registry.ts",
    "provider-resolver.ts",
    "provider-registry.types.ts",
  ]) {
    const src = readSource(`lib/intelligence/providers/${file}`);
    assert(`17. ${file} does not import openai SDK`, !/from\s+["']openai["']/.test(src));
  }

  for (const file of [
    "provider-registry.ts",
    "provider-resolver.ts",
    "provider-registry.types.ts",
    "server.ts",
  ]) {
    const src = readSource(`lib/intelligence/providers/${file}`);
    assert(`18. ${file} does not read process.env`, !/\bprocess\.env\b/.test(src));
    assert(`19. ${file} has no network clients`, !/\bfetch\b|\baxios\b|\bhttp\.request\b/.test(src));
    assert(
      `20. ${file} has no database / supabase access`,
      !/from\s+["']@\/lib\/supabase|from\s+["']@supabase/.test(src),
    );
    assert(`21. ${file} has no console logging`, !/\bconsole\.(log|info|warn|error|debug)\b/.test(src));
    assert(
      `26. ${file} has no routing / env-provider selection logic`,
      !/\brouteProvider\b|\bselectProvider\b|\bAI_PROVIDER\b|\bprocess\.env\b/.test(src),
    );
  }

  const serverSrc = readSource("lib/intelligence/providers/server.ts");
  assert('22. server entry imports "server-only"', serverSrc.includes('import "server-only"'));

  const interfaceSrc = readSource("lib/intelligence/providers/provider.interface.ts");
  assert(
    "23. provider interface still declares generate()",
    /generate\s*\(/.test(interfaceSrc),
  );
  assert(
    "23. registry does not redefine IntelligenceProvider interface",
    !/export\s+interface\s+IntelligenceProvider\b/.test(
      readSource("lib/intelligence/providers/provider-registry.ts"),
    ),
  );

  // S8-IIP-009 may add /intelligence workspace — dedicated /ai chat app route remains forbidden.
  assert("20. no dedicated /ai chat app route", !existsSync("app/ai"));
  assert(
    "25. no provider API route folder",
    !readdirSync("app/api").some((name) => name.includes("provider")),
  );

  let invalidReg = null;
  try {
    registry.register(null);
  } catch (error) {
    invalidReg = error;
  }
  assert(
    "invalid registration uses INVALID_REGISTRATION",
    invalidReg instanceof IntelligenceProviderError &&
      invalidReg.code === INTELLIGENCE_PROVIDER_ERROR.INVALID_REGISTRATION,
  );

  const fresh = createIntelligenceProviderRegistry();
  assert("test isolation via fresh instance", fresh.size() === 0 && registry.size() === 2);

  console.log("\nS8-IIP-005 Intelligence Provider Registry verification passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
