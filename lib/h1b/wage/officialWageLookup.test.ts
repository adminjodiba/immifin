import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleOfficialWageLookupRequest } from "@/lib/h1b/wage/handleOfficialWageLookupRequest";
import { lookupOfficialWage } from "@/lib/h1b/wage/lookupOfficialWage";
import { validateOfficialWageLookupRequest } from "@/lib/h1b/wage/officialWageLookup.validation";
import { WAGE_LOOKUP_REASON } from "@/lib/h1b/wage/officialWageLookup.types";
import type { OfficialWageLookupStore } from "@/lib/h1b/wage/officialWageLookup.types";
import type { GeographyResolution } from "@/lib/h1b/geo/geographyResolution.types";
import { GEOGRAPHY_REASON } from "@/lib/h1b/geo/geographyResolution.types";
import type { ResolveGeographyInput } from "@/lib/h1b/geo/geographyResolution.types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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
    mappedCounties: [],
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

function store(overrides: Partial<OfficialWageLookupStore> = {}): OfficialWageLookupStore {
  return {
    async loadActiveAllIndustriesDatasets() {
      return [
        {
          id: "runtime-selected-id",
          wageYear: "2026-27",
          dataSource: "All Industries",
          blsSurvey: "BLS May 2025 OEWS",
          socVersion: "2018 SOC",
          effectiveStart: "2026-07-01",
          effectiveEnd: "2027-06-30",
        },
      ];
    },
    async loadOccupation(_datasetId, socCode) {
      if (socCode === "15-1252") {
        return { socCode: "15-1252", title: "Software Developers" };
      }
      return null;
    },
    async loadArea(_datasetId, areaCode) {
      if (areaCode === "26420") {
        return { areaCode: "26420", areaName: "Houston-Pasadena-The Woodlands, TX" };
      }
      return null;
    },
    async loadWageRecord(_datasetId, areaCode, socCode) {
      if (areaCode === "26420" && socCode === "15-1252") {
        return {
          socCode: "15-1252",
          geoLevel: 1,
          label: null,
          level1: 42.2,
          level2: 53.05,
          level3: 63.89,
          level4: 74.74,
          average: 64.01,
        };
      }
      return null;
    },
    ...overrides,
  };
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/h1b/official-wage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("validateOfficialWageLookupRequest", () => {
  it("accepts soc_code, zip, and optional county_fips as strings", () => {
    const accepted = validateOfficialWageLookupRequest({
      soc_code: "15-1252",
      zip: "00501",
      county_fips: "48081",
    });
    assert.equal(accepted.socCode, "15-1252");
    assert.equal(accepted.zip, "00501");
    assert.equal(accepted.countyFips, "48081");
    assert.equal(typeof accepted.zip, "string");
  });

  it("rejects area_code as authority", () => {
    assert.throws(
      () =>
        validateOfficialWageLookupRequest({
          soc_code: "15-1252",
          zip: "77433",
          area_code: "26420",
        }),
      { message: "Request contains unsupported fields." },
    );
  });

  it("rejects unknown fields", () => {
    assert.throws(
      () =>
        validateOfficialWageLookupRequest({
          soc_code: "15-1252",
          zip: "77433",
          geo_lvl: 1,
        }),
      { message: "Request contains unsupported fields." },
    );
  });

  it("rejects malformed SOC", () => {
    assert.throws(
      () => validateOfficialWageLookupRequest({ soc_code: "151252", zip: "77433" }),
      { message: "soc_code must be a 2018 SOC code (##-####)." },
    );
  });

  it("rejects numeric ZIP", () => {
    assert.throws(
      () => validateOfficialWageLookupRequest({ soc_code: "15-1252", zip: 77433 }),
      { message: "zip must be a string." },
    );
  });
});

describe("lookupOfficialWage", () => {
  it("returns CHOICE_REQUIRED with wage null and does not query wages", async () => {
    let wageCalls = 0;
    const result = await lookupOfficialWage(
      { socCode: "15-1252", zip: "76945" },
      {
        resolveWorksiteGeography: async () =>
          resolution({
            outcome: "CHOICE_REQUIRED",
            reasonCode: GEOGRAPHY_REASON.CHOICE_MULTIPLE_AREAS,
            zipRaw: "76945",
            zipNormalized: "76945",
            resolvedArea: null,
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
          }),
        store: store({
          async loadWageRecord() {
            wageCalls += 1;
            return null;
          },
        }),
      },
    );
    assert.equal(result.outcome, "CHOICE_REQUIRED");
    assert.equal(result.reason_code, GEOGRAPHY_REASON.CHOICE_MULTIPLE_AREAS);
    assert.equal(result.wage, null);
    assert.equal(result.source, null);
    assert.equal(result.choice_options.length, 2);
    assert.equal(result.choice_options[0]?.county_fips, "48081");
    assert.equal(wageCalls, 0);
  });

  it("returns geography UNAVAILABLE with wage null", async () => {
    const result = await lookupOfficialWage(
      { socCode: "15-1252", zip: "00801" },
      {
        resolveWorksiteGeography: async () =>
          resolution({
            outcome: "UNAVAILABLE",
            reasonCode: GEOGRAPHY_REASON.UNAVAILABLE_TERRITORY_UNJOINED,
            zipNormalized: "00801",
            resolvedArea: null,
          }),
        store: store(),
      },
    );
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reason_code, GEOGRAPHY_REASON.UNAVAILABLE_TERRITORY_UNJOINED);
    assert.equal(result.wage, null);
  });

  it("looks up official wages only after AUTO geography using backend area", async () => {
    const keys: Array<{ datasetId: string; areaCode: string; socCode: string }> = [];
    const result = await lookupOfficialWage(
      { socCode: "15-1252", zip: "77433" },
      {
        resolveWorksiteGeography: async () => resolution(),
        store: store({
          async loadWageRecord(datasetId, areaCode, socCode) {
            keys.push({ datasetId, areaCode, socCode });
            return {
              socCode,
              geoLevel: 1,
              label: null,
              level1: 42.2,
              level2: 53.05,
              level3: 63.89,
              level4: 74.74,
              average: 64.01,
            };
          },
        }),
      },
    );
    assert.equal(result.outcome, "AUTO");
    assert.equal(result.reason_code, WAGE_LOOKUP_REASON.AUTO_OFFICIAL_WAGE);
    assert.deepEqual(keys, [{ datasetId: "runtime-selected-id", areaCode: "26420", socCode: "15-1252" }]);
    assert.equal(result.wage?.level1, 42.2);
    assert.equal(result.wage?.geo_level, 1);
    assert.equal(result.geography.resolved_area?.area_code, "26420");
    assert.equal(result.source?.data_source, "All Industries");
    assert.equal("id" in (result.source ?? {}), false);
  });

  it("returns UNAVAILABLE_UNKNOWN_SOC without inventing a wage", async () => {
    const result = await lookupOfficialWage(
      { socCode: "99-9999", zip: "77433" },
      {
        resolveWorksiteGeography: async () => resolution(),
        store: store(),
      },
    );
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reason_code, WAGE_LOOKUP_REASON.UNAVAILABLE_UNKNOWN_SOC);
    assert.equal(result.wage, null);
  });

  it("returns UNAVAILABLE_UNKNOWN_AREA when the resolved area is missing", async () => {
    const result = await lookupOfficialWage(
      { socCode: "15-1252", zip: "77433" },
      {
        resolveWorksiteGeography: async () =>
          resolution({
            resolvedArea: { areaCode: "99999", areaName: "Missing" },
          }),
        store: store(),
      },
    );
    assert.equal(result.reason_code, WAGE_LOOKUP_REASON.UNAVAILABLE_UNKNOWN_AREA);
    assert.equal(result.wage, null);
  });

  it("returns UNAVAILABLE_NO_WAGE_RECORD when occupation exists but no wage row", async () => {
    const result = await lookupOfficialWage(
      { socCode: "15-1252", zip: "77433" },
      {
        resolveWorksiteGeography: async () => resolution(),
        store: store({
          async loadWageRecord() {
            return null;
          },
        }),
      },
    );
    assert.equal(result.reason_code, WAGE_LOOKUP_REASON.UNAVAILABLE_NO_WAGE_RECORD);
    assert.equal(result.wage, null);
  });

  it("returns UNAVAILABLE_DATASET_INACTIVE when no single ACTIVE All Industries dataset exists", async () => {
    const none = await lookupOfficialWage(
      { socCode: "15-1252", zip: "77433" },
      {
        resolveWorksiteGeography: async () => resolution(),
        store: store({
          async loadActiveAllIndustriesDatasets() {
            return [];
          },
        }),
      },
    );
    assert.equal(none.reason_code, WAGE_LOOKUP_REASON.UNAVAILABLE_DATASET_INACTIVE);
    assert.equal(none.wage, null);
  });

  it("preserves official High Wage and No Leveled Wage nulls and Annual Wage values", async () => {
    const high = await lookupOfficialWage(
      { socCode: "29-1022", zip: "77433" },
      {
        resolveWorksiteGeography: async () => resolution(),
        store: store({
          async loadOccupation() {
            return { socCode: "29-1022", title: "Oral and Maxillofacial Surgeons" };
          },
          async loadWageRecord() {
            return {
              socCode: "29-1022",
              geoLevel: 4,
              label: "High Wage",
              level1: null,
              level2: null,
              level3: null,
              level4: null,
              average: 166.58,
            };
          },
        }),
      },
    );
    assert.equal(high.wage?.label, "High Wage");
    assert.equal(high.wage?.level1, null);
    assert.equal(high.wage?.average, 166.58);

    const annual = await lookupOfficialWage(
      { socCode: "11-9032", zip: "77433" },
      {
        resolveWorksiteGeography: async () => resolution(),
        store: store({
          async loadOccupation() {
            return { socCode: "11-9032", title: "Education Administrators, Kindergarten through Secondary" };
          },
          async loadWageRecord() {
            return {
              socCode: "11-9032",
              geoLevel: 1,
              label: "Annual Wage",
              level1: 77830,
              level2: 89513,
              level3: 101197,
              level4: 112880,
              average: 101310,
            };
          },
        }),
      },
    );
    assert.equal(annual.wage?.label, "Annual Wage");
    assert.equal(annual.wage?.level1, 77830);
    assert.equal(annual.wage?.level1 === 77830 * 2080, false);

    const none = await lookupOfficialWage(
      { socCode: "11-1031", zip: "77433" },
      {
        resolveWorksiteGeography: async () => resolution(),
        store: store({
          async loadOccupation() {
            return { socCode: "11-1031", title: "Legislators" };
          },
          async loadWageRecord() {
            return {
              socCode: "11-1031",
              geoLevel: 4,
              label: "No Leveled Wage",
              level1: null,
              level2: null,
              level3: null,
              level4: null,
              average: null,
            };
          },
        }),
      },
    );
    assert.equal(none.wage?.label, "No Leveled Wage");
    assert.equal(none.wage?.average, null);
    assert.equal(none.wage?.level4, null);
  });
});

