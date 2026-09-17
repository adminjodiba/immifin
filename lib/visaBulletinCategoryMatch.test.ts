import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  categoryMatchKey,
  evaluatePriorityAgainstBulletinCutoff,
  findMatchingVisaBulletinRow,
} from "./visaBulletinData";

const SHEET_ROWS = [
  { category: "EB-1", country: "India", finalActionDate: "2021-10-15" },
  { category: "EB-2", country: "India", finalActionDate: "2012-03-01" },
  { category: "EB-3", country: "India", finalActionDate: "2011-04-15" },
] as const;

describe("categoryMatchKey equivalent representations", () => {
  it("EB1 ↔ EB-1", () => {
    assert.equal(categoryMatchKey("EB1"), categoryMatchKey("EB-1"));
    assert.equal(categoryMatchKey("EB1"), "eb1");
  });

  it("EB2 ↔ EB-2", () => {
    assert.equal(categoryMatchKey("EB2"), categoryMatchKey("EB-2"));
    assert.equal(categoryMatchKey("EB2"), "eb2");
  });

  it("EB3 ↔ EB-3", () => {
    assert.equal(categoryMatchKey("EB3"), categoryMatchKey("EB-3"));
    assert.equal(categoryMatchKey("EB3"), "eb3");
  });
});

describe("findMatchingVisaBulletinRow profile vs sheet categories", () => {
  it("EB1 finds EB-1", () => {
    const row = findMatchingVisaBulletinRow(SHEET_ROWS, "EB1", "India");
    assert.equal(row?.category, "EB-1");
  });

  it("EB2 finds EB-2", () => {
    const row = findMatchingVisaBulletinRow(SHEET_ROWS, "EB2", "India");
    assert.equal(row?.category, "EB-2");
    assert.equal(row?.finalActionDate, "2012-03-01");
  });

  it("EB3 finds EB-3", () => {
    const row = findMatchingVisaBulletinRow(SHEET_ROWS, "EB3", "India");
    assert.equal(row?.category, "EB-3");
  });

  it("EB-2 also finds the hyphenated sheet row", () => {
    const row = findMatchingVisaBulletinRow(SHEET_ROWS, "EB-2", "India");
    assert.equal(row?.category, "EB-2");
  });
});

describe("October EB-2 India test member eligibility", () => {
  it("FAD 2012-03-01 vs PD 2014-08-14 → waiting", () => {
    const result = evaluatePriorityAgainstBulletinCutoff("2014-08-14", "2012-03-01");
    assert.equal(result.status, "waiting");
    assert.equal(result.cutoffDate, "2012-03-01");
  });

  it("DFF 2012-01-15 vs PD 2014-08-14 → waiting", () => {
    const result = evaluatePriorityAgainstBulletinCutoff("2014-08-14", "2012-01-15");
    assert.equal(result.status, "waiting");
    assert.equal(result.cutoffDate, "2012-01-15");
  });

  it("actual bulletin U remains unavailable", () => {
    const result = evaluatePriorityAgainstBulletinCutoff("2014-08-14", "U");
    assert.equal(result.status, "unavailable");
    assert.equal(result.cutoffDate, "U");
  });
});
