import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  calculateH1bLotteryOdds,
  DHS_MODELED_RANDOM_BASELINE,
  DHS_MODELED_SELECTION_ESTIMATES,
  formatSignedPercentagePoints,
  parseWageLevelParam,
} from "@/lib/h1b/h1bLotteryOdds";

const logicSource = readFileSync(join(process.cwd(), "lib/h1b/h1bLotteryOdds.ts"), "utf8");
const uiSource = readFileSync(join(process.cwd(), "components/H1bLotteryOddsCalculator.tsx"), "utf8");
const wageUiSource = readFileSync(join(process.cwd(), "components/H1bWageLevelEstimator.tsx"), "utf8");

describe("H-1B lottery DHS modeled selection estimates", () => {
  it("uses the approved DHS wage-level estimates and random baseline", () => {
    assert.equal(DHS_MODELED_SELECTION_ESTIMATES.I, 15.29);
    assert.equal(DHS_MODELED_SELECTION_ESTIMATES.II, 30.58);
    assert.equal(DHS_MODELED_SELECTION_ESTIMATES.III, 45.87);
    assert.equal(DHS_MODELED_SELECTION_ESTIMATES.IV, 61.16);
    assert.equal(DHS_MODELED_RANDOM_BASELINE, 29.59);
  });

  it("returns Level I / II / III / IV modeled estimates and signed differences", () => {
    const levelI = calculateH1bLotteryOdds({ wageLevel: "I", usMastersEligible: "no" });
    const levelII = calculateH1bLotteryOdds({ wageLevel: "II", usMastersEligible: "no" });
    const levelIII = calculateH1bLotteryOdds({ wageLevel: "III", usMastersEligible: "no" });
    const levelIV = calculateH1bLotteryOdds({ wageLevel: "IV", usMastersEligible: "no" });

    assert.equal(levelI?.modeledEstimate, 15.29);
    assert.equal(levelI?.differenceFromBaseline, -14.3);
    assert.equal(formatSignedPercentagePoints(levelI!.differenceFromBaseline), "−14.30 percentage points");

    assert.equal(levelII?.modeledEstimate, 30.58);
    assert.equal(levelII?.differenceFromBaseline, 0.99);
    assert.equal(formatSignedPercentagePoints(levelII!.differenceFromBaseline), "+0.99 percentage points");

    assert.equal(levelIII?.modeledEstimate, 45.87);
    assert.equal(levelIII?.differenceFromBaseline, 16.28);
    assert.equal(formatSignedPercentagePoints(levelIII!.differenceFromBaseline), "+16.28 percentage points");

    assert.equal(levelIV?.modeledEstimate, 61.16);
    assert.equal(levelIV?.differenceFromBaseline, 31.57);
    assert.equal(formatSignedPercentagePoints(levelIV!.differenceFromBaseline), "+31.57 percentage points");
  });

  it("does not change the modeled estimate when master's is Yes or No", () => {
    for (const wageLevel of ["I", "II", "III", "IV"] as const) {
      const withoutMasters = calculateH1bLotteryOdds({ wageLevel, usMastersEligible: "no" });
      const withMasters = calculateH1bLotteryOdds({ wageLevel, usMastersEligible: "yes" });
      assert.equal(withMasters?.modeledEstimate, withoutMasters?.modeledEstimate);
      assert.equal(withMasters?.modeledEstimate, DHS_MODELED_SELECTION_ESTIMATES[wageLevel]);
      assert.equal(withMasters?.differenceFromBaseline, withoutMasters?.differenceFromBaseline);
      assert.equal(withMasters?.usMastersEligible, true);
      assert.equal(withoutMasters?.usMastersEligible, false);
    }
  });

  it("does not include a +8 master's boost or a 95% display cap", () => {
    assert.equal(logicSource.includes("US_MASTERS_CAP_BOOST"), false);
    assert.equal(logicSource.includes("MAX_DISPLAYED_ODDS"), false);
    assert.equal(logicSource.includes("mastersCapBoost"), false);
    assert.equal(uiSource.includes("Estimated master"), false);
    assert.equal(uiSource.includes("capped at 95%"), false);
    assert.equal(uiSource.includes("+8"), false);

    const withMasters = calculateH1bLotteryOdds({ wageLevel: "IV", usMastersEligible: "yes" });
    assert.equal(withMasters?.modeledEstimate, 61.16);
    assert.notEqual(withMasters?.modeledEstimate, 69.16);
    assert.equal("mastersCapBoost" in (withMasters ?? {}), false);
  });

  it("does not calculate an estimate when wage level is unknown or invalid", () => {
    assert.equal(calculateH1bLotteryOdds({ wageLevel: "unknown", usMastersEligible: "no" }), null);
    assert.equal(calculateH1bLotteryOdds({ wageLevel: "unknown", usMastersEligible: "yes" }), null);
    assert.equal(parseWageLevelParam(null), "unknown");
    assert.equal(parseWageLevelParam(""), "unknown");
    assert.equal(parseWageLevelParam("V"), "unknown");
    assert.equal(parseWageLevelParam("4"), "unknown");
    assert.equal(calculateH1bLotteryOdds({
      wageLevel: parseWageLevelParam("not-a-level"),
      usMastersEligible: "no",
    }), null);
  });

  it("prepopulates only valid wageLevel query values", () => {
    assert.equal(parseWageLevelParam("I"), "I");
    assert.equal(parseWageLevelParam("ii"), "II");
    assert.equal(parseWageLevelParam(" III "), "III");
    assert.equal(parseWageLevelParam("IV"), "IV");
    assert.equal(uiSource.includes("searchParams.get(\"wageLevel\")"), true);
  });

  it("preserves the Wage → Lottery and Lottery → Wage contracts", () => {
    assert.equal(wageUiSource.includes("/immigration/h1b-lottery-odds-calculator"), true);
    assert.equal(wageUiSource.includes("wageLevel="), true);
    assert.equal(uiSource.includes('const WAGE_ESTIMATOR_HREF = "/immigration/h1b-wage-level-estimator"'), true);
    assert.equal(uiSource.includes("Estimate my wage level"), true);
    assert.equal(uiSource.includes("h1b-wage-level-estimator-v2"), false);
  });

  it("formats zero difference without a plus or minus prefix", () => {
    assert.equal(formatSignedPercentagePoints(0), "0.00 percentage points");
    assert.equal(formatSignedPercentagePoints(-0), "0.00 percentage points");
    assert.equal(formatSignedPercentagePoints(-14.3).includes("+-"), false);
  });
});
