import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBulletinCutoffDate } from "./visaBulletinData";
import {
  compareBulletinMovement,
  formatMovementLabel,
} from "./visaBulletinMovement";

describe("compareBulletinMovement transition matrix", () => {
  it("C → C = no-change", () => {
    const result = compareBulletinMovement("C", "C");
    assert.equal(result.movementType, "no-change");
    assert.equal(result.movementLabel, "No Change");
    assert.equal(result.movementDays, 0);
  });

  it("C → U = unavailable (Became Unavailable)", () => {
    const result = compareBulletinMovement("C", "U");
    assert.equal(result.movementType, "unavailable");
    assert.equal(result.movementLabel, "Became Unavailable");
    assert.equal(result.movementDays, null);
  });

  it("C → Date = cutoff-introduced, no day count", () => {
    const result = compareBulletinMovement("C", "2022-07-01");
    assert.equal(result.movementType, "cutoff-introduced");
    assert.equal(result.movementLabel, "Cutoff Introduced");
    assert.equal(result.movementDays, null);
    assert.equal(result.movementMonths, null);
    assert.notEqual(result.movementType, "invalid");
    assert.notEqual(result.movementLabel, "Invalid date");
  });

  it("U → C = current", () => {
    const result = compareBulletinMovement("U", "C");
    assert.equal(result.movementType, "current");
    assert.equal(result.movementLabel, "Current");
    assert.equal(result.movementDays, null);
  });

  it("U → U = no-change", () => {
    const result = compareBulletinMovement("U", "UNAVAILABLE");
    assert.equal(result.movementType, "no-change");
    assert.equal(result.movementLabel, "No Change");
    assert.equal(result.movementDays, 0);
    assert.equal(result.movementMonths, 0);
    assert.equal(parseBulletinCutoffDate("U"), "U");
    assert.equal(parseBulletinCutoffDate("UNAVAILABLE"), "U");
  });

  it("U → Date = now-available, no day count", () => {
    const result = compareBulletinMovement("U", "2012-03-01");
    assert.equal(result.movementType, "now-available");
    assert.equal(result.movementLabel, "Now Available");
    assert.equal(result.movementDays, null);
    assert.equal(result.movementMonths, null);
    assert.notEqual(result.movementType, "invalid");
    assert.notEqual(result.movementLabel, "Invalid date");
  });

  it("Date → C = current", () => {
    const result = compareBulletinMovement("2021-09-01", "C");
    assert.equal(result.movementType, "current");
    assert.equal(result.movementLabel, "Current");
    assert.equal(result.movementDays, null);
  });

  it("Date → U = unavailable (Became Unavailable)", () => {
    const result = compareBulletinMovement("2021-09-01", "U");
    assert.equal(result.movementType, "unavailable");
    assert.equal(result.movementLabel, "Became Unavailable");
    assert.equal(result.movementDays, null);
  });

  it("Date → same Date = no-change", () => {
    const result = compareBulletinMovement("2021-09-01", "2021-09-01");
    assert.equal(result.movementType, "no-change");
    assert.equal(result.movementLabel, "No Change");
    assert.equal(result.movementDays, 0);
  });

  it("Date → later Date = forward", () => {
    const result = compareBulletinMovement("2012-01-01", "2012-03-01");
    assert.equal(result.movementType, "forward");
    assert.ok((result.movementDays ?? 0) > 0);
  });

  it("Date → earlier Date = retrogression", () => {
    const result = compareBulletinMovement("2023-07-01", "2022-07-01");
    assert.equal(result.movementType, "retrogression");
    assert.ok((result.movementDays ?? 0) < 0);
  });
});

describe("formatMovementLabel", () => {
  it("returns approved special-transition labels", () => {
    assert.equal(formatMovementLabel("now-available", null, null), "Now Available");
    assert.equal(
      formatMovementLabel("cutoff-introduced", null, null),
      "Cutoff Introduced",
    );
    assert.equal(formatMovementLabel("unavailable", null, null), "Became Unavailable");
    assert.equal(formatMovementLabel("current", null, null), "Current");
    assert.equal(formatMovementLabel("no-change", 0, 0), "No Change");
  });
});

describe("Updates Only and No Change KPI predicates", () => {
  function hiddenByUpdatesOnly(movementType: string): boolean {
    return movementType === "no-change";
  }

  it("hides U → U, C → C, and same Date with Updates Only", () => {
    assert.equal(hiddenByUpdatesOnly(compareBulletinMovement("U", "U").movementType), true);
    assert.equal(hiddenByUpdatesOnly(compareBulletinMovement("C", "C").movementType), true);
    assert.equal(
      hiddenByUpdatesOnly(compareBulletinMovement("2021-09-01", "2021-09-01").movementType),
      true,
    );
  });

  it("keeps actual transitions visible under Updates Only", () => {
    const visible = [
      compareBulletinMovement("2012-01-01", "2012-03-01"),
      compareBulletinMovement("2023-07-01", "2022-07-01"),
      compareBulletinMovement("2021-09-01", "C"),
      compareBulletinMovement("C", "2022-07-01"),
      compareBulletinMovement("U", "2012-03-01"),
      compareBulletinMovement("U", "C"),
      compareBulletinMovement("2021-09-01", "U"),
      compareBulletinMovement("C", "U"),
    ];
    for (const result of visible) {
      assert.equal(hiddenByUpdatesOnly(result.movementType), false, result.movementType);
    }
  });

  it("counts U → U in the No Change KPI bucket", () => {
    const rows = [
      compareBulletinMovement("U", "U"),
      compareBulletinMovement("C", "C"),
      compareBulletinMovement("2021-09-01", "2021-09-01"),
      compareBulletinMovement("2021-09-01", "U"),
    ];
    const noChangeCount = rows.filter((row) => row.movementType === "no-change").length;
    assert.equal(noChangeCount, 3);
  });
});

describe("empty-cell parse remains Current", () => {
  it("does not treat empty → U as U → U", () => {
    const result = compareBulletinMovement("", "U");
    assert.equal(result.movementType, "unavailable");
    assert.equal(result.movementLabel, "Became Unavailable");
  });
});
