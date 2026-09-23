import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOfficialWageRequestBody, fetchOfficialWage } from "@/lib/h1b/wage/client/officialWageLookupClient";

describe("officialWageLookupClient", () => {
  it("builds soc_code + zip only and never includes area_code", () => {
    const body = buildOfficialWageRequestBody({ socCode: "15-1252", zip: "77433" });
    assert.deepEqual(body, { soc_code: "15-1252", zip: "77433" });
    assert.equal("area_code" in body, false);
    assert.equal("geo_level" in body, false);
    assert.equal("wage_year" in body, false);
    assert.equal("dataset_id" in body, false);
    assert.equal("county_fips" in body, false);
  });

  it("includes county_fips only when provided", () => {
    const body = buildOfficialWageRequestBody({
      socCode: "15-1252",
      zip: "76945",
      countyFips: "48081",
    });
    assert.deepEqual(body, { soc_code: "15-1252", zip: "76945", county_fips: "48081" });
    assert.equal("area_code" in body, false);
  });

  it("omits empty county_fips", () => {
    const body = buildOfficialWageRequestBody({
      socCode: "15-1252",
      zip: "00501",
      countyFips: null,
    });
    assert.deepEqual(body, { soc_code: "15-1252", zip: "00501" });
    assert.equal(typeof body.zip, "string");
  });

  it("maps HTTP 429 to kind throttled", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
        status: 429,
        headers: { "Retry-After": "30", "Content-Type": "application/json" },
      });
    try {
      const result = await fetchOfficialWage({ socCode: "15-1252", zip: "77433" });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.kind, "throttled");
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
