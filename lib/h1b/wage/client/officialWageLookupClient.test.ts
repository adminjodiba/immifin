import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOfficialWageRequestBody } from "@/lib/h1b/wage/client/officialWageLookupClient";

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
});
