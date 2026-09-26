import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareBulletinMovement } from "./visaBulletinMovement";
import {
  getPublicVisaBulletinAnswer,
  PUBLIC_VISA_BULLETIN_HISTORY_LIMIT,
  type PublicVisaBulletinAnswerLoaders,
} from "./visaBulletinPublicAnswer";
import type { BulletinSheetRow } from "./visaBulletinSheets";
import type { VisaBulletinHistoryRecord } from "./visaBulletinHistory";

function sheetRow(
  category: string,
  country: string,
  cutoffDate: string,
): BulletinSheetRow {
  return { category, country, cutoffDate };
}

function historyRecord(
  month: string,
  category: string,
  country: string,
  type: "FinalAction" | "Filing",
  cutoffDate: string,
): VisaBulletinHistoryRecord {
  return { month, category, country, type, cutoffDate };
}

function createLoaders(overrides?: {
  currentFad?: BulletinSheetRow[];
  currentDff?: BulletinSheetRow[];
  previousFad?: BulletinSheetRow[];
  previousDff?: BulletinSheetRow[];
  month?: string | null;
  history?: VisaBulletinHistoryRecord[];
}): PublicVisaBulletinAnswerLoaders {
  const history = overrides?.history ?? [];

  return {
    getCurrentFinalActionDates: async () => overrides?.currentFad ?? [],
    getCurrentDatesForFiling: async () => overrides?.currentDff ?? [],
    getPreviousFinalActionDates: async () => overrides?.previousFad ?? [],
    getPreviousDatesForFiling: async () => overrides?.previousDff ?? [],
    getLatestVisaBulletinMonth: async () => overrides?.month ?? "2026-09",
    getVisaBulletinHistory: async (query) =>
      history.filter((record) => {
        if (query.category && record.category !== query.category) {
          return false;
        }
        if (query.country && record.country !== query.country) {
          return false;
        }
        if (query.type && record.type !== query.type) {
          return false;
        }
        return true;
      }),
  };
}

describe("getPublicVisaBulletinAnswer invalid slugs", () => {
  it("returns null for unsupported category/country slugs", async () => {
    const loaders = createLoaders();

    assert.equal(
      await getPublicVisaBulletinAnswer({ categorySlug: "eb-2", countrySlug: "india" }, { loaders }),
      null,
    );
    assert.equal(
      await getPublicVisaBulletinAnswer({ categorySlug: "EB2", countrySlug: "india" }, { loaders }),
      null,
    );
    assert.equal(
      await getPublicVisaBulletinAnswer({ categorySlug: "eb4", countrySlug: "india" }, { loaders }),
      null,
    );
    assert.equal(
      await getPublicVisaBulletinAnswer({ categorySlug: "eb2", countrySlug: "canada" }, { loaders }),
      null,
    );
    assert.equal(
      await getPublicVisaBulletinAnswer({ categorySlug: "eb2", countrySlug: "row" }, { loaders }),
      null,
    );
  });
});

describe("getPublicVisaBulletinAnswer live-style matching", () => {
  it("matches live-style Eb2 sheet categories through existing normalization", async () => {
    const loaders = createLoaders({
      currentFad: [sheetRow("Eb2", "India", "U")],
      currentDff: [sheetRow("Eb2", "India", "2015-01-15")],
      previousFad: [sheetRow("Eb2", "India", "2014-12-01")],
      previousDff: [sheetRow("Eb2", "India", "2015-01-15")],
    });

    const answer = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb2", countrySlug: "india" },
      { loaders },
    );

    assert.ok(answer);
    assert.equal(answer.category.matchKey, "EB2");
    assert.equal(answer.category.displayLabel, "EB-2");
    assert.equal(answer.fad.current.raw, "U");
    assert.equal(answer.dff.current.raw, "2015-01-15");
  });

  it("maps rest-of-the-world to Rest of the World sheet rows", async () => {
    const loaders = createLoaders({
      currentFad: [sheetRow("EB1", "Rest of the World", "C")],
      currentDff: [sheetRow("EB1", "All", "C")],
      previousFad: [sheetRow("EB1", "ROW", "C")],
      previousDff: [sheetRow("EB1", "Rest of the World", "C")],
    });

    const answer = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb1", countrySlug: "rest-of-the-world" },
      { loaders },
    );

    assert.ok(answer);
    assert.equal(answer.country.matchValue, "Rest of the World");
    assert.equal(answer.fad.current.semanticState, "current");
    assert.equal(answer.dff.current.semanticState, "current");
    assert.equal(answer.fad.previous.semanticState, "current");
  });
});

