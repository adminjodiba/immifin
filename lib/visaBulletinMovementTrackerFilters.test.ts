import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { VisaBulletinMovementRow } from "./visaBulletinMovement";
import {
  DEFAULT_VISA_BULLETIN_MOVEMENT_TABLE_FILTERS,
  filterVisaBulletinMovementTableRows,
  getVisaBulletinMovementFilterSelection,
} from "./visaBulletinMovementTrackerFilters";

function row(
  movementType: VisaBulletinMovementRow["movementType"],
  category: string,
  country: string,
): VisaBulletinMovementRow {
  return {
    category,
    country,
    previousDate: "2026-09-01",
    currentDate: "2026-10-01",
    movementType,
    movementLabel: movementType,
    movementLabelStyle: movementType === "forward" ? "green" : "neutral",
    movementDays: null,
    movementMonths: null,
  };
}

const OCTOBER_ROWS: VisaBulletinMovementRow[] = [
  row("forward", "EB1", "India"),
  row("forward", "EB1", "China"),
  row("forward", "EB2", "India"),
  row("forward", "EB3", "ROW"),
  row("retrogression", "EB2", "China"),
  row("retrogression", "EB3", "India"),
  row("no-change", "EB1", "Mexico"),
  row("no-change", "EB2", "Mexico"),
  row("no-change", "EB2", "Philippines"),
  row("no-change", "EB3", "China"),
  row("no-change", "EB3", "India"),
];

describe("Visa Bulletin Movement Tracker KPI filter coordination", () => {
  it("changes Updates only to Show All when No Change is selected", () => {
    assert.deepEqual(
      getVisaBulletinMovementFilterSelection("no-change", "updates-only"),
      { movementFilter: "no-change", recordTypeFilter: "show-all" },
    );
  });

  it("makes all five No Change rows available for the October summary fixture", () => {
    const selected = getVisaBulletinMovementFilterSelection("no-change", "updates-only");
    const rows = filterVisaBulletinMovementTableRows(
      OCTOBER_ROWS,
      selected.movementFilter,
      "all",
      "all",
      selected.recordTypeFilter,
    );

    assert.equal(OCTOBER_ROWS.filter((candidate) => candidate.movementType === "forward").length, 4);
    assert.equal(
      OCTOBER_ROWS.filter((candidate) => candidate.movementType === "retrogression").length,
      2,
    );
    assert.equal(OCTOBER_ROWS.filter((candidate) => candidate.movementType === "no-change").length, 5);
    assert.equal(OCTOBER_ROWS.filter((candidate) => candidate.movementType === "current").length, 0);
    assert.equal(rows.length, 5);
    assert.equal(rows.every((candidate) => candidate.movementType === "no-change"), true);
  });

  it("keeps Updates only for Advanced, Retrogressed, and Current", () => {
    for (const movementFilter of ["forward", "retrogression", "current"] as const) {
      assert.deepEqual(
        getVisaBulletinMovementFilterSelection(movementFilter, "updates-only"),
        { movementFilter, recordTypeFilter: "updates-only" },
      );
    }
  });

  it("keeps category and country filters when No Change switches to Show All", () => {
    const selected = getVisaBulletinMovementFilterSelection("no-change", "updates-only");
    const rows = filterVisaBulletinMovementTableRows(
      OCTOBER_ROWS,
      selected.movementFilter,
      "EB3",
      "India",
      selected.recordTypeFilter,
    );

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.category, "EB3");
    assert.equal(rows[0]?.country, "India");
    assert.equal(rows[0]?.movementType, "no-change");
  });

  it("keeps Show All when No Change is toggled off", () => {
    assert.deepEqual(
      getVisaBulletinMovementFilterSelection("all", "show-all"),
      { movementFilter: "all", recordTypeFilter: "show-all" },
    );
  });

  it("keeps Reset Filters defaults explicit", () => {
    assert.deepEqual(DEFAULT_VISA_BULLETIN_MOVEMENT_TABLE_FILTERS, {
      movementFilter: "all",
      categoryFilter: "all",
      countryFilter: "all",
      recordTypeFilter: "updates-only",
    });
  });
});