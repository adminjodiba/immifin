import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createEmptyOfficialOccupationDisplayEnricher } from "@/lib/h1b/occupations/officialOccupationDisplayEnrichment";
import type { GeographyResolution } from "@/lib/h1b/geo/geographyResolution.types";
import { GEOGRAPHY_REASON } from "@/lib/h1b/geo/geographyResolution.types";
import { handleOfficialEstimateRequest } from "@/lib/h1b/wage/estimator/handleOfficialEstimateRequest";
import { validateOfficialEstimateRequest } from "@/lib/h1b/wage/estimator/officialEstimate.validation";
import type { OfficialWageLookupStore } from "@/lib/h1b/wage/officialWageLookup.types";

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
  return new Request("http://localhost:3000/api/h1b/official-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const VALID_BODY = {
  soc_code: "15-1252",
  zip: "77433",
  annual_salary: 185000,
  experience: "4-6",
  education: "Master",
};

describe("validateOfficialEstimateRequest", () => {
  it("accepts only user/product inputs", () => {
    const accepted = validateOfficialEstimateRequest({
      ...VALID_BODY,
      county_fips: "48157",
    });
    assert.equal(accepted.socCode, "15-1252");
    assert.equal(accepted.zip, "77433");
    assert.equal(accepted.countyFips, "48157");
    assert.equal(accepted.annualSalary, 185000);
    assert.equal(accepted.experience, "4-6");
    assert.equal(accepted.education, "Master");
  });

  it("rejects client-calculated outputs and area_code", () => {
    const rejected = [
      { ...VALID_BODY, area_code: "26420" },
      { ...VALID_BODY, estimatedLevel: "I" },
      { ...VALID_BODY, confidence: "High" },
      { ...VALID_BODY, confidenceScore: 9 },
      { ...VALID_BODY, reasoning: ["x"] },
      { ...VALID_BODY, salaryPosition: "Above" },
      { ...VALID_BODY, wage: { level1: 1 } },
    ];
    for (const body of rejected) {
      assert.throws(() => validateOfficialEstimateRequest(body), {
        message: "Request contains unsupported fields.",
      });
    }
  });
});

describe("handleOfficialEstimateRequest", () => {
  it("returns the golden 77433 Level IV / Medium result without score internals", async () => {
    const response = await handleOfficialEstimateRequest(
      jsonRequest(VALID_BODY),
      async () => resolution(),
      store(),
      createEmptyOfficialOccupationDisplayEnricher(),
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      outcome: string;
      estimate: {
        estimated_level: string;
        confidence: string;
        location_label: string;
        salary_comparison: Array<{ level: string; official_hourly: number; annual_wage: number; position: string }>;
        reasoning: string[];
      };
      wage: { level1: number; level4: number; average: number };
    };
    assert.equal(body.outcome, "AUTO");
    assert.equal(body.estimate.estimated_level, "IV");
    assert.equal(body.estimate.confidence, "Medium");
    assert.equal(body.estimate.location_label, "Houston-Pasadena-The Woodlands, TX");
    assert.equal(body.wage.level1, 42.2);
    assert.equal(body.wage.level4, 74.74);
    assert.equal(body.wage.average, 64.01);
    assert.deepEqual(
      body.estimate.salary_comparison.map((row) => [row.level, row.annual_wage, row.official_hourly, row.position]),
      [
        ["I", 87776, 42.2, "Above"],
        ["II", 110344, 53.05, "Above"],
        ["III", 132891, 63.89, "Above"],
        ["IV", 155459, 74.74, "Above"],
      ],
    );
    const text = JSON.stringify(body);
    assert.equal(text.includes("confidenceScore"), false);
    assert.equal(text.includes("score"), false);
    assert.equal(text.includes("1.05"), false);
    assert.equal(text.includes("0.95"), false);
    assert.equal(text.includes("runtime-selected-id"), false);
    assert.equal(text.includes("oflc-secret-id"), false);
    assert.equal("area_code" in (body as Record<string, unknown>), false);
    assert.equal("reason_code" in body, false);
    assert.equal("geo_level" in body.wage, false);
  });

  it("returns CHOICE_REQUIRED without inventing an estimate", async () => {
    const response = await handleOfficialEstimateRequest(
      jsonRequest({ ...VALID_BODY, zip: "76945" }),
      async () =>
        resolution({
          outcome: "CHOICE_REQUIRED",
          reasonCode: GEOGRAPHY_REASON.CHOICE_MULTIPLE_AREAS,
          zipRaw: "76945",
          zipNormalized: "76945",
          resolvedArea: null,
        }),
      store(),
      createEmptyOfficialOccupationDisplayEnricher(),
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as { outcome: string; estimate: unknown; wage: unknown };
    assert.equal(body.outcome, "CHOICE_REQUIRED");
    assert.equal(body.estimate, null);
    assert.equal(body.wage, null);
  });

  it("returns a controlled 400 when the client supplies area_code", async () => {
    const response = await handleOfficialEstimateRequest(
      jsonRequest({ ...VALID_BODY, area_code: "26420" }),
      async () => resolution(),
      store(),
      createEmptyOfficialOccupationDisplayEnricher(),
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Request contains unsupported fields.");
  });

  it("returns a controlled 500 without leaking internals", async () => {
    const response = await handleOfficialEstimateRequest(
      jsonRequest(VALID_BODY),
      async () => {
        throw new Error("secret connection string postgres://internal");
      },
      store(),
      createEmptyOfficialOccupationDisplayEnricher(),
    );
    assert.equal(response.status, 500);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Unable to estimate wage level.");
    assert.equal(JSON.stringify(body).includes("postgres://"), false);
  });
});

describe("official estimate implementation boundary", () => {
  it("client estimator files do not import the recipe, seed, or demo tables", () => {
    const files = [
      "components/H1bWageLevelEstimator.tsx",
      "lib/h1b/wage/client/officialEstimateClient.ts",
      "lib/h1b/occupations/client/officialOccupationSearchClient.ts",
      "lib/h1b/wage/client/formatOfficialWageDisplay.ts",
      "lib/h1b/wage/estimatorDisplay.types.ts",
    ];
    const forbidden = [
      "estimateOfficialWageLevel",
      "computeConfidence",
      "salaryToWageLevel",
      "occupationService",
      "socOccupationsSeed",
      "SOC_OCCUPATIONS",
      "wageLevelEstimator",
      "TYPICAL_H1B_GROUPS",
      "LOCATION_MULTIPLIERS",
      "SOC_BASE_WAGES",
    ];
    for (const file of files) {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      for (const token of forbidden) {
        assert.equal(text.includes(token), false, `${file} contains ${token}`);
      }
    }
  });
});