describe("getPublicVisaBulletinAnswer semantic states", () => {
  it("preserves a dated cutoff without treating it as Current or Unavailable", async () => {
    const loaders = createLoaders({
      currentFad: [sheetRow("EB3", "Philippines", "2015-01-15")],
      currentDff: [sheetRow("EB3", "Philippines", "15 Jan 2015")],
      previousFad: [sheetRow("EB3", "Philippines", "2014-12-15")],
      previousDff: [sheetRow("EB3", "Philippines", "2014-12-15")],
    });

    const answer = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb3", countrySlug: "philippines" },
      { loaders },
    );

    assert.ok(answer);
    assert.equal(answer.fad.current.semanticState, "dated");
    assert.equal(answer.fad.current.parsed, "2015-01-15");
    assert.equal(answer.fad.current.statusLabel, "Waiting Queue");
    assert.equal(answer.fad.current.displayValue, "January 15, 2015");
    assert.equal(answer.dff.current.semanticState, "dated");
    assert.equal(answer.dff.current.parsed, "2015-01-15");
    assert.notEqual(answer.fad.current.semanticState, "current");
    assert.notEqual(answer.fad.current.semanticState, "unavailable");
  });

  it("treats C as Current, not as a date", async () => {
    const loaders = createLoaders({
      currentFad: [sheetRow("EB1", "Mexico", "C")],
      currentDff: [sheetRow("EB1", "Mexico", "CURRENT")],
      previousFad: [sheetRow("EB1", "Mexico", "C")],
      previousDff: [sheetRow("EB1", "Mexico", "C")],
    });

    const answer = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb1", countrySlug: "mexico" },
      { loaders },
    );

    assert.ok(answer);
    assert.equal(answer.fad.current.parsed, "C");
    assert.equal(answer.fad.current.semanticState, "current");
    assert.equal(answer.fad.current.statusLabel, "Current");
    assert.equal(answer.dff.current.parsed, "C");
    assert.doesNotMatch(answer.fad.current.parsed ?? "", /^\d{4}-\d{2}-\d{2}$/);
  });

  it("treats U as Unavailable, not as a date", async () => {
    const loaders = createLoaders({
      currentFad: [sheetRow("EB2", "India", "U")],
      currentDff: [sheetRow("EB2", "India", "UNAVAILABLE")],
      previousFad: [sheetRow("EB2", "India", "2012-03-01")],
      previousDff: [sheetRow("EB2", "India", "2012-01-15")],
    });

    const answer = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb2", countrySlug: "india" },
      { loaders },
    );

    assert.ok(answer);
    assert.equal(answer.fad.current.parsed, "U");
    assert.equal(answer.fad.current.semanticState, "unavailable");
    assert.equal(answer.fad.current.statusLabel, "Unavailable");
    assert.equal(answer.dff.current.parsed, "U");
    assert.doesNotMatch(answer.fad.current.parsed ?? "", /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getPublicVisaBulletinAnswer movement and previous values", () => {
  it("uses compareBulletinMovement and keeps previous when current is U", async () => {
    const loaders = createLoaders({
      currentFad: [sheetRow("EB2", "India", "U")],
      currentDff: [sheetRow("EB2", "India", "2015-01-15")],
      previousFad: [sheetRow("EB2", "India", "2012-03-01")],
      previousDff: [sheetRow("EB2", "India", "2015-01-15")],
    });

    const answer = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb2", countrySlug: "india" },
      { loaders },
    );

    assert.ok(answer);
    assert.equal(answer.fad.previous.raw, "2012-03-01");
    assert.equal(answer.fad.previous.parsed, "2012-03-01");
    assert.equal(answer.fad.current.parsed, "U");

    const expectedFad = compareBulletinMovement("2012-03-01", "U");
    const expectedDff = compareBulletinMovement("2015-01-15", "2015-01-15");

    assert.deepEqual(answer.fad.movement, expectedFad);
    assert.equal(answer.fad.movement?.movementType, "unavailable");
    assert.equal(answer.fad.movement?.movementDays, null);
    assert.deepEqual(answer.dff.movement, expectedDff);
    assert.equal(answer.dff.movement?.movementType, "no-change");
  });

  it("treats U → U as no-change while current cell stays Unavailable", async () => {
    const loaders = createLoaders({
      currentFad: [sheetRow("EB2", "India", "U")],
      currentDff: [sheetRow("EB2", "India", "UNAVAILABLE")],
      previousFad: [sheetRow("EB2", "India", "UNAVAILABLE")],
      previousDff: [sheetRow("EB2", "India", "U")],
    });

    const answer = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb2", countrySlug: "india" },
      { loaders },
    );

    assert.ok(answer);
    assert.equal(answer.fad.current.semanticState, "unavailable");
    assert.equal(answer.fad.movement?.movementType, "no-change");
    assert.equal(answer.fad.movement?.movementLabel, "No Change");
    assert.equal(answer.dff.current.semanticState, "unavailable");
    assert.equal(answer.dff.movement?.movementType, "no-change");
  });
});

