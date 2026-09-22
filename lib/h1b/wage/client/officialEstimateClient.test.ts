import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOfficialEstimateRequestBody } from "@/lib/h1b/wage/client/officialEstimateClient";

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
});
