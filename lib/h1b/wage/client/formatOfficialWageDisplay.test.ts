import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANNUAL_EQUIVALENT_HOURS,
  annualEquivalentFromHourly,
  formatAnnualEquivalent,
  formatOfficialWageAmount,
  officialWageDisplayRows,
  officialWageDisplayUnit,
  officialWageInputsChanged,
  shouldShowAnnualEquivalent,
  shouldShowNoLeveledCopy,
} from "@/lib/h1b/wage/client/formatOfficialWageDisplay";
import type { OfficialWageClientWage } from "@/lib/h1b/wage/client/officialWageLookupClient";

function wage(overrides: Partial<OfficialWageClientWage> = {}): OfficialWageClientWage {
  return {
    soc_code: "15-1252",
    occupation_title: "Software Developers",
    geo_level: 1,
    label: null,
    level1: 42.2,
    level2: 53.05,
    level3: 63.89,
    level4: 74.74,
    average: 64.01,
    ...overrides,
  };
}

describe("formatOfficialWageDisplay", () => {
  it("formats ordinary blank-label values as hourly plus ×2080 annual equivalent", () => {
    assert.equal(officialWageDisplayUnit(null), "hour");
    assert.equal(ANNUAL_EQUIVALENT_HOURS, 2080);
    const rows = officialWageDisplayRows(wage());
    assert.deepEqual(
      rows.map((row) => [row.official, row.annualEquivalent]),
      [
        ["$42.20/hour", "$87,776/year"],
        ["$53.05/hour", "$110,344/year"],
        ["$63.89/hour", "$132,891/year"],
        ["$74.74/hour", "$155,459/year"],
        ["$64.01/hour", "$133,141/year"],
      ],
    );
    assert.equal(shouldShowAnnualEquivalent(wage()), true);
    assert.equal(annualEquivalentFromHourly(42.2), 87776);
    assert.equal(formatAnnualEquivalent(42.2), "$87,776/year");
  });

  it("formats Annual Wage values as annual dollars without ×2080", () => {
    const annual = wage({
      soc_code: "11-9032",
      occupation_title: "Education Administrators, Kindergarten through Secondary",
      label: "Annual Wage",
      level1: 77830,
      level2: 89513,
      level3: 101197,
      level4: 112880,
      average: 101310,
    });
    const rows = officialWageDisplayRows(annual);
    assert.equal(officialWageDisplayUnit("Annual Wage"), "year");
    assert.equal(shouldShowAnnualEquivalent(annual), false);
    assert.deepEqual(
      rows.map((row) => [row.official, row.annualEquivalent]),
      [
        ["$77,830/year", null],
        ["$89,513/year", null],
        ["$101,197/year", null],
        ["$112,880/year", null],
        ["$101,310/year", null],
      ],
    );
    assert.equal(rows[0]?.official.includes("2080"), false);
    assert.equal(77830 * 2080 === 77830, false);
  });

  it("omits null High Wage levels and does not invent a unit or annual equivalent", () => {
    const high = wage({
      soc_code: "29-1022",
      occupation_title: "Oral and Maxillofacial Surgeons",
      geo_level: 4,
      label: "High Wage",
      level1: null,
      level2: null,
      level3: null,
      level4: null,
      average: 166.58,
    });
    const rows = officialWageDisplayRows(high);
    assert.deepEqual(rows, [
      { key: "average", label: "Average", official: "$166.58", annualEquivalent: null },
    ]);
    assert.equal(shouldShowAnnualEquivalent(high), false);
    assert.equal(rows[0]?.official.includes("/hour"), false);
    assert.equal(rows[0]?.official.includes("/year"), false);
  });

  it("shows no fabricated No Leveled Wage values", () => {
    const empty = wage({
      soc_code: "11-1031",
      occupation_title: "Legislators",
      geo_level: 4,
      label: "No Leveled Wage",
      level1: null,
      level2: null,
      level3: null,
      level4: null,
      average: null,
    });
    assert.equal(shouldShowNoLeveledCopy(empty), true);
    assert.deepEqual(officialWageDisplayRows(empty), []);
    assert.equal(shouldShowAnnualEquivalent(empty), false);
    assert.equal(formatOfficialWageAmount(null, "unspecified"), null);
  });

  it("clears stale results when occupation, ZIP, or county changes", () => {
    const base = { socCode: "15-1252", zip: "76945", countyFips: "48081" };
    assert.equal(officialWageInputsChanged(base, base), false);
    assert.equal(officialWageInputsChanged(base, { ...base, socCode: "11-9032" }), true);
    assert.equal(officialWageInputsChanged(base, { ...base, zip: "77433" }), true);
    assert.equal(officialWageInputsChanged(base, { ...base, countyFips: "48451" }), true);
  });
});
