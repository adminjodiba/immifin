import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { toAbuseCheckRequest } from "@/lib/abuse/stores/abuseStore";

function read(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("abuse platform boundaries", () => {
  it("does not integrate the limiter into middleware", () => {
    const text = read("middleware.ts");
    assert.equal(text.includes("checkAbuseGate"), false);
    assert.equal(text.includes("enforceAbuseGate"), false);
    assert.equal(text.includes("lib/abuse"), false);
  });

  it("does not rate-limit HTML calculator pages", () => {
    const page = read("app/immigration/h1b-wage-level-estimator/page.tsx");
    assert.equal(page.includes("checkAbuseGate"), false);
    assert.equal(page.includes("enforceAbuseGate"), false);
    const lottery = read("app/immigration/h1b-lottery-odds-calculator/page.tsx");
    assert.equal(lottery.includes("checkAbuseGate"), false);
  });

  it("never sends calculator payload, raw IP, or Clerk id to the Durable Object", () => {
    const payload = toAbuseCheckRequest({
      identityKey: "v1:anon:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      policyId: "class-3",
      windows: [{ id: "short", windowSeconds: 60, limit: 20 }],
    });
    const keys = Object.keys(payload);
    assert.deepEqual(keys.sort(), ["identityKey", "policyId", "windows"]);
    const text = JSON.stringify(payload);
    assert.equal(text.includes("77433"), false);
    assert.equal(text.includes("15-1252"), false);
    assert.equal(text.includes("185000"), false);
    assert.equal(text.includes("Master"), false);
    assert.equal(text.includes("4-6"), false);
    assert.equal(text.includes("203.0.113"), false);
    assert.equal(text.includes("user_"), false);
    assert.equal(text.includes("CF-Connecting-IP"), false);
  });

  it("wires only the four H-1B public APIs", () => {
    const files = [
      "lib/h1b/occupations/handleOfficialOccupationSearchRequest.ts",
      "lib/h1b/geo/api/handleWorksiteGeographyRequest.ts",
      "lib/h1b/wage/handleOfficialWageLookupRequest.ts",
      "lib/h1b/wage/estimator/handleOfficialEstimateRequest.ts",
    ];
    for (const file of files) {
      assert.equal(read(file).includes("enforceAbuseGate"), true, file);
    }

    const untouched = [
      "app/api/check-priority-date/route.ts",
      "app/api/visa-stamping-wait-times/route.ts",
      "app/api/intelligence/ask/route.ts",
      "app/api/contact/route.ts",
    ];
    for (const file of untouched) {
      assert.equal(read(file).includes("enforceAbuseGate"), false, file);
    }
  });
});
