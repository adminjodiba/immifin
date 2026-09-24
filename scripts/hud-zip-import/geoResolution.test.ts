import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analyzeFixtureZip,
  analyzeNational,
  buildFipsAreaIndex,
  classifyAreaCount,
  primaryCounty,
  selectScenarioA,
  selectScenarioB,
  selectScenarioC,
  selectScenarioD,
  unmappedReason,
  type HudGeoRow,
  type OflcLocalityRef,
} from "./geoResolution";

function row(
  zip: string,
  fips: string,
  bus: number | null,
  res: number | null,
  tot = 1,
  state = "TX"
): HudGeoRow {
  return { zip, county_fips: fips, bus_ratio: bus, res_ratio: res, tot_ratio: tot, pref_state: state };
}

const coke = "48081";
const tomGreen = "48451";
const harris = "48201";
const fortBend = "48157";
const suffolk = "36103";

const localities: OflcLocalityRef[] = [
  { area_code: "4800001", area_name: "Coke County TX", county_fips: coke, state_ab: "TX", county_town_name: "Coke County" },
  { area_code: "41660", area_name: "San Angelo TX", county_fips: tomGreen, state_ab: "TX", county_town_name: "Tom Green County" },
  { area_code: "26420", area_name: "Houston-Pasadena-The Woodlands TX", county_fips: harris, state_ab: "TX", county_town_name: "Harris County" },
  { area_code: "26420", area_name: "Houston-Pasadena-The Woodlands TX", county_fips: fortBend, state_ab: "TX", county_town_name: "Fort Bend County" },
  { area_code: "35620", area_name: "New York-Newark-Jersey City NY-NJ", county_fips: suffolk, state_ab: "NY", county_town_name: "Suffolk County" },
];

describe("geo resolution classification", () => {
  it("classifies AUTO, CHOICE, and UNMAPPED from distinct area counts", () => {
    assert.equal(classifyAreaCount(0), "UNMAPPED");
    assert.equal(classifyAreaCount(1), "AUTO");
    assert.equal(classifyAreaCount(2), "CHOICE");
  });

  it("analyzes 76945 as CHOICE under A and AUTO under B/C/D", () => {
    const rows = [
      row("76945", coke, 1, 0.9952606635, 0.995412844),
      row("76945", tomGreen, 0, 0.0047393365, 0.004587156),
    ];
    const index = buildFipsAreaIndex(localities);
    const result = analyzeFixtureZip(rows, index);
    assert.equal(result.hudCountyCount, 2);
    assert.equal(result.positiveBusCount, 1);
    assert.equal(result.A.classification, "CHOICE");
    assert.equal(result.A.distinctAreas.length, 2);
    assert.equal(result.B.classification, "AUTO");
    assert.deepEqual(result.B.selectedCounties, [coke]);
    assert.equal(result.C.classification, "AUTO");
    assert.equal(result.D.classification, "AUTO");
    assert.deepEqual(result.D.selectedCounties, [coke]);
  });

  it("keeps 77031 multi-county / single-area as AUTO in every scenario", () => {
    const rows = [row("77031", harris, 0.9557522124, 0.9987804878), row("77031", fortBend, 0.0442477876, 0.0012195122)];
    const result = analyzeFixtureZip(rows, buildFipsAreaIndex(localities));
    assert.equal(result.hudCountyCount, 2);
    assert.equal(result.A.classification, "AUTO");
    assert.equal(result.B.classification, "AUTO");
    assert.equal(result.C.classification, "AUTO");
    assert.equal(result.D.classification, "AUTO");
    assert.equal(result.A.distinctAreas.length, 1);
    assert.equal(result.A.distinctAreas[0]?.area_code, "26420");
  });

  it("keeps 77433 single-county as AUTO", () => {
    const rows = [row("77433", harris, 1, 1)];
    const result = analyzeFixtureZip(rows, buildFipsAreaIndex(localities));
    assert.equal(result.hudCountyCount, 1);
    assert.equal(result.A.classification, "AUTO");
    assert.equal(result.B.classification, "AUTO");
    assert.equal(result.C.classification, "AUTO");
    assert.equal(result.D.classification, "AUTO");
  });

  it("keeps 00501 business-only ZIP as AUTO", () => {
    const rows = [row("00501", suffolk, 1, 0, 1, "NY")];
    const result = analyzeFixtureZip(rows, buildFipsAreaIndex(localities));
    assert.equal(result.positiveBusCount, 1);
    assert.equal(result.A.classification, "AUTO");
    assert.equal(result.B.classification, "AUTO");
    assert.equal(result.C.classification, "AUTO");
    assert.equal(result.D.classification, "AUTO");
  });

  it("does not treat Scenario B empty selection as AUTO", () => {
    const rows = [row("99999", coke, 0, 1), row("99999", tomGreen, 0, 0)];
    assert.equal(selectScenarioB(rows).length, 0);
    const result = analyzeFixtureZip(rows, buildFipsAreaIndex(localities));
    assert.equal(result.B.classification, "UNMAPPED");
    assert.equal(result.C.classification, "CHOICE");
    assert.equal(unmappedReason(selectScenarioB(rows), buildFipsAreaIndex(localities)), "no_selected_hud_rows");
  });

  it("preserves all highest-BUS ties in Scenario D", () => {
    const rows = [row("11111", coke, 0.5, 0.5), row("11111", tomGreen, 0.5, 0.5)];
    const selected = selectScenarioD(rows);
    assert.equal(selected.length, 2);
    assert.equal(analyzeFixtureZip(rows, buildFipsAreaIndex(localities)).D.classification, "CHOICE");
  });

  it("labels placeholder GEOIDs as unmapped without inventing a county", () => {
    const rows = [row("77352", "00048", 1, 1)];
    const result = analyzeFixtureZip(rows, buildFipsAreaIndex(localities));
    assert.equal(result.A.classification, "UNMAPPED");
    assert.equal(unmappedReason(rows, buildFipsAreaIndex(localities)), "official_placeholder_geoid");
  });

  it("uses source-order first-win for business vs residential primary", () => {
    const rows = [row("22222", coke, 0.4, 0.6), row("22222", tomGreen, 0.4, 0.4)];
    const bus = primaryCounty(rows, "bus_ratio");
    const res = primaryCounty(rows, "res_ratio");
    assert.equal(bus?.county_fips, coke);
    assert.equal(res?.county_fips, coke);
  });

  it("counts CHOICE→AUTO when zero-BUS rows are excluded", () => {
    const rows = [
      ...[row("76945", coke, 1, 0.99, 0.99), row("76945", tomGreen, 0, 0.01, 0.01)],
      row("77433", harris, 1, 1),
    ];
    const report = analyzeNational(rows, buildFipsAreaIndex(localities));
    assert.equal(report.uniqueZips, 2);
    assert.equal(report.scenarios.A.choice, 1);
    assert.equal(report.scenarios.B.auto, 2);
    assert.equal(report.transitions["CHOICE->AUTO"], 1);
    assert.equal(report.zipsAreaSetChangesWithoutZeroBus, 1);
    assert.equal(selectScenarioA(rows.filter((r) => r.zip === "76945")).length, 2);
    assert.equal(selectScenarioC(rows.filter((r) => r.zip === "76945")).length, 1);
  });

  it("does not implement a winning county selector", () => {
    const rows = [row("76945", coke, 1, 1), row("76945", tomGreen, 0, 0)];
    const selected = selectScenarioA(rows);
    assert.equal(selected.length, 2);
    assert.ok(!("resolution" in selected[0]!));
  });
});
