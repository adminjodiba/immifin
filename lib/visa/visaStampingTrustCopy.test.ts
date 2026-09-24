import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  getPetitionBasedWaitEstimateNote,
  PETITION_BASED_WAIT_ESTIMATE_NOTE,
  PETITION_BASED_WAIT_ESTIMATE_NOTE_GENERIC,
  VISA_STAMPING_PAGE_SUBTITLE,
  VISA_STAMPING_UI_APPOINTMENT_TYPES,
  VISA_STAMPING_VISA_TYPES,
} from "./visaStampingWaitTimes";

const waitMap = readFileSync(join(process.cwd(), "components/VisaStampingWaitMap.tsx"), "utf8");
const page = readFileSync(
  join(process.cwd(), "app/immigration/visa-stamping-wait-map/page.tsx"),
  "utf8",
);

describe("Visa Stamping trust copy (S7A-VISA-STAMP-TRUST-006)", () => {
  it("removes Real-time claims from page subtitle and wait-map copy", () => {
    assert.equal(VISA_STAMPING_PAGE_SUBTITLE.includes("Real-time"), false);
    assert.equal(VISA_STAMPING_PAGE_SUBTITLE.includes("Department of State"), true);
    assert.equal(VISA_STAMPING_PAGE_SUBTITLE.includes("appointment wait-time estimates"), true);
    assert.equal(waitMap.includes("Real-time"), false);
    assert.equal(page.includes("Real-time"), false);
  });

  it("keeps H-1B as a user-facing visa selection", () => {
    assert.equal(VISA_STAMPING_VISA_TYPES.includes("H-1B"), true);
    assert.equal(waitMap.includes("VISA_STAMPING_VISA_TYPES"), true);
    assert.equal(waitMap.includes('aria-label="Filter by visa type"'), true);
  });

  it("explains H-1B results as the DOS petition-based H/L/O/P/Q estimate", () => {
    assert.equal(
      getPetitionBasedWaitEstimateNote("H-1B"),
      PETITION_BASED_WAIT_ESTIMATE_NOTE,
    );
    assert.equal(
      PETITION_BASED_WAIT_ESTIMATE_NOTE,
      "For H-1B, IMMIFIN displays the Department of State's published petition-based (H, L, O, P, Q) appointment wait estimate.",
    );
    assert.equal(getPetitionBasedWaitEstimateNote("L-1"), PETITION_BASED_WAIT_ESTIMATE_NOTE_GENERIC);
    assert.equal(getPetitionBasedWaitEstimateNote("B-1/B-2"), null);
    assert.equal(waitMap.includes("getPetitionBasedWaitEstimateNote"), true);
    assert.equal(waitMap.includes("Wait Time H,L,O,P,Q"), false);
  });

  it("does not offer Drop-box as a user-selectable appointment type", () => {
    assert.deepEqual([...VISA_STAMPING_UI_APPOINTMENT_TYPES], ["Interview"]);
    assert.equal(waitMap.includes('aria-label="Filter by appointment type"'), false);
    assert.equal(waitMap.includes("VISA_STAMPING_APPOINTMENT_TYPES.map"), false);
    assert.equal(waitMap.includes("handleAppointmentTypeChange"), false);
  });
});