describe("handleOfficialWageLookupRequest", () => {
  it("forwards only zip and optional county_fips to the geography resolver", async () => {
    const calls: ResolveGeographyInput[] = [];
    const response = await handleOfficialWageLookupRequest(
      jsonRequest({ soc_code: "15-1252", zip: "76945", county_fips: "48081" }),
      async (input) => {
        calls.push(input);
        return resolution({
          zipNormalized: "76945",
          selectedCountyFips: "48081",
          resolvedArea: {
            areaCode: "4800004",
            areaName: "Hill Country Region of Texas nonmetropolitan area",
          },
        });
      },
      store({
        async loadArea() {
          return {
            areaCode: "4800004",
            areaName: "Hill Country Region of Texas nonmetropolitan area",
          };
        },
        async loadWageRecord() {
          return {
            socCode: "15-1252",
            geoLevel: 1,
            label: null,
            level1: 39.36,
            level2: 50.07,
            level3: 60.79,
            level4: 71.5,
            average: 60.89,
          };
        },
      }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(calls[0], { zip: "76945", countyFips: "48081" });
    assert.equal("areaCode" in calls[0], false);
  });

  it("rejects area_code before the resolver runs", async () => {
    let resolverCalls = 0;
    const response = await handleOfficialWageLookupRequest(
      jsonRequest({ soc_code: "15-1252", zip: "77433", area_code: "26420" }),
      async () => {
        resolverCalls += 1;
        return resolution();
      },
      store(),
    );
    assert.equal(response.status, 400);
    assert.equal(resolverCalls, 0);
  });

  it("returns a controlled 500 without leaking internals", async () => {
    const response = await handleOfficialWageLookupRequest(
      jsonRequest({ soc_code: "15-1252", zip: "77433" }),
      async () => {
        throw new Error("Failed to load official wages: password=secret postgres://x");
      },
      store(),
    );
    assert.equal(response.status, 500);
    const body = await readJson(response);
    assert.equal(body.error, "Unable to look up official wages.");
    assert.equal(JSON.stringify(body).includes("password"), false);
    assert.equal(JSON.stringify(body).includes("postgres"), false);
  });

  it("does not expose dataset UUID, package hash, or provenance", async () => {
    const response = await handleOfficialWageLookupRequest(
      jsonRequest({ soc_code: "15-1252", zip: "77433" }),
      async () => resolution(),
      store(),
    );
    const text = await response.text();
    assert.equal(text.includes("runtime-selected-id"), false);
    assert.equal(text.includes("oflc-secret-id"), false);
    assert.equal(text.includes("a".repeat(64)), false);
    assert.equal(text.includes("provenance"), false);
    const body = JSON.parse(text) as { source: Record<string, unknown> };
    assert.deepEqual(Object.keys(body.source), [
      "wage_year",
      "data_source",
      "bls_survey",
      "soc_version",
      "effective_start",
      "effective_end",
    ]);
  });

  it("public HTTP response omits area_code and geo_level while keeping official amounts", async () => {
    const response = await handleOfficialWageLookupRequest(
      jsonRequest({ soc_code: "15-1252", zip: "77433" }),
      async () => resolution(),
      store(),
    );
    assert.equal(response.status, 200);
    const body = await readJson(response);
    const text = JSON.stringify(body);
    assert.equal(text.includes("area_code"), false);
    assert.equal(text.includes("geo_level"), false);
    const wage = body.wage as Record<string, unknown>;
    const geography = body.geography as Record<string, unknown>;
    const resolved = geography.resolved_area as Record<string, unknown>;
    assert.equal(resolved.area_name, "Houston-Pasadena-The Woodlands, TX");
    assert.equal("area_code" in resolved, false);
    assert.equal(wage.soc_code, "15-1252");
    assert.equal(wage.occupation_title, "Software Developers");
    assert.equal(wage.level1, 42.2);
    assert.equal(wage.level2, 53.05);
    assert.equal(wage.level3, 63.89);
    assert.equal(wage.level4, 74.74);
    assert.equal(wage.average, 64.01);
    assert.equal("geo_level" in wage, false);
    const source = body.source as Record<string, unknown>;
    assert.equal(source.wage_year, "2026-27");
    assert.equal(source.data_source, "All Industries");
    assert.equal(source.bls_survey, "BLS May 2025 OEWS");
    assert.equal(source.soc_version, "2018 SOC");
    assert.equal(source.effective_start, "2026-07-01");
    assert.equal(source.effective_end, "2027-06-30");
  });

  it("public CHOICE_REQUIRED response omits area_code from choice options", async () => {
    const response = await handleOfficialWageLookupRequest(
      jsonRequest({ soc_code: "15-1252", zip: "76945" }),
      async () =>
        resolution({
          outcome: "CHOICE_REQUIRED",
          reasonCode: GEOGRAPHY_REASON.CHOICE_MULTIPLE_AREAS,
          zipRaw: "76945",
          zipNormalized: "76945",
          resolvedArea: null,
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
        }),
      store(),
    );
    const body = await readJson(response);
    assert.equal(body.outcome, "CHOICE_REQUIRED");
    assert.equal(JSON.stringify(body).includes("area_code"), false);
    const options = body.choice_options as Array<Record<string, unknown>>;
    assert.equal(options[0]?.county_fips, "48081");
    assert.equal(options[0]?.county_display_name, "Coke County");
    assert.equal(options[0]?.state_display_name, "Texas");
    assert.equal(options[0]?.area_name, "Hill Country Region of Texas nonmetropolitan area");
    assert.equal("area_code" in options[0]!, false);
  });
});

describe("official wage implementation boundary", () => {
  it("does not implement hourly × 2080 annualization", () => {
    const files = [
      "lib/h1b/wage/lookupOfficialWage.ts",
      "lib/h1b/wage/officialWageStore.ts",
      "lib/h1b/wage/toOfficialWageResponse.ts",
      "lib/h1b/wage/handleOfficialWageLookupRequest.ts",
      "lib/h1b/wage/officialWageLookup.types.ts",
      "app/api/h1b/official-wage/route.ts",
    ];
    for (const file of files) {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      assert.equal(text.includes("2080"), false, file);
    }
  });
});
