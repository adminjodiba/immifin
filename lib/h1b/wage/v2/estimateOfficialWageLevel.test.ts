import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { annualEquivalentFromHourly } from "@/lib/h1b/wage/client/formatOfficialWageDisplay";
import type { OfficialWageClientWage } from "@/lib/h1b/wage/client/officialWageLookupClient";
import {
  computeConfidence,
  estimateOfficialWageLevel,
  officialWageToAnnualThresholds,
  OFFICIAL_WAGE_NOT_LEVELED_COPY,
} from "@/lib/h1b/wage/v2/estimateOfficialWageLevel";

function houstonSoftwareHourly(overrides: Partial<OfficialWageClientWage> = {}): OfficialWageClientWage {
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

describe("officialWageToAnnualThresholds", () => {
  it("converts ordinary hourly 15-1252 / 77433 values with ×2080", () => {
    const converted = officialWageToAnnualThresholds(houstonSoftwareHourly());
    assert.ok(converted);
    assert.equal(converted.usedAnnualEquivalent, true);
    assert.deepEqual(converted.thresholds, {
      level1: 87776,
      level2: 110344,
      level3: 132891,
      level4: 155459,
    });
    assert.equal(annualEquivalentFromHourly(64.01), 133141);
  });

  it("does not multiply Annual Wage records by 2080", () => {
    const converted = officialWageToAnnualThresholds(
      houstonSoftwareHourly({
        label: "Annual Wage",
        level1: 77830,
        level2: 89513,
        level3: 101197,
        level4: 112880,
        average: 101310,
      }),
    );
    assert.ok(converted);
    assert.equal(converted.usedAnnualEquivalent, false);
    assert.deepEqual(converted.thresholds, {
      level1: 77830,
      level2: 89513,
      level3: 101197,
      level4: 112880,
    });
  });

  it("does not fabricate High Wage or No Leveled Wage thresholds", () => {
    assert.equal(
      officialWageToAnnualThresholds(
        houstonSoftwareHourly({
          label: "High Wage",
          level1: null,
          level2: null,
          level3: null,
          level4: null,
          average: 90.12,
        }),
      ),
      null,
    );
    assert.equal(
      officialWageToAnnualThresholds(
        houstonSoftwareHourly({
          label: "No Leveled Wage",
          level1: null,
          level2: null,
          level3: null,
          level4: null,
          average: null,
        }),
      ),
      null,
    );
  });
});

describe("estimateOfficialWageLevel", () => {
  it("estimates Level IV for $185,000 / 4–6 years / Master's against 77433 official wages", () => {
    const result = estimateOfficialWageLevel({
      socCode: "15-1252",
      officialTitle: "Software Developers",
      annualSalary: 185000,
      experience: "4-6",
      education: "Master",
      wageAreaName: "Houston-Pasadena-The Woodlands, TX",
      wage: houstonSoftwareHourly(),
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.estimatedLevel, "IV");
    assert.equal(result.confidence, "Medium");
    assert.equal(result.usedAnnualEquivalent, true);
    assert.equal(result.locationLabel, "Houston-Pasadena-The Woodlands, TX");
    assert.deepEqual(
      result.salaryComparison.map((row) => [row.level, row.annualWage, row.officialHourly, row.position]),
      [
        ["I", 87776, 42.2, "Above"],
        ["II", 110344, 53.05, "Above"],
        ["III", 132891, 63.89, "Above"],
        ["IV", 155459, 74.74, "Above"],
      ],
    );
    assert.ok(result.reasoning.some((line) => line.includes("official OFLC wages")));
    assert.ok(result.reasoning.some((line) => line.includes("Houston-Pasadena-The Woodlands, TX")));
    assert.ok(result.reasoning.some((line) => line.includes("2,080")));
    assert.ok(result.reasoning.every((line) => !line.toLowerCase().includes("demo")));
    assert.ok(result.reasoning.some((line) => line.includes("not a DOL Prevailing Wage Determination")));
  });

  it("returns a safe error when official levels are unavailable", () => {
    const result = estimateOfficialWageLevel({
      socCode: "15-1252",
      officialTitle: "Software Developers",
      annualSalary: 185000,
      experience: "4-6",
      education: "Master",
      wageAreaName: "Houston-Pasadena-The Woodlands, TX",
      wage: houstonSoftwareHourly({
        label: "No Leveled Wage",
        level1: null,
        level2: null,
        level3: null,
        level4: null,
        average: null,
      }),
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.code, "wage_not_leveled");
    assert.equal(result.message, OFFICIAL_WAGE_NOT_LEVELED_COPY);
  });

  it("preserves recovered experience/education confidence scoring", () => {
    assert.equal(computeConfidence("IV", "4-6", "Master"), "Medium");
    assert.equal(computeConfidence("III", "7-10", "PhD"), "High");
    assert.equal(computeConfidence("IV", "0-1", "Bachelor"), "Low");
  });
});
