import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const page = readFileSync(
  join(process.cwd(), "app/immigration/h1b-lottery-odds-calculator/page.tsx"),
  "utf8",
);
const seo = readFileSync(join(process.cwd(), "components/H1bLotteryOddsSeoContent.tsx"), "utf8");
const calculator = readFileSync(join(process.cwd(), "components/H1bLotteryOddsCalculator.tsx"), "utf8");
const logic = readFileSync(join(process.cwd(), "lib/h1b/h1bLotteryOdds.ts"), "utf8");

describe("H-1B lottery SEO content boundary", () => {
  it("keeps the canonical route, product name, and FY2027 wage-weighted metadata", () => {
    assert.equal(page.includes('path: "/immigration/h1b-lottery-odds-calculator"'), true);
    assert.equal(page.includes("H-1B Lottery Odds Calculator | FY2027 Wage-Weighted Selection"), true);
    assert.equal(page.includes("H1bLotteryOddsSeoContent"), true);
    assert.equal(page.includes("FAQPage"), false);
    assert.equal(page.includes("noindex"), false);
  });

  it("publishes the approved DHS table values and 1×/2×/3×/4× weighting", () => {
    assert.equal(seo.includes("15.29") || seo.includes("DHS_MODELED_SELECTION_ESTIMATES"), true);
    assert.equal(seo.includes("DHS_MODELED_SELECTION_ESTIMATES"), true);
    assert.equal(seo.includes("DHS_MODELED_RANDOM_BASELINE"), true);
    assert.equal(seo.includes("1×"), true);
    assert.equal(seo.includes("2×"), true);
    assert.equal(seo.includes("3×"), true);
    assert.equal(seo.includes("4×"), true);
    assert.equal(seo.includes("29.59") || seo.includes("DHS_MODELED_RANDOM_BASELINE"), true);
    assert.equal(seo.includes("+8"), false);
    assert.equal(seo.includes("US_MASTERS_CAP_BOOST"), false);
    assert.equal(seo.includes("FAQPage"), false);
  });

  it("links the canonical Wage Estimator and does not invent a master's probability", () => {
    assert.equal(seo.includes('href={WAGE_ESTIMATOR_HREF}'), true);
    assert.equal(seo.includes('"/immigration/h1b-wage-level-estimator"'), true);
    assert.equal(seo.includes("advanced-degree exemption"), true);
    assert.equal(seo.includes("does not add a"), true);
    assert.equal(seo.includes("made-up percentage"), true);
    assert.equal(seo.includes("h1b-wage-level-estimator-v2"), false);
  });

  it("does not change frozen calculator logic or the interactive calculator card", () => {
    assert.equal(logic.includes("I: 15.29"), true);
    assert.equal(logic.includes("II: 30.58"), true);
    assert.equal(logic.includes("III: 45.87"), true);
    assert.equal(logic.includes("IV: 61.16"), true);
    assert.equal(logic.includes("DHS_MODELED_RANDOM_BASELINE = 29.59"), true);
    assert.equal(calculator.includes("DHS Modeled Selection Estimate"), true);
    assert.equal(calculator.includes("H1bLotteryOddsSeoContent"), false);
  });
});