describe("getPublicVisaBulletinAnswer history and canonical path", () => {
  it("caps recent history at 6 FAD and 6 DFF points", async () => {
    const fadHistory = Array.from({ length: 10 }, (_, index) =>
      historyRecord(
        `2025-${String(index + 1).padStart(2, "0")}`,
        "EB2",
        "India",
        "FinalAction",
        "U",
      ),
    );
    const dffHistory = Array.from({ length: 9 }, (_, index) =>
      historyRecord(
        `2025-${String(index + 1).padStart(2, "0")}`,
        "EB2",
        "India",
        "Filing",
        "2015-01-15",
      ),
    );

    const loaders = createLoaders({
      currentFad: [sheetRow("EB2", "India", "U")],
      currentDff: [sheetRow("EB2", "India", "2015-01-15")],
      previousFad: [sheetRow("EB2", "India", "U")],
      previousDff: [sheetRow("EB2", "India", "2015-01-15")],
      history: [...fadHistory, ...dffHistory],
    });

    const answer = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb2", countrySlug: "india" },
      { loaders },
    );

    assert.ok(answer);
    assert.equal(PUBLIC_VISA_BULLETIN_HISTORY_LIMIT, 6);
    assert.equal(answer.recentHistory.fad.length, 6);
    assert.equal(answer.recentHistory.dff.length, 6);
    assert.equal(answer.recentHistory.fad[0]?.month, "2025-05");
    assert.equal(answer.recentHistory.fad[5]?.month, "2025-10");
    assert.equal(answer.recentHistory.dff[0]?.month, "2025-04");
    assert.equal(answer.recentHistory.dff[5]?.month, "2025-09");
  });

  it("returns a deterministic canonicalPath", async () => {
    const loaders = createLoaders({
      currentFad: [sheetRow("EB2", "China", "C")],
      currentDff: [sheetRow("EB2", "China", "C")],
      previousFad: [sheetRow("EB2", "China", "C")],
      previousDff: [sheetRow("EB2", "China", "C")],
      month: "2026-09",
    });

    const first = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb2", countrySlug: "china" },
      { loaders },
    );
    const second = await getPublicVisaBulletinAnswer(
      { categorySlug: "eb2", countrySlug: "china" },
      { loaders },
    );

    assert.ok(first);
    assert.ok(second);
    assert.equal(first.canonicalPath, "/immigration/visa-bulletin/eb2/china");
    assert.equal(second.canonicalPath, first.canonicalPath);
    assert.equal(first.bulletin.month, "2026-09");
    assert.equal(first.bulletin.monthShort, "Sep-26");
    assert.equal(first.bulletin.monthLong, "September 2026");
  });
});
