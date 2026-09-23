import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOfficialEstimateRequestBody,
  fetchOfficialEstimate,
  officialEstimateFailureCopy,
  OFFICIAL_ESTIMATE_THROTTLED_COPY,
  OFFICIAL_ESTIMATE_UNAVAILABLE_COPY,
} from "@/lib/h1b/wage/client/officialEstimateClient";

describe("officialEstimateClient", () => {
  it("builds only user-input fields and never sends area_code or calculated outputs", () => {
    const body = buildOfficialEstimateRequestBody({
      socCode: "15-1252",
      zip: "77433",
      countyFips: "48157",
      annualSalary: 185000,
      experience: "4-6",
      education: "Master",
    });
    assert.deepEqual(body, {
      soc_code: "15-1252",
      zip: "77433",
      county_fips: "48157",
      annual_salary: 185000,
      experience: "4-6",
      education: "Master",
    });
    assert.equal("area_code" in body, false);
    assert.equal("estimatedLevel" in body, false);
    assert.equal("confidence" in body, false);
    assert.equal("wage" in body, false);
  });

  it("maps HTTP 429 to kind throttled instead of unavailable", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
        status: 429,
        headers: { "Retry-After": "120", "Content-Type": "application/json" },
      });
    try {
      const result = await fetchOfficialEstimate({
        socCode: "15-1252",
        zip: "77433",
        annualSalary: 185000,
        experience: "4-6",
        education: "Master",
      });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.kind, "throttled");
        assert.equal(result.status, 429);
        assert.equal(officialEstimateFailureCopy(result.kind), OFFICIAL_ESTIMATE_THROTTLED_COPY);
        assert.notEqual(officialEstimateFailureCopy(result.kind), OFFICIAL_ESTIMATE_UNAVAILABLE_COPY);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
