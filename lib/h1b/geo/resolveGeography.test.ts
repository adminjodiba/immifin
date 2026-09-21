import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APPROVED_GEOGRAPHY_DATASET_PAIR } from "@/lib/h1b/geo/approvedGeographyDatasetPair";
import {
  GEOGRAPHY_CONTRACT_ID,
  GEOGRAPHY_PRODUCT_DECISION_ID,
  GEOGRAPHY_REASON,
  GEOGRAPHY_RESOLUTION_POLICY,
} from "@/lib/h1b/geo/geographyResolution.types";
import type {
  OfficialHudCountyRow,
  OflcCountyMapping,
} from "@/lib/h1b/geo/geographyResolution.types";
import { normalizeWorksiteZip } from "@/lib/h1b/geo/normalizeWorksiteZip";
import { orchestrateGeographyResolution } from "@/lib/h1b/geo/orchestrateGeographyResolution";
import { evaluateGeographyResolution } from "@/lib/h1b/geo/resolveGeography";
import type { ApprovedGeographyDatasetContext } from "@/lib/h1b/geo/geographyDatasetSelection";

const datasets: ApprovedGeographyDatasetContext = {
  ok: true,
  hud: {
    versionId: "hud-approved",
    year: 2026,
    quarter: 2,
    packageSha256: "a".repeat(64),
  },
  oflc: {
    datasetId: "oflc-approved",
    wageYear: "2026-27",
    dataSource: "All Industries",
    packageSha256: "b".repeat(64),
  },
  compatibilityPolicy: APPROVED_GEOGRAPHY_DATASET_PAIR,
};

function hud(countyFips: string, prefState = "TX"): OfficialHudCountyRow {
  return { countyFips, prefState };
}

function mapping(partial: OflcCountyMapping): OflcCountyMapping {
  return partial;
}

function index(rows: OflcCountyMapping[]): Map<string, OflcCountyMapping[]> {
  const map = new Map<string, OflcCountyMapping[]>();
  for (const row of rows) {
    const current = map.get(row.countyFips) ?? [];
    current.push(row);
    map.set(row.countyFips, current);
  }
  return map;
}

const harris = mapping({
  countyFips: "48201",
  countyTownName: "Harris County",
  stateAb: "TX",
  stateName: "Texas",
  areaCode: "26420",
  areaName: "Houston-Pasadena-The Woodlands, TX",
});
const fortBend = mapping({
  countyFips: "48157",
  countyTownName: "Fort Bend County",
  stateAb: "TX",
  stateName: "Texas",
  areaCode: "26420",
  areaName: "Houston-Pasadena-The Woodlands, TX",
});
const coke = mapping({
  countyFips: "48081",
  countyTownName: "Coke County",
  stateAb: "TX",
  stateName: "Texas",
  areaCode: "4800004",
  areaName: "Hill Country Region of Texas nonmetropolitan area",
});
const tomGreen = mapping({
  countyFips: "48451",
  countyTownName: "Tom Green County",
  stateAb: "TX",
  stateName: "Texas",
  areaCode: "41660",
  areaName: "San Angelo, TX",
});
const suffolk = mapping({
  countyFips: "36103",
  countyTownName: "Suffolk County",
  stateAb: "NY",
  stateName: "New York",
  areaCode: "35620",
  areaName: "New York-Newark-Jersey City, NY-NJ",
});

function resolve(input: {
  zip: unknown;
  countyFips?: unknown;
  areaCode?: unknown;
  hudRows: OfficialHudCountyRow[];
  mappings: OflcCountyMapping[];
  datasetSelection?: ApprovedGeographyDatasetContext | { ok: false; reasonCode: "UNAVAILABLE_DATASET_INACTIVE" | "UNAVAILABLE_DATASET_INCOMPATIBLE" };
}) {
  return evaluateGeographyResolution({
    zip: input.zip,
    countyFips: input.countyFips,
    areaCode: input.areaCode,
    datasetSelection: input.datasetSelection ?? datasets,
    hudRows: input.hudRows,
    oflcIndex: index(input.mappings),
  });
}

