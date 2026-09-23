import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyOfficialLabel } from "./parseOflcPackage";
import { foldLocalityName, resolveCountyFips, buildGazetteerIndex } from "./geography";
import { parseOflcAllIndustriesPackage, assertSchemaShape } from "./parseOflcPackage";
import { OFLC_ALL_INDUSTRIES_DATA_SOURCE } from "./types";

const NOTES = [
  "Wage Year 2026-27",
  "July 1, 2026 through June 30, 2027",
  "May 2025 wage estimates",
  "2018 Standard Occupational Classification",
].join("\n");

const GAZETTEER = [
  "USPS|GEOID|NAME",
  "TX|48201|Harris County",
  "CA|06075|San Francisco County",
  "WA|53033|King County",
  "TX|48345|Motley County",
  "NM|35013|Doña Ana County",
  "PR|72011|Añasco Municipio",
].join("\n");

function occsCsv(rows: Array<[string, string, string]>): string {
  return [
    `"soccode","Title","Description"`,
    ...rows.map(([c, t, d]) => `"${c}","${t}","${d}"`),
  ].join("\n");
}

function geoCsv(
  rows: Array<[string, string, string, string, string]>
): string {
  return [
    `"Area","AreaName","StateAb","State","CountyTownName"`,
    ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
  ].join("\n");
}

function alcCsv(
  rows: Array<[string, string, string, string, string, string, string, string, string]>
): string {
  return [
    `"Area","SocCode","GeoLvl","Level1","Level2","Level3","Level4","Average","Label"`,
    ...rows.map((r) => r.map((v) => `"${v}"`).join(",")),
  ].join("\n");
}

const BASE_OCCS = occsCsv([
  ["15-1252", "Software Developers", "Develop software."],
  ["11-1011", "Chief Executives", "Lead organizations."],
]);

const BASE_GEO = geoCsv([
  ["26420", "Houston-Pasadena-The Woodlands, TX", "TX", "Texas", "Harris County"],
  ["41860", "San Francisco-Oakland-Fremont, CA", "CA", "California", "San Francisco County"],
  ["42660", "Seattle-Tacoma-Bellevue, WA", "WA", "Washington", "King County"],
  ["4800001", "West Texas Region of Texas nonmetropolitan area", "TX", "Texas", "Motley County"],
]);

function alcRow(
  area: string,
  soc: string,
  levels: [string, string, string, string, string],
  label = "",
  geo = "1"
): [string, string, string, string, string, string, string, string, string] {
  return [area, soc, geo, ...levels, label];
}

const FIXTURE_ALC = alcCsv([
  alcRow("26420", "15-1252", ["42.20", "53.05", "63.89", "74.74", "58.47"]),
  alcRow("41860", "15-1252", ["65.91", "79.39", "92.86", "106.34", "86.12"]),
  alcRow("42660", "15-1252", ["53.66", "68.80", "83.94", "99.08", "76.37"]),
  alcRow("4800001", "15-1252", ["40.44", "51.01", "61.57", "72.14", "56.29"]),
  alcRow("26420", "11-1011", ["49.19", "74.04", "98.88", "123.73", "99.14"]),
  alcRow("41860", "11-1011", ["60.00", "70.00", "80.00", "90.00", "75.00"]),
  alcRow("42660", "11-1011", ["55.00", "65.00", "75.00", "85.00", "70.00"]),
  alcRow("4800001", "11-1011", ["30.00", "40.00", "50.00", "60.00", "45.00"]),
]);

function parseBase(overrides: Partial<Parameters<typeof parseOflcAllIndustriesPackage>[0]> = {}) {
  return parseOflcAllIndustriesPackage({
    packageFilename: "OFLC_Wages_2026-27.zip",
    packageSha256: "a".repeat(64),
    occupationsCsv: BASE_OCCS,
    geographyCsv: BASE_GEO,
    alcCsv: FIXTURE_ALC,
    gazetteerText: GAZETTEER,
    notesText: NOTES,
    ...overrides,
  });
}

describe("classifyOfficialLabel", () => {
  it("classifies blank, Annual Wage, High Wage, and No Leveled Wage", () => {
    assert.equal(classifyOfficialLabel(null), "blank");
    assert.equal(classifyOfficialLabel(""), "blank");
    assert.equal(classifyOfficialLabel("Annual Wage"), "annual_wage");
    assert.equal(classifyOfficialLabel("High Wage"), "high_wage");
    assert.equal(classifyOfficialLabel("No Leveled Wage"), "no_leveled_wage");
    assert.equal(classifyOfficialLabel("Something Else"), "other");
  });
});

