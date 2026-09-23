import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

describe("official H-1B wage UI boundary", () => {
  it("canonical page uses official APIs and recovered estimation, not the demo entry point", () => {
    const page = readFileSync(join(process.cwd(), "components/H1bWageLevelEstimator.tsx"), "utf8");
    const forbidden = [
      "estimateH1bWageLevel(",
      "searchOccupations(",
      "STATE_OPTIONS",
      "workCity",
      "area_code",
      "h1b-wage-level-estimator-v2",
      "H1bWageLevelEstimatorV2",
    ];
    for (const token of forbidden) {
      assert.equal(page.includes(token), false, token);
    }
    assert.equal(page.includes("fetchOfficialOccupations"), true);
    assert.equal(page.includes("fetchOfficialEstimate"), true);
    assert.equal(page.includes("fetchOfficialWage"), false);
    assert.equal(page.includes("WorksiteGeographyLookup"), true);
    assert.equal(page.includes("estimateOfficialWageLevel"), false);
    assert.equal(page.includes("occupationService"), false);
    assert.equal(page.includes("wageLevelEstimator"), false);
    assert.equal(page.includes("socOccupations"), false);
    assert.equal(page.includes("checkAbuseGate"), false);
    assert.equal(page.includes("enforceAbuseGate"), false);
    assert.equal(page.includes("Estimate Wage Level"), true);
    assert.equal(page.includes("/immigration/h1b-lottery-odds-calculator"), true);
    assert.equal(page.includes("wageLevel="), true);
    assert.equal(page.includes('const PAGE_HREF = "/immigration/h1b-wage-level-estimator"'), true);
  });

  it("ordinary hourly official wage and annual equivalent are separate columns", () => {
    const page = readFileSync(join(process.cwd(), "components/H1bWageLevelEstimator.tsx"), "utf8");
    assert.equal(page.includes("(Hourly rate)"), true);
    assert.equal(page.includes("(2,080 hours)"), true);
    assert.equal(page.includes("Annual equivalent"), true);
    assert.equal(page.includes("Your salary position"), true);
    assert.equal(page.includes("overflow-x-auto"), true);
    assert.equal(page.includes("ANNUAL_EQUIVALENT_DISCLAIMER"), true);
    assert.equal(page.includes("formatOfficialWageAmount(row.officialHourly, \"hour\")"), true);
    assert.equal(page.includes("formatCurrency(row.annualWage)"), true);
    assert.equal(page.includes("$45.77"), false);
    assert.equal(page.includes("$95,202"), false);
    assert.equal(page.includes("annual equivalent"), false);
    assert.equal(page.includes("Use this wage level in H-1B Lottery Odds Calculator"), true);
  });

  it("throttled UX preserves occupation, ZIP, salary, experience, and education", () => {
    const estimator = readFileSync(join(process.cwd(), "components/H1bWageLevelEstimator.tsx"), "utf8");
    assert.equal(estimator.includes("officialEstimateFailureCopy"), true);
    assert.equal(estimator.includes("occupationSearchShouldPause"), true);
    assert.equal(estimator.includes("OFFICIAL_OCCUPATION_SEARCH_THROTTLED_COPY"), true);
    assert.equal(estimator.includes('setOccupationQuery("")'), false);
    assert.equal(estimator.includes('setAnnualSalary("")'), false);
    const geo = readFileSync(join(process.cwd(), "components/h1b/WorksiteGeographyLookup.tsx"), "utf8");
    assert.equal(geo.includes("WORKSITE_GEOGRAPHY_THROTTLED_COPY"), true);
  });
});
