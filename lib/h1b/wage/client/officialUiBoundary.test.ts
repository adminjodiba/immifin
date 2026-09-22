import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

describe("official H-1B wage UI boundary", () => {
  it("does not use the demo estimator or 722 seed on the active page", () => {
    const page = readFileSync(join(process.cwd(), "components/H1bWageLevelEstimator.tsx"), "utf8");
    const forbidden = [
      "estimateH1bWageLevel",
      "occupationService",
      "socOccupationsSeed",
      "searchOccupations",
      "Likely Level",
      "area_code",
    ];
    for (const token of forbidden) {
      assert.equal(page.includes(token), false, token);
    }
    assert.equal(page.includes("/api/h1b/official-occupations") || page.includes("fetchOfficialOccupations"), true);
    assert.equal(page.includes("fetchOfficialWage"), true);
    assert.equal(page.includes("Look up published wages"), true);
    assert.equal(page.includes("ANNUAL_EQUIVALENT_DISCLAIMER"), true);
    assert.equal(page.includes("shouldShowAnnualEquivalent"), true);
  });
});