describe("normalizeWorksiteZip", () => {
  it("CASE 1: 00501 preserves leading zeros", () => {
    assert.deepEqual(normalizeWorksiteZip("00501"), { ok: true, zipNormalized: "00501" });
  });

  it("CASE 2: 00501-1234 normalizes to 00501", () => {
    assert.deepEqual(normalizeWorksiteZip("00501-1234"), { ok: true, zipNormalized: "00501" });
  });

  it("CASE 3: 005011234 normalizes to 00501", () => {
    assert.deepEqual(normalizeWorksiteZip("005011234"), { ok: true, zipNormalized: "00501" });
  });

  it("CASE 4: 501 is INVALID_ZIP", () => {
    assert.deepEqual(normalizeWorksiteZip("501"), { ok: false, reasonCode: "INVALID_ZIP" });
  });

  it("CASE 5: 0501 is INVALID_ZIP", () => {
    assert.deepEqual(normalizeWorksiteZip("0501"), { ok: false, reasonCode: "INVALID_ZIP" });
  });

  it("CASE 6: ABCDE is INVALID_ZIP", () => {
    assert.deepEqual(normalizeWorksiteZip("ABCDE"), { ok: false, reasonCode: "INVALID_ZIP" });
  });

  it("CASE 7: 123456 is INVALID_ZIP", () => {
    assert.deepEqual(normalizeWorksiteZip("123456"), { ok: false, reasonCode: "INVALID_ZIP" });
  });
});

