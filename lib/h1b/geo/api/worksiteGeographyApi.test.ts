import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleWorksiteGeographyRequest } from "@/lib/h1b/geo/api/handleWorksiteGeographyRequest";
import { toWorksiteGeographyResponse } from "@/lib/h1b/geo/api/toWorksiteGeographyResponse";
import { validateWorksiteGeographyRequest } from "@/lib/h1b/geo/api/worksiteGeographyApi.validation";
import type { GeographyResolution } from "@/lib/h1b/geo/geographyResolution.types";
import { GEOGRAPHY_REASON } from "@/lib/h1b/geo/geographyResolution.types";
import type { ResolveGeographyInput } from "@/lib/h1b/geo/geographyResolution.types";

function resolution(overrides: Partial<GeographyResolution> = {}): GeographyResolution {
  return {
    outcome: "AUTO",
    reasonCode: GEOGRAPHY_REASON.AUTO_SINGLE_AREA,
    zipRaw: "77433",
    zipNormalized: "77433",
    selectedCountyFips: null,
    officialCountyCount: 1,
    mappedCountyCount: 1,
    unmappedCountyCount: 0,
    distinctAreaCount: 1,
    mappedCounties: [
      {
        countyFips: "48201",
        countyDisplayName: "Harris County",
        stateAb: "TX",
        stateDisplayName: "Texas",
        areaCode: "26420",
        areaName: "Houston-Pasadena-The Woodlands, TX",
      },
    ],
    unmappedOfficialCounties: [],
    resolvedArea: {
      areaCode: "26420",
      areaName: "Houston-Pasadena-The Woodlands, TX",
    },
    choiceOptions: [],
    provenance: {
      contractId: "GEO-RESOLUTION-DESIGN-002",
      productDecisionId: "GEO-RESOLUTION-DECISION-001",
      resolutionPolicy: "SCENARIO_A_ALL_OFFICIAL_HUD_ROWS",
      hudCrosswalkVersionId: "hud-secret-id",
      hudYear: 2026,
      hudQuarter: 2,
      hudPackageSha256: "a".repeat(64),
      oflcDatasetId: "oflc-secret-id",
      oflcWageYear: "2026-27",
      oflcPackageSha256: "b".repeat(64),
      compatibilityPolicy: null,
      zipNormalized: "77433",
    },
    ...overrides,
  };
}

function jsonRequest(body: unknown, init?: RequestInit): Request {
  return new Request("http://localhost:3000/api/h1b/worksite-geography", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...init,
  });
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("validateWorksiteGeographyRequest", () => {
  it("CASE 3: ZIP remains a string", () => {
    const accepted = validateWorksiteGeographyRequest({ zip: "77433" });
    assert.equal(typeof accepted.zip, "string");
    assert.equal(accepted.zip, "77433");
    assert.equal(accepted.countyFips, undefined);
  });

  it("CASE 4: county_fips remains a string", () => {
    const accepted = validateWorksiteGeographyRequest({ zip: "76945", county_fips: "48451" });
    assert.equal(typeof accepted.countyFips, "string");
    assert.equal(accepted.countyFips, "48451");
  });

  it("CASE 5: area_code is not accepted as authority", () => {
    assert.throws(
      () => validateWorksiteGeographyRequest({ zip: "77433", area_code: "26420" }),
      { message: "Request contains unsupported fields." },
    );
  });

  it("CASE 6: client HUD version is not accepted", () => {
    assert.throws(
      () => validateWorksiteGeographyRequest({ zip: "77433", hud_version_id: "hud-1" }),
      { message: "Request contains unsupported fields." },
    );
  });

  it("CASE 7: client OFLC dataset ID is not accepted", () => {
    assert.throws(
      () => validateWorksiteGeographyRequest({ zip: "77433", oflc_dataset_id: "oflc-1" }),
      { message: "Request contains unsupported fields." },
    );
  });

  it("CASE 9: missing ZIP is rejected", () => {
    assert.throws(
      () => validateWorksiteGeographyRequest({ county_fips: "48451" }),
      { message: "zip is required." },
    );
  });

  it("CASE 10: numeric ZIP is rejected at the request boundary", () => {
    assert.throws(
      () => validateWorksiteGeographyRequest({ zip: 77433 }),
      { message: "zip must be a string." },
    );
  });

  it("CASE 20: unknown authority fields are rejected", () => {
    const unknowns = [
      { zip: "77433", bus_ratio: 1 },
      { zip: "77433", geo_lvl: "1" },
      { zip: "77433", hud_year: 2026 },
      { zip: "77433", oflc_wage_year: "2026-27" },
    ];
    for (const body of unknowns) {
      assert.throws(
        () => validateWorksiteGeographyRequest(body),
        { message: "Request contains unsupported fields." },
      );
    }
  });
});

