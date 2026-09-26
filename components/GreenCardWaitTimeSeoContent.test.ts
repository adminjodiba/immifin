import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const page = readFileSync(
  join(process.cwd(), "app/calculators/green-card-wait-time/page.tsx"),
  "utf8",
);
const seo = readFileSync(join(process.cwd(), "components/GreenCardWaitTimeSeoContent.tsx"), "utf8");
const calculator = readFileSync(
  join(process.cwd(), "components/GreenCardWaitTimeCalculator.tsx"),
  "utf8",
);
const seoText = seo.replace(/\s+/g, " ");

const seoH2s = [
  "EB-2 and EB-3 India Wait Times",
  "Final Action Dates vs. Dates for Filing",
  "Understanding Visa Bulletin Movement",
  "Green Card Wait Time FAQ",
];

describe("Green Card Wait Time search experience (S7A-SCO-GC-003B)", () => {
  it("keeps the existing title, description, canonical, and index/follow metadata", () => {
    assert.equal(
      page.includes('const PAGE_TITLE = "Employment-Based Green Card Wait Time Calculator"'),
      true,
    );
    assert.equal(
      page.includes(
        "Check where your employment-based priority date stands against the current Visa Bulletin Final Action Date. This is current status, not a prediction of when a Green Card will be approved.",
      ),
      true,
    );
    assert.equal(page.includes("path: PAGE_HREF"), true);
    assert.equal(page.includes('const PAGE_HREF = "/calculators/green-card-wait-time"'), true);
    assert.equal(page.includes("GreenCardWaitTimeSeoContent"), true);
    assert.equal(page.includes("FAQPage"), false);
    assert.equal(page.includes("noindex"), false);
    assert.equal(seo.includes("FAQPage"), false);
    assert.equal(seo.includes("application/ld+json"), false);
  });

  it("uses one approved H1 and keeps H1 out of the SEO article", () => {
    const pageH1Matches = page.match(/<h1\b/g) ?? [];
    const seoH1Matches = seo.match(/<h1\b/g) ?? [];
    const calculatorH1Matches = calculator.match(/<h1\b/g) ?? [];
    assert.equal(pageH1Matches.length, 1);
    assert.equal(seoH1Matches.length, 0);
    assert.equal(calculatorH1Matches.length, 0);
    assert.equal(page.includes('const PAGE_H1 = "Green Card Wait Time Calculator"'), true);
    assert.equal(page.includes("{PAGE_H1}"), true);
  });

  it("server-renders the four approved SEO headings and five FAQ questions", () => {
    for (const heading of seoH2s) {
      assert.equal(seo.includes(heading), true, heading);
    }
    assert.equal(seo.includes("Understand Your Green Card Wait Time"), false);
    assert.equal(seo.includes("How to Use the Calculator"), false);
    assert.equal(seo.includes("How do I check where my green card priority date stands?"), true);
    assert.equal(seo.includes("What does it mean when my priority date is current?"), true);
    assert.equal(
      seo.includes("What is the difference between Final Action Dates and Dates for Filing?"),
      true,
    );
    assert.equal(seo.includes("Why can EB-2 or EB-3 India wait times change?"), true);
    assert.equal(seo.includes("Can the Visa Bulletin move backward?"), true);
    assert.equal(seo.includes("current published Final Action Date"), true);
    assert.equal(seo.includes("GREEN_CARD_WAIT_SEO_DOS_VISA_BULLETIN_HREF"), true);
    assert.equal(seo.includes("GREEN_CARD_WAIT_SEO_USCIS_FILING_CHART_HREF"), true);
  });

  it("keeps current-FAD trust language and does not invent cutoff entry or forecasts", () => {
    assert.equal(/manually enter(?:s)? the(?: relevant)? Visa Bulletin cutoff/i.test(seoText), false);
    assert.equal(/enter the cutoff/i.test(seoText), false);
    assert.equal(seo.includes("Pro-exclusive"), false);
    assert.equal(/only (?:available )?(?:to|for) Pro/i.test(seoText), false);
    assert.equal(seoText.includes("not a future approval date"), true);
    assert.equal(seoText.includes("does not guarantee immediate approval"), true);
    assert.equal(seoText.includes("do not mean a green card can be approved"), true);
    assert.equal(seoText.includes("does not forecast"), true);
    assert.equal(seoText.includes("does not guarantee the next chart"), true);
    assert.equal(seo.includes("checkPriorityDate"), false);
    assert.equal(seo.includes("comparePriorityToBulletin"), false);
    assert.equal(seo.includes("evaluatePriorityAgainstBulletinCutoff"), false);
    assert.equal(seo.includes("FinalActionDates"), false);
    assert.equal(seo.includes("VISA_BULLETIN_GIDS"), false);
    assert.equal(seo.includes("October 15, 2022"), false);
    assert.equal(seo.includes("January 1, 2014"), false);
    assert.equal(seo.includes("January 15, 2015"), false);
    assert.equal(seo.includes("December 1, 2023"), false);
    assert.equal(/\b\d{1,2}\s+years\b/i.test(seo), false);
  });
});
