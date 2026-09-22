import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWorksiteGeographyRequestBody,
  formatCountyChoicePrimaryLabel,
  formatWageAreaContext,
  userFacingGeographyMessage,
  WORKSITE_GEOGRAPHY_INVALID_ZIP_COPY,
  WORKSITE_GEOGRAPHY_UNAVAILABLE_COPY,
} from "@/lib/h1b/geo/client/worksiteGeographyClient";

describe("worksiteGeographyClient", () => {
  it("builds a ZIP-only request without area_code", () => {
    const body = buildWorksiteGeographyRequestBody({ zip: "00501" });
    assert.deepEqual(body, { zip: "00501" });
    assert.equal(typeof body.zip, "string");
    assert.equal("area_code" in body, false);
    assert.equal("county_fips" in body, false);
  });

  it("builds a ZIP + county_fips request without area_code", () => {
    const body = buildWorksiteGeographyRequestBody({ zip: "76945", countyFips: "48451" });
    assert.deepEqual(body, { zip: "76945", county_fips: "48451" });
    assert.equal(typeof body.county_fips, "string");
    assert.equal("area_code" in body, false);
  });

  it("composes County Name + State from backend display fields", () => {
    assert.equal(
      formatCountyChoicePrimaryLabel({
        county_display_name: "Coke County",
        state_display_name: "Texas",
      }),
      "Coke County, Texas",
    );
  });

  it("does not abbreviate Texas to TX", () => {
    const label = formatCountyChoicePrimaryLabel({
      county_display_name: "Tom Green County",
      state_display_name: "Texas",
    });
    assert.equal(label.includes("TX"), false);
    assert.equal(label, "Tom Green County, Texas");
  });

  it("formats wage-area context from backend area_name", () => {
    assert.equal(
      formatWageAreaContext("Hill Country Region of Texas nonmetropolitan area"),
      "Wage area: Hill Country Region of Texas nonmetropolitan area",
    );
  });

  it("uses distinct copy for INVALID_ZIP vs other UNAVAILABLE reasons", () => {
    assert.equal(userFacingGeographyMessage("INVALID_ZIP"), WORKSITE_GEOGRAPHY_INVALID_ZIP_COPY);
    assert.equal(
      userFacingGeographyMessage("UNAVAILABLE_TERRITORY_UNJOINED"),
      WORKSITE_GEOGRAPHY_UNAVAILABLE_COPY,
    );
  });
});