describe("geography fold", () => {
  it("matches diacritic gazetteer names without fuzzy matching", () => {
    const index = buildGazetteerIndex([
      { state_ab: "NM", county_fips: "35013", name: "Doña Ana County" },
    ]);
    const hit = resolveCountyFips("NM", "Dona Ana County", index);
    assert.equal(hit.unmatched, false);
    assert.equal(hit.county_fips, "35013");
    assert.equal(foldLocalityName("Añasco Municipio"), foldLocalityName("Anasco Municipio"));
  });

  it("leaves GU/VI county_fips null", () => {
    const index = buildGazetteerIndex([]);
    const gu = resolveCountyFips("GU", "HAGATNA", index);
    const vi = resolveCountyFips("VI", "ST. THOMAS", index);
    assert.equal(gu.county_fips, null);
    assert.equal(gu.unmatched, false);
    assert.equal(vi.county_fips, null);
  });
});

describe("parseOflcAllIndustriesPackage", () => {
  it("builds 003A-shaped records and passes known fixtures", () => {
    const result = parseBase();
    assert.equal(result.ok, true);
    assert.equal(result.occupations.length, 2);
    assert.equal(result.areas.length, 4);
    assert.equal(result.localities.length, 4);
    assert.equal(result.wageRecords.length, 8);
    assert.equal(result.dataset.data_source, OFLC_ALL_INDUSTRIES_DATA_SOURCE);
    assert.equal(result.dataset.wage_year, "2026-27");
    assert.equal(typeof result.occupations[0].soc_code, "string");
    assert.equal(typeof result.areas[0].area_code, "string");
    assert.equal(result.localities[0].county_fips, "48201");
    assert.ok(result.fixtures.every((f) => f.ok));
    assert.deepEqual(assertSchemaShape(result), []);
    assert.ok(!result.wageRecords.some((w) => "user_wage_level" in w));
  });

  it("does not multiply Annual Wage values by 2080", () => {
    const alc = alcCsv([
      alcRow("26420", "15-1252", ["42.20", "53.05", "63.89", "74.74", "58.47"]),
      alcRow("41860", "15-1252", ["65.91", "79.39", "92.86", "106.34", "86.12"]),
      alcRow("42660", "15-1252", ["53.66", "68.80", "83.94", "99.08", "76.37"]),
      alcRow("4800001", "15-1252", ["40.44", "51.01", "61.57", "72.14", "56.29"]),
      alcRow("26420", "11-1011", ["80000", "90000", "100000", "110000", "95000"], "Annual Wage"),
      alcRow("41860", "11-1011", ["60.00", "70.00", "80.00", "90.00", "75.00"]),
      alcRow("42660", "11-1011", ["55.00", "65.00", "75.00", "85.00", "70.00"]),
      alcRow("4800001", "11-1011", ["30.00", "40.00", "50.00", "60.00", "45.00"]),
    ]);
    const result = parseBase({ alcCsv: alc });
    const annual = result.wageRecords.find((w) => w.label === "Annual Wage");
    assert.ok(annual);
    assert.equal(annual.level1, 80000);
    assert.equal(result.labelDistribution.annual_wage, 1);
  });

  it("keeps High Wage and No Leveled Wage official nulls", () => {
    const alc = alcCsv([
      alcRow("26420", "15-1252", ["42.20", "53.05", "63.89", "74.74", "58.47"]),
      alcRow("41860", "15-1252", ["65.91", "79.39", "92.86", "106.34", "86.12"]),
      alcRow("42660", "15-1252", ["53.66", "68.80", "83.94", "99.08", "76.37"]),
      alcRow("4800001", "15-1252", ["40.44", "51.01", "61.57", "72.14", "56.29"]),
      alcRow("26420", "11-1011", ["", "", "", "", ""], "High Wage"),
      alcRow("41860", "11-1011", ["", "", "", "", "120.00"], "No Leveled Wage"),
      alcRow("42660", "11-1011", ["55.00", "65.00", "75.00", "85.00", "70.00"]),
      alcRow("4800001", "11-1011", ["30.00", "40.00", "50.00", "60.00", "45.00"]),
    ]);
    const result = parseBase({ alcCsv: alc });
    const high = result.wageRecords.find((w) => w.label === "High Wage");
    const none = result.wageRecords.find((w) => w.label === "No Leveled Wage");
    assert.equal(high?.level1, null);
    assert.equal(high?.average, null);
    assert.equal(none?.level1, null);
    assert.equal(none?.average, 120);
    assert.equal(result.labelDistribution.high_wage, 1);
    assert.equal(result.labelDistribution.no_leveled_wage, 1);
  });

  it("fails closed on duplicate wage keys", () => {
    const alc = alcCsv([
      alcRow("26420", "15-1252", ["42.20", "53.05", "63.89", "74.74", "58.47"]),
      alcRow("26420", "15-1252", ["42.20", "53.05", "63.89", "74.74", "58.47"]),
    ]);
    const result = parseBase({ alcCsv: alc, validateFixtures: false });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "duplicate_wage_key"));
  });

  it("fails closed on orphan SOC and invalid geo_level", () => {
    const alc = alcCsv([
      alcRow("26420", "99-9999", ["1.00", "2.00", "3.00", "4.00", "2.50"], "", "9"),
    ]);
    const result = parseBase({ alcCsv: alc, validateFixtures: false });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "orphan_soc"));
    assert.ok(result.issues.some((i) => i.code === "invalid_geo_level"));
  });

  it("fails closed on negative official wages", () => {
    const alc = alcCsv([
      alcRow("26420", "15-1252", ["-1.00", "53.05", "63.89", "74.74", "58.47"]),
      alcRow("41860", "15-1252", ["65.91", "79.39", "92.86", "106.34", "86.12"]),
      alcRow("42660", "15-1252", ["53.66", "68.80", "83.94", "99.08", "76.37"]),
      alcRow("4800001", "15-1252", ["40.44", "51.01", "61.57", "72.14", "56.29"]),
      alcRow("26420", "11-1011", ["49.19", "74.04", "98.88", "123.73", "99.14"]),
      alcRow("41860", "11-1011", ["60.00", "70.00", "80.00", "90.00", "75.00"]),
      alcRow("42660", "11-1011", ["55.00", "65.00", "75.00", "85.00", "70.00"]),
      alcRow("4800001", "11-1011", ["30.00", "40.00", "50.00", "60.00", "45.00"]),
    ]);
    const result = parseBase({ alcCsv: alc });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "negative_wage"));
  });

  it("fails closed when a known official fixture differs", () => {
    const alc = alcCsv([
      alcRow("26420", "15-1252", ["1.00", "2.00", "3.00", "4.00", "2.50"]),
      alcRow("41860", "15-1252", ["65.91", "79.39", "92.86", "106.34", "86.12"]),
      alcRow("42660", "15-1252", ["53.66", "68.80", "83.94", "99.08", "76.37"]),
      alcRow("4800001", "15-1252", ["40.44", "51.01", "61.57", "72.14", "56.29"]),
      alcRow("26420", "11-1011", ["49.19", "74.04", "98.88", "123.73", "99.14"]),
      alcRow("41860", "11-1011", ["60.00", "70.00", "80.00", "90.00", "75.00"]),
      alcRow("42660", "11-1011", ["55.00", "65.00", "75.00", "85.00", "70.00"]),
      alcRow("4800001", "11-1011", ["30.00", "40.00", "50.00", "60.00", "45.00"]),
    ]);
    const result = parseBase({ alcCsv: alc });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "fixture_mismatch"));
  });

  it("resolves GU locality without a FIPS and reports extra labels", () => {
    const geo = `${BASE_GEO}\n${geoCsv([["6600001", "Guam MSA", "GU", "GUAM", "HAGATNA"]]).split("\n")[1]}`;
    const alc = `${FIXTURE_ALC}\n${alcCsv([alcRow("6600001", "15-1252", ["10.00", "20.00", "30.00", "40.00", "25.00"], "Special Case")]).split("\n")[1]}`;
    const occs = `${BASE_OCCS}`;
    const result = parseBase({
      geographyCsv: geo,
      alcCsv: alc,
      occupationsCsv: occs,
    });
    const gu = result.localities.find((l) => l.state_ab === "GU");
    assert.equal(gu?.county_fips, null);
    assert.ok(result.otherLabels.includes("Special Case"));
    assert.ok(result.issues.some((i) => i.code === "unexpected_label" && i.severity === "warning"));
  });
});
