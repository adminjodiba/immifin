import assert from "node:assert/strict";
import { describe, it } from "node:test";
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

  it("C → U = unavailable", () => {
    const result = compareBulletinMovement("C", "U");
    assert.equal(result.movementType, "unavailable");
    assert.equal(result.movementLabel, "Unavailable");
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

  it("U → U = unavailable", () => {
    const result = compareBulletinMovement("U", "UNAVAILABLE");
    assert.equal(result.movementType, "unavailable");
    assert.equal(result.movementLabel, "Unavailable");
    assert.equal(result.movementDays, null);
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

  it("Date → U = unavailable", () => {
    const result = compareBulletinMovement("2021-09-01", "U");
    assert.equal(result.movementType, "unavailable");
    assert.equal(result.movementLabel, "Unavailable");
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
  });
});