describe("evaluateGeographyResolution", () => {
  it("CASE 8: no HUD rows → UNAVAILABLE_NO_HUD_ZIP", () => {
    const result = resolve({ zip: "99999", hudRows: [], mappings: [] });
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.UNAVAILABLE_NO_HUD_ZIP);
    assert.equal(result.resolvedArea, null);
  });

  it("CASE 9: single county / single area → AUTO", () => {
    const result = resolve({ zip: "77433", hudRows: [hud("48201")], mappings: [harris] });
    assert.equal(result.outcome, "AUTO");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.AUTO_SINGLE_AREA);
    assert.deepEqual(result.resolvedArea, {
      areaCode: "26420",
      areaName: "Houston-Pasadena-The Woodlands, TX",
    });
    assert.deepEqual(result.choiceOptions, []);
    assert.equal(result.selectedCountyFips, null);
  });

  it("CASE 10: multiple counties / same area → AUTO", () => {
    const result = resolve({
      zip: "77031",
      hudRows: [hud("48201"), hud("48157")],
      mappings: [harris, fortBend],
    });
    assert.equal(result.outcome, "AUTO");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.AUTO_SINGLE_AREA);
    assert.equal(result.resolvedArea?.areaCode, "26420");
    assert.deepEqual(result.choiceOptions, []);
    assert.equal(result.officialCountyCount, 2);
  });

  it("CASE 11: multiple counties / multiple areas → CHOICE_REQUIRED", () => {
    const result = resolve({
      zip: "76945",
      hudRows: [hud("48451"), hud("48081")],
      mappings: [tomGreen, coke],
    });
    assert.equal(result.outcome, "CHOICE_REQUIRED");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.CHOICE_MULTIPLE_AREAS);
    assert.equal(result.resolvedArea, null);
    assert.equal(result.choiceOptions.length, 2);
  });

  it("CASE 12: CHOICE options sorted by county_fips", () => {
    const result = resolve({
      zip: "76945",
      hudRows: [hud("48451"), hud("48081")],
      mappings: [tomGreen, coke],
    });
    assert.deepEqual(
      result.choiceOptions.map((item) => item.countyFips),
      ["48081", "48451"],
    );
  });

  it("CASE 13: BUS_RATIO=0 county is retained under Scenario A", () => {
    const result = resolve({
      zip: "76945",
      hudRows: [hud("48081"), hud("48451")],
      mappings: [coke, tomGreen],
    });
    assert.equal(result.outcome, "CHOICE_REQUIRED");
    assert.ok(result.choiceOptions.some((item) => item.countyFips === "48451"));
    assert.ok(result.choiceOptions.some((item) => item.countyDisplayName === "Tom Green County"));
  });

  it("CASE 14: one mapped + one unmapped official county → PARTIAL_OFFICIAL_COUNTY_UNMAPPED", () => {
    const result = resolve({
      zip: "99998",
      hudRows: [hud("48201"), hud("00048")],
      mappings: [harris],
    });
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.PARTIAL_OFFICIAL_COUNTY_UNMAPPED);
    assert.equal(result.resolvedArea, null);
    assert.deepEqual(result.choiceOptions, []);
    assert.equal(result.unmappedOfficialCounties.length, 1);
    assert.equal(result.unmappedOfficialCounties[0]?.countyFips, "00048");
    assert.equal(result.mappedCounties.length, 1);
  });

  it("CASE 15: all official counties placeholder → UNAVAILABLE_PLACEHOLDER_GEOID", () => {
    const result = resolve({
      zip: "99997",
      hudRows: [hud("00048", "TX"), hud("00070", "PW")],
      mappings: [],
    });
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.UNAVAILABLE_PLACEHOLDER_GEOID);
  });

  it("CASE 16: territory/unjoined FIPS → UNAVAILABLE_TERRITORY_UNJOINED", () => {
    const result = resolve({
      zip: "00801",
      hudRows: [hud("78030", "VI")],
      mappings: [],
    });
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.UNAVAILABLE_TERRITORY_UNJOINED);
    assert.equal(result.unmappedOfficialCounties[0]?.unmappedClass, "territory_unjoined");
  });

  it("CASE 17: one county mapping to >1 area → UNAVAILABLE_DATASET_INCOMPATIBLE", () => {
    const result = resolve({
      zip: "77433",
      hudRows: [hud("48201")],
      mappings: [
        harris,
        { ...harris, areaCode: "19100", areaName: "Dallas-Fort Worth-Arlington, TX" },
      ],
    });
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.UNAVAILABLE_DATASET_INCOMPATIBLE);
    assert.equal(result.resolvedArea, null);
  });

  it("CASE 18: valid second-step county → AUTO + selected_county_fips", () => {
    const result = resolve({
      zip: "76945",
      countyFips: "48451",
      hudRows: [hud("48081"), hud("48451")],
      mappings: [coke, tomGreen],
    });
    assert.equal(result.outcome, "AUTO");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.AUTO_SINGLE_AREA);
    assert.equal(result.selectedCountyFips, "48451");
    assert.deepEqual(result.resolvedArea, {
      areaCode: "41660",
      areaName: "San Angelo, TX",
    });
    assert.deepEqual(result.choiceOptions, []);
  });

  it("CASE 19: malformed county token → INVALID_COUNTY_FIPS", () => {
    const result = resolve({
      zip: "76945",
      countyFips: "ABCDE",
      hudRows: [hud("48081"), hud("48451")],
      mappings: [coke, tomGreen],
    });
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.INVALID_COUNTY_FIPS);
  });

  it("CASE 20: valid county not belonging to ZIP → INVALID_COUNTY_FOR_ZIP", () => {
    const result = resolve({
      zip: "76945",
      countyFips: "48201",
      hudRows: [hud("48081"), hud("48451")],
      mappings: [coke, tomGreen, harris],
    });
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.INVALID_COUNTY_FOR_ZIP);
    assert.equal(result.resolvedArea, null);
  });

  it("CASE 21: official county but unmapped → COUNTY_UNMAPPED", () => {
    const result = resolve({
      zip: "99996",
      countyFips: "00048",
      hudRows: [hud("00048"), hud("48201")],
      mappings: [harris],
    });
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.COUNTY_UNMAPPED);
  });

  it("CASE 22: client area_code cannot override backend mapping", () => {
    const result = resolve({
      zip: "76945",
      areaCode: "26420",
      hudRows: [hud("48081"), hud("48451")],
      mappings: [coke, tomGreen],
    });
    assert.equal(result.outcome, "CHOICE_REQUIRED");
    assert.equal(result.resolvedArea, null);
    assert.ok(!result.choiceOptions.some((item) => item.areaCode === "26420"));
  });

  it("CASE 23: ratio values cannot change classification", () => {
    const withRatioShape = [
      { ...hud("48081"), busRatio: 1 },
      { ...hud("48451"), busRatio: 0 },
    ];
    const result = resolve({
      zip: "76945",
      hudRows: withRatioShape,
      mappings: [coke, tomGreen],
    });
    assert.equal(result.outcome, "CHOICE_REQUIRED");
    assert.equal(result.choiceOptions.length, 2);
  });

  it("CASE 24: provenance contains validated dataset context", () => {
    const result = resolve({ zip: "77433", hudRows: [hud("48201")], mappings: [harris] });
    assert.equal(result.provenance.contractId, GEOGRAPHY_CONTRACT_ID);
    assert.equal(result.provenance.productDecisionId, GEOGRAPHY_PRODUCT_DECISION_ID);
    assert.equal(result.provenance.resolutionPolicy, GEOGRAPHY_RESOLUTION_POLICY);
    assert.equal(result.provenance.hudCrosswalkVersionId, "hud-approved");
    assert.equal(result.provenance.hudYear, 2026);
    assert.equal(result.provenance.hudQuarter, 2);
    assert.equal(result.provenance.oflcDatasetId, "oflc-approved");
    assert.equal(result.provenance.oflcWageYear, "2026-27");
    assert.equal(result.provenance.zipNormalized, "77433");
    assert.deepEqual(result.provenance.compatibilityPolicy, APPROVED_GEOGRAPHY_DATASET_PAIR);
  });

  it("77433 → AUTO Harris / 26420", () => {
    const result = resolve({ zip: "77433", hudRows: [hud("48201")], mappings: [harris] });
    assert.equal(result.outcome, "AUTO");
    assert.equal(result.mappedCounties[0]?.countyDisplayName, "Harris County");
    assert.equal(result.resolvedArea?.areaCode, "26420");
  });

  it("77031 → AUTO Fort Bend + Harris / 26420", () => {
    const result = resolve({
      zip: "77031",
      hudRows: [hud("48157"), hud("48201")],
      mappings: [fortBend, harris],
    });
    assert.equal(result.outcome, "AUTO");
    assert.deepEqual(
      result.mappedCounties.map((item) => item.countyDisplayName),
      ["Fort Bend County", "Harris County"],
    );
    assert.equal(result.resolvedArea?.areaCode, "26420");
  });

  it("76945 → CHOICE Coke + Tom Green", () => {
    const result = resolve({
      zip: "76945",
      hudRows: [hud("48081"), hud("48451")],
      mappings: [coke, tomGreen],
    });
    assert.equal(result.outcome, "CHOICE_REQUIRED");
    assert.deepEqual(
      result.choiceOptions.map((item) => item.countyDisplayName),
      ["Coke County", "Tom Green County"],
    );
    assert.equal(result.choiceOptions[0]?.stateDisplayName, "Texas");
  });

  it("76945 + 48451 → AUTO Tom Green / 41660", () => {
    const result = resolve({
      zip: "76945",
      countyFips: "48451",
      hudRows: [hud("48081"), hud("48451")],
      mappings: [coke, tomGreen],
    });
    assert.equal(result.selectedCountyFips, "48451");
    assert.equal(result.resolvedArea?.areaCode, "41660");
  });

  it("76945 + 48201 → INVALID_COUNTY_FOR_ZIP", () => {
    const result = resolve({
      zip: "76945",
      countyFips: "48201",
      hudRows: [hud("48081"), hud("48451")],
      mappings: [coke, tomGreen],
    });
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.INVALID_COUNTY_FOR_ZIP);
  });

  it("00501 → AUTO Suffolk / 35620 with leading zero", () => {
    const result = resolve({
      zip: "00501",
      hudRows: [hud("36103", "NY")],
      mappings: [suffolk],
    });
    assert.equal(result.zipNormalized, "00501");
    assert.equal(result.outcome, "AUTO");
    assert.equal(result.mappedCounties[0]?.countyDisplayName, "Suffolk County");
    assert.equal(result.resolvedArea?.areaCode, "35620");
  });

  it("00801 → UNAVAILABLE_TERRITORY_UNJOINED", () => {
    const result = resolve({
      zip: "00801",
      hudRows: [hud("78030", "VI")],
      mappings: [],
    });
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.UNAVAILABLE_TERRITORY_UNJOINED);
  });

  it("left-pads 1–4 digit county tokens then validates ZIP membership", () => {
    const result = resolve({
      zip: "76945",
      countyFips: "4820",
      hudRows: [hud("48081"), hud("48451")],
      mappings: [coke, tomGreen],
    });
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.INVALID_COUNTY_FOR_ZIP);
  });

  it("uses published county-equivalent names as-is", () => {
    const result = resolve({
      zip: "70112",
      hudRows: [hud("22071", "LA")],
      mappings: [
        mapping({
          countyFips: "22071",
          countyTownName: "Orleans Parish",
          stateAb: "LA",
          stateName: "Louisiana",
          areaCode: "35380",
          areaName: "New Orleans-Metairie, LA",
        }),
      ],
    });
    assert.equal(result.mappedCounties[0]?.countyDisplayName, "Orleans Parish");
  });
});