describe("handleWorksiteGeographyRequest", () => {
  it("CASE 1: valid ZIP-only request reaches the resolver", async () => {
    const calls: ResolveGeographyInput[] = [];
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "77433" }),
      async (input) => {
        calls.push(input);
        return resolution();
      },
    );
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { zip: "77433", countyFips: undefined });
    assert.equal("areaCode" in calls[0], false);
  });

  it("CASE 2: valid ZIP + county_fips reaches the resolver", async () => {
    const calls: ResolveGeographyInput[] = [];
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "76945", county_fips: "48451" }),
      async (input) => {
        calls.push(input);
        return resolution({
          zipRaw: "76945",
          zipNormalized: "76945",
          selectedCountyFips: "48451",
          officialCountyCount: 2,
          mappedCountyCount: 2,
          distinctAreaCount: 2,
          resolvedArea: { areaCode: "41660", areaName: "San Angelo, TX" },
        });
      },
    );
    assert.equal(response.status, 200);
    assert.deepEqual(calls[0], { zip: "76945", countyFips: "48451" });
    const body = await readJson(response);
    assert.equal(body.selected_county_fips, "48451");
  });

  it("CASE 8: malformed request body is handled safely", async () => {
    const response = await handleWorksiteGeographyRequest(
      jsonRequest("{not-json"),
      async () => {
        throw new Error("resolver must not run");
      },
    );
    assert.equal(response.status, 400);
    const body = await readJson(response);
    assert.equal(body.error, "Request body must be valid JSON.");
    assert.equal("stack" in body, false);
  });

  it("CASE 11: AUTO response shape", async () => {
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "77433" }),
      async () => resolution(),
    );
    const body = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(body.outcome, "AUTO");
    assert.equal(body.reason_code, GEOGRAPHY_REASON.AUTO_SINGLE_AREA);
    assert.equal(body.normalized_zip, "77433");
    assert.deepEqual(body.resolved_area, {
      area_name: "Houston-Pasadena-The Woodlands, TX",
    });
    assert.equal(body.selected_county_fips, null);
    assert.equal(JSON.stringify(body).includes("area_code"), false);
    assert.equal("official_county_count" in body, false);
    assert.equal("mapped_county_count" in body, false);
    assert.equal("unmapped_county_count" in body, false);
    assert.equal("distinct_area_count" in body, false);
    assert.equal("mapped_counties" in body, false);
    assert.equal("unmapped_official_counties" in body, false);
  });

  it("CASE 12: CHOICE_REQUIRED response shape", async () => {
    const choice = resolution({
      outcome: "CHOICE_REQUIRED",
      reasonCode: GEOGRAPHY_REASON.CHOICE_MULTIPLE_AREAS,
      zipRaw: "76945",
      zipNormalized: "76945",
      officialCountyCount: 2,
      mappedCountyCount: 2,
      distinctAreaCount: 2,
      resolvedArea: null,
      mappedCounties: [
        {
          countyFips: "48081",
          countyDisplayName: "Coke County",
          stateAb: "TX",
          stateDisplayName: "Texas",
          areaCode: "4800004",
          areaName: "Hill Country Region of Texas nonmetropolitan area",
        },
        {
          countyFips: "48451",
          countyDisplayName: "Tom Green County",
          stateAb: "TX",
          stateDisplayName: "Texas",
          areaCode: "41660",
          areaName: "San Angelo, TX",
        },
      ],
      choiceOptions: [
        {
          countyFips: "48081",
          countyDisplayName: "Coke County",
          stateAb: "TX",
          stateDisplayName: "Texas",
          areaCode: "4800004",
          areaName: "Hill Country Region of Texas nonmetropolitan area",
        },
        {
          countyFips: "48451",
          countyDisplayName: "Tom Green County",
          stateAb: "TX",
          stateDisplayName: "Texas",
          areaCode: "41660",
          areaName: "San Angelo, TX",
        },
      ],
    });
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "76945" }),
      async () => choice,
    );
    const body = await readJson(response);
    assert.equal(body.outcome, "CHOICE_REQUIRED");
    assert.equal(body.reason_code, GEOGRAPHY_REASON.CHOICE_MULTIPLE_AREAS);
    assert.equal(body.resolved_area, null);
    assert.equal(Array.isArray(body.choice_options), true);
    const options = body.choice_options as Array<Record<string, unknown>>;
    assert.equal(options.length, 2);
    assert.equal(options[0]?.county_fips, "48081");
    assert.equal(options[0]?.county_display_name, "Coke County");
    assert.equal(options[0]?.state_display_name, "Texas");
    assert.equal(options[0]?.area_name, "Hill Country Region of Texas nonmetropolitan area");
    assert.equal(options[1]?.county_fips, "48451");
    assert.equal(options[1]?.county_display_name, "Tom Green County");
    assert.equal(options[1]?.state_display_name, "Texas");
    assert.equal(options[1]?.area_name, "San Angelo, TX");
    assert.equal(JSON.stringify(body).includes("area_code"), false);
    assert.equal("official_county_count" in body, false);
    assert.equal("mapped_counties" in body, false);
    assert.equal("unmapped_official_counties" in body, false);
  });

  it("CASE 13: UNAVAILABLE response shape", async () => {
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "00801" }),
      async () =>
        resolution({
          outcome: "UNAVAILABLE",
          reasonCode: GEOGRAPHY_REASON.UNAVAILABLE_TERRITORY_UNJOINED,
          zipRaw: "00801",
          zipNormalized: "00801",
          officialCountyCount: 1,
          mappedCountyCount: 0,
          unmappedCountyCount: 1,
          distinctAreaCount: 0,
          resolvedArea: null,
          mappedCounties: [],
          unmappedOfficialCounties: [
            { countyFips: "78030", hudPrefState: "VI", unmappedClass: "territory_unjoined" },
          ],
        }),
    );
    const body = await readJson(response);
    assert.equal(response.status, 200);
    assert.equal(body.outcome, "UNAVAILABLE");
    assert.equal(body.reason_code, GEOGRAPHY_REASON.UNAVAILABLE_TERRITORY_UNJOINED);
    assert.equal(body.resolved_area, null);
    assert.equal(JSON.stringify(body).includes("area_code"), false);
    assert.equal(JSON.stringify(body).includes("unmapped_class"), false);
    assert.equal("official_county_count" in body, false);
    assert.equal("mapped_county_count" in body, false);
    assert.equal("unmapped_county_count" in body, false);
    assert.equal("distinct_area_count" in body, false);
    assert.equal("mapped_counties" in body, false);
    assert.equal("unmapped_official_counties" in body, false);
  });

  it("CASE 14: INVALID_ZIP is a domain 200, not an uncontrolled 500", async () => {
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "501" }),
      async () =>
        resolution({
          outcome: "UNAVAILABLE",
          reasonCode: GEOGRAPHY_REASON.INVALID_ZIP,
          zipRaw: "501",
          zipNormalized: "",
          officialCountyCount: 0,
          mappedCountyCount: 0,
          resolvedArea: null,
          mappedCounties: [],
        }),
    );
    assert.equal(response.status, 200);
    const body = await readJson(response);
    assert.equal(body.reason_code, GEOGRAPHY_REASON.INVALID_ZIP);
  });

  it("CASE 15: INVALID_COUNTY_FOR_ZIP is a domain 200, not an uncontrolled 500", async () => {
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "76945", county_fips: "48201" }),
      async () =>
        resolution({
          outcome: "UNAVAILABLE",
          reasonCode: GEOGRAPHY_REASON.INVALID_COUNTY_FOR_ZIP,
          zipRaw: "76945",
          zipNormalized: "76945",
          resolvedArea: null,
        }),
    );
    assert.equal(response.status, 200);
    const body = await readJson(response);
    assert.equal(body.reason_code, GEOGRAPHY_REASON.INVALID_COUNTY_FOR_ZIP);
  });

  it("CASE 16: dataset INACTIVE is handled safely", async () => {
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "77433" }),
      async () =>
        resolution({
          outcome: "UNAVAILABLE",
          reasonCode: GEOGRAPHY_REASON.UNAVAILABLE_DATASET_INACTIVE,
          resolvedArea: null,
          mappedCounties: [],
        }),
    );
    assert.equal(response.status, 200);
    const body = await readJson(response);
    assert.equal(body.reason_code, GEOGRAPHY_REASON.UNAVAILABLE_DATASET_INACTIVE);
  });

  it("CASE 17: dataset INCOMPATIBLE is handled safely", async () => {
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "77433" }),
      async () =>
        resolution({
          outcome: "UNAVAILABLE",
          reasonCode: GEOGRAPHY_REASON.UNAVAILABLE_DATASET_INCOMPATIBLE,
          resolvedArea: null,
          mappedCounties: [],
        }),
    );
    assert.equal(response.status, 200);
    const body = await readJson(response);
    assert.equal(body.reason_code, GEOGRAPHY_REASON.UNAVAILABLE_DATASET_INCOMPATIBLE);
  });

  it("CASE 18: no internal database credentials or dataset IDs are exposed", async () => {
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "77433" }),
      async () => resolution(),
    );
    const text = await response.text();
    assert.equal(text.includes("hud-secret-id"), false);
    assert.equal(text.includes("oflc-secret-id"), false);
    assert.equal(text.includes("a".repeat(64)), false);
    assert.equal(text.includes("supabase"), false);
    assert.equal(text.includes("service_role"), false);
    const body = JSON.parse(text) as Record<string, unknown>;
    assert.equal("provenance" in body, false);
    assert.equal("hudCrosswalkVersionId" in body, false);
    assert.equal("oflcDatasetId" in body, false);
  });

  it("CASE 19: API does not perform geographic logic independently", async () => {
    const calls: ResolveGeographyInput[] = [];
    await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "00501-1234", county_fips: "36103" }),
      async (input) => {
        calls.push(input);
        return resolution({
          zipRaw: "00501-1234",
          zipNormalized: "resolver-owns-this",
          outcome: "UNAVAILABLE",
          reasonCode: GEOGRAPHY_REASON.UNAVAILABLE_NO_HUD_ZIP,
          resolvedArea: null,
        });
      },
    );
    assert.deepEqual(calls[0], { zip: "00501-1234", countyFips: "36103" });
    const mapped = toWorksiteGeographyResponse(
      resolution({
        outcome: "UNAVAILABLE",
        reasonCode: GEOGRAPHY_REASON.UNAVAILABLE_NO_HUD_ZIP,
        zipNormalized: "resolver-owns-this",
        resolvedArea: { areaCode: "should-not-invent", areaName: "no" },
      }),
    );
    assert.equal(mapped.normalized_zip, "resolver-owns-this");
    assert.equal(mapped.reason_code, GEOGRAPHY_REASON.UNAVAILABLE_NO_HUD_ZIP);
  });

  it("does not forward area_code even when a client tries to smuggle it", async () => {
    const calls: ResolveGeographyInput[] = [];
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "77433", area_code: "99999" }),
      async (input) => {
        calls.push(input);
        return resolution();
      },
    );
    assert.equal(response.status, 400);
    assert.equal(calls.length, 0);
  });

  it("returns a controlled 500 without leaking resolver internals", async () => {
    const response = await handleWorksiteGeographyRequest(
      jsonRequest({ zip: "77433" }),
      async () => {
        throw new Error("Failed to load official HUD ZIP counties: password=secret postgres://x");
      },
    );
    assert.equal(response.status, 500);
    const body = await readJson(response);
    assert.equal(body.error, "Unable to resolve worksite geography.");
    assert.equal(JSON.stringify(body).includes("password"), false);
    assert.equal(JSON.stringify(body).includes("postgres"), false);
  });
});
