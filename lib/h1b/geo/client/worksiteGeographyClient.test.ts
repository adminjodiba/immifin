import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWorksiteGeographyRequestBody,
  formatCountyChoicePrimaryLabel,
  formatWageAreaContext,
  parseWorksiteGeographyResponse,
  fetchWorksiteGeography,
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

  it("parses AUTO area_name without requiring area_code", () => {
    const parsed = parseWorksiteGeographyResponse({
      outcome: "AUTO",
      reason_code: "AUTO_SINGLE_AREA",
      normalized_zip: "77433",
      selected_county_fips: "48201",
      resolved_area: { area_name: "Houston-Pasadena-The Woodlands, TX" },
      choice_options: [],
    });
    assert.equal(parsed?.outcome, "AUTO");
    assert.equal(parsed?.resolved_area?.area_name, "Houston-Pasadena-The Woodlands, TX");
    assert.equal(parsed ? "area_code" in (parsed.resolved_area ?? {}) : true, false);
    assert.equal(formatWageAreaContext(parsed?.resolved_area?.area_name ?? ""), "Wage area: Houston-Pasadena-The Woodlands, TX");
  });

  it("parses CHOICE_REQUIRED county labels without area_code", () => {
    const parsed = parseWorksiteGeographyResponse({
      outcome: "CHOICE_REQUIRED",
      reason_code: "CHOICE_MULTIPLE_AREAS",
      normalized_zip: "76945",
      selected_county_fips: null,
      resolved_area: null,
      choice_options: [
        {
          county_fips: "48081",
          county_display_name: "Coke County",
          state_display_name: "Texas",
          area_name: "Hill Country Region of Texas nonmetropolitan area",
        },
        {
          county_fips: "48451",
          county_display_name: "Tom Green County",
          state_display_name: "Texas",
          area_name: "San Angelo, TX",
        },
      ],
    });
    assert.equal(parsed?.choice_options.length, 2);
    assert.equal(
      formatCountyChoicePrimaryLabel(parsed!.choice_options[0]!),
      "Coke County, Texas",
    );
    assert.equal(
      formatWageAreaContext(parsed!.choice_options[0]!.area_name),
      "Wage area: Hill Country Region of Texas nonmetropolitan area",
    );
    assert.equal("area_code" in parsed!.choice_options[0]!, false);
  });

  it("maps HTTP 429 to kind throttled", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
        status: 429,
        headers: { "Retry-After": "30", "Content-Type": "application/json" },
      });
    try {
      const result = await fetchWorksiteGeography({ zip: "77433" });
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.kind, "throttled");
        assert.equal(result.status, 429);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
