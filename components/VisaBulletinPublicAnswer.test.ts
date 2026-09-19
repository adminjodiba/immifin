import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { compareBulletinMovement } from "@/lib/visaBulletinMovement";
import type { PublicVisaBulletinAnswer } from "@/lib/visaBulletinPublicAnswer";
import { listPublicVisaBulletinCombinations } from "@/lib/visaBulletinPublicSlugs";
import { VisaBulletinPublicAnswer } from "./VisaBulletinPublicAnswer";

function fixtureAnswer(): PublicVisaBulletinAnswer {
  return {
    category: { slug: "eb2", matchKey: "EB2", displayLabel: "EB-2" },
    country: { slug: "india", matchValue: "India", displayLabel: "India" },
    bulletin: {
      month: "2026-09",
      monthShort: "Sep-26",
      monthLong: "September 2026",
    },
    fad: {
      current: {
        raw: "U",
        parsed: "U",
        semanticState: "unavailable",
        statusLabel: "Unavailable",
        displayValue: "Unavailable",
      },
      previous: {
        raw: "2012-03-01",
        parsed: "2012-03-01",
        semanticState: "dated",
        statusLabel: "Waiting Queue",
        displayValue: "March 1, 2012",
      },
      movement: compareBulletinMovement("2012-03-01", "U"),
    },
    dff: {
      current: {
        raw: "2015-01-15",
        parsed: "2015-01-15",
        semanticState: "dated",
        statusLabel: "Waiting Queue",
        displayValue: "January 15, 2015",
      },
      previous: {
        raw: "2015-01-15",
        parsed: "2015-01-15",
        semanticState: "dated",
        statusLabel: "Waiting Queue",
        displayValue: "January 15, 2015",
      },
      movement: compareBulletinMovement("2015-01-15", "2015-01-15"),
    },
    recentHistory: {
      fad: [
        {
          month: "2026-04",
          monthShort: "Apr-26",
          monthLong: "April 2026",
          raw: "U",
          parsed: "U",
          semanticState: "unavailable",
          statusLabel: "Unavailable",
          displayValue: "Unavailable",
        },
        {
          month: "2026-09",
          monthShort: "Sep-26",
          monthLong: "September 2026",
          raw: "U",
          parsed: "U",
          semanticState: "unavailable",
          statusLabel: "Unavailable",
          displayValue: "Unavailable",
        },
      ],
      dff: [
        {
          month: "2026-04",
          monthShort: "Apr-26",
          monthLong: "April 2026",
          raw: "2015-01-15",
          parsed: "2015-01-15",
          semanticState: "dated",
          statusLabel: "Waiting Queue",
          displayValue: "January 15, 2015",
        },
        {
          month: "2026-09",
          monthShort: "Sep-26",
          monthLong: "September 2026",
          raw: "2015-01-15",
          parsed: "2015-01-15",
          semanticState: "dated",
          statusLabel: "Waiting Queue",
          displayValue: "January 15, 2015",
        },
      ],
    },
    canonicalPath: "/immigration/visa-bulletin/eb2/india",
  };
}

describe("VisaBulletinPublicAnswer template", () => {
  it("renders the search-answer hierarchy in initial HTML", () => {
    const html = renderToStaticMarkup(
      createElement(VisaBulletinPublicAnswer, { answer: fixtureAnswer() }),
    );

    assert.match(html, /<h1[^>]*>EB-2 India Priority Date and Visa Bulletin<\/h1>/);
    assert.match(html, /Current Visa Bulletin/);
    assert.match(html, /September 2026/);
    assert.match(html, /Final Action Date/);
    assert.match(html, /Unavailable/);
    assert.match(html, /Date for Filing/);
    assert.match(html, /January 15, 2015/);
    assert.match(html, /What Changed This Month\?/);
    assert.match(html, /March 1, 2012/);
    assert.match(html, /Recent EB-2 India Visa Bulletin Dates/);
    assert.match(html, /Understanding the Visa Bulletin/);
    assert.match(html, /Explore Visa Bulletin by Category and Country/);
    assert.match(html, /View Full Visa Bulletin Dashboard/);
    assert.match(html, /href="\/immigration\/visa-bulletin"/);
    assert.match(html, /Calculate Green Card Wait/);
    assert.match(html, /href="\/calculators\/green-card-wait-time"/);
    assert.doesNotMatch(html, /Visa Bulletin Dashboard2|FavoriteStar|Loading visa bulletin data/);

    const understandPos = html.indexOf("Understanding the Visa Bulletin");
    const explorePos = html.indexOf("Explore Visa Bulletin by Category and Country");
    const ctaPos = html.indexOf("Continue with IMMIFIN");
    assert.ok(understandPos >= 0 && explorePos > understandPos && ctaPos > explorePos);
  });

  it("renders 15 canonical Explore links grouped by category", () => {
    const html = renderToStaticMarkup(
      createElement(VisaBulletinPublicAnswer, { answer: fixtureAnswer() }),
    );
    const combinations = listPublicVisaBulletinCombinations();

    assert.equal(combinations.length, 15);
    assert.equal((html.match(/<h3[^>]*>EB-[123]<\/h3>/g) ?? []).length, 3);

    for (const combination of combinations) {
      assert.match(html, new RegExp(`href="${combination.canonicalPath}"`));
    }

    const currentTag = [...html.matchAll(/<a\b[^>]*>/g)]
      .map((match) => match[0])
      .find((tag) => tag.includes('href="/immigration/visa-bulletin/eb2/india"'));
    assert.ok(currentTag?.includes('aria-current="page"'));
    assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  });

  it("moves the current-page indicator with the active combination", () => {
    const chinaAnswer: PublicVisaBulletinAnswer = {
      ...fixtureAnswer(),
      category: { slug: "eb1", matchKey: "EB1", displayLabel: "EB-1" },
      country: { slug: "china", matchValue: "China", displayLabel: "China" },
    };
    const html = renderToStaticMarkup(
      createElement(VisaBulletinPublicAnswer, { answer: chinaAnswer }),
    );
    const tags = [...html.matchAll(/<a\b[^>]*>/g)].map((match) => match[0]);
    const chinaTag = tags.find((tag) =>
      tag.includes('href="/immigration/visa-bulletin/eb1/china"'),
    );
    const indiaTag = tags.find((tag) =>
      tag.includes('href="/immigration/visa-bulletin/eb2/india"'),
    );
    assert.ok(chinaTag?.includes('aria-current="page"'));
    assert.equal(indiaTag?.includes('aria-current="page"'), false);
  });

  it("does not invent a day delta when current FAD is Unavailable", () => {
    const html = renderToStaticMarkup(
      createElement(VisaBulletinPublicAnswer, { answer: fixtureAnswer() }),
    );

    assert.match(html, /Movement/);
    assert.match(html, />Unavailable</);
    assert.doesNotMatch(html, /\+\d+ Months|\-\d+ Months/);
  });
});