describe("orchestrateGeographyResolution", () => {
  it("fails closed on inactive datasets without reading HUD/OFLC geography", async () => {
    let hudLoads = 0;
    let oflcLoads = 0;
    const result = await orchestrateGeographyResolution(
      { zip: "77433" },
      {
        selectDatasets: async () => ({
          ok: false,
          reasonCode: "UNAVAILABLE_DATASET_INACTIVE",
        }),
        store: {
          async loadOfficialHudCounties() {
            hudLoads += 1;
            return [];
          },
          async loadOflcMappings() {
            oflcLoads += 1;
            return [];
          },
        },
      },
    );
    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.UNAVAILABLE_DATASET_INACTIVE);
    assert.equal(hudLoads, 0);
    assert.equal(oflcLoads, 0);
  });

  it("does not query geography when ZIP is invalid", async () => {
    let guardCalls = 0;
    const result = await orchestrateGeographyResolution(
      { zip: "501" },
      {
        selectDatasets: async () => {
          guardCalls += 1;
          return { ok: false, reasonCode: "UNAVAILABLE_DATASET_INACTIVE" };
        },
        store: {
          async loadOfficialHudCounties() {
            throw new Error("HUD must not load");
          },
          async loadOflcMappings() {
            throw new Error("OFLC must not load");
          },
        },
      },
    );
    assert.equal(result.reasonCode, GEOGRAPHY_REASON.INVALID_ZIP);
    assert.equal(guardCalls, 0);
  });
});
