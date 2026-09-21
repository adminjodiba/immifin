import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  APPROVED_GEOGRAPHY_DATASET_PAIR,
  GEOGRAPHY_DATASET_REASON,
} from "@/lib/h1b/geo/approvedGeographyDatasetPair";
import {
  evaluateApprovedGeographyDatasets,
  type HudVersionCandidate,
  type OflcDatasetCandidate,
} from "@/lib/h1b/geo/geographyDatasetSelection";

const APPROVED_HUD_SHA = "a".repeat(64);
const APPROVED_OFLC_SHA = "b".repeat(64);

function hud(overrides: Partial<HudVersionCandidate> = {}): HudVersionCandidate {
  return {
    versionId: "hud-approved",
    year: APPROVED_GEOGRAPHY_DATASET_PAIR.hud.year,
    quarter: APPROVED_GEOGRAPHY_DATASET_PAIR.hud.quarter,
    packageSha256: APPROVED_HUD_SHA,
    status: "active",
    ...overrides,
  };
}

function oflc(overrides: Partial<OflcDatasetCandidate> = {}): OflcDatasetCandidate {
  return {
    datasetId: "oflc-approved",
    wageYear: APPROVED_GEOGRAPHY_DATASET_PAIR.oflc.wageYear,
    dataSource: APPROVED_GEOGRAPHY_DATASET_PAIR.oflc.dataSource,
    packageSha256: APPROVED_OFLC_SHA,
    status: "active",
    ...overrides,
  };
}

describe("evaluateApprovedGeographyDatasets", () => {
  it("CASE 1: no active HUD → UNAVAILABLE_DATASET_INACTIVE", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud({ status: "imported" })],
      oflcDatasets: [oflc()],
    });
    assert.deepEqual(result, {
      ok: false,
      reasonCode: GEOGRAPHY_DATASET_REASON.INACTIVE,
    });
  });

  it("CASE 2: no active approved-source OFLC → UNAVAILABLE_DATASET_INACTIVE", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud()],
      oflcDatasets: [oflc({ status: "imported" })],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reasonCode, GEOGRAPHY_DATASET_REASON.INACTIVE);
    }
  });

  it("CASE 3: multiple active HUD candidates → UNAVAILABLE_DATASET_INACTIVE", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud(), hud({ versionId: "hud-second" })],
      oflcDatasets: [oflc()],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reasonCode, GEOGRAPHY_DATASET_REASON.INACTIVE);
    }
  });

  it("CASE 4: multiple active All Industries OFLC candidates → UNAVAILABLE_DATASET_INACTIVE", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud()],
      oflcDatasets: [oflc(), oflc({ datasetId: "oflc-second" })],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reasonCode, GEOGRAPHY_DATASET_REASON.INACTIVE);
    }
  });

  it("CASE 5: correct active HUD + incompatible OFLC wage year → UNAVAILABLE_DATASET_INCOMPATIBLE", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud()],
      oflcDatasets: [oflc({ wageYear: "2025-26" })],
    });
    assert.deepEqual(result, {
      ok: false,
      reasonCode: GEOGRAPHY_DATASET_REASON.INCOMPATIBLE,
    });
  });

  it("CASE 6: incompatible HUD year/quarter + correct OFLC → UNAVAILABLE_DATASET_INCOMPATIBLE", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud({ year: 2025, quarter: 4 })],
      oflcDatasets: [oflc()],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reasonCode, GEOGRAPHY_DATASET_REASON.INCOMPATIBLE);
    }
  });

  it("CASE 7: correct HUD + correct OFLC metadata → success with provenance", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud()],
      oflcDatasets: [oflc()],
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.hud, {
        versionId: "hud-approved",
        year: 2026,
        quarter: 2,
        packageSha256: APPROVED_HUD_SHA,
      });
      assert.deepEqual(result.oflc, {
        datasetId: "oflc-approved",
        wageYear: "2026-27",
        dataSource: "All Industries",
        packageSha256: APPROVED_OFLC_SHA,
      });
      assert.deepEqual(result.compatibilityPolicy, APPROVED_GEOGRAPHY_DATASET_PAIR);
    }
  });

  it("CASE 8: approved pair plus unrelated active OFLC data_source still succeeds", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud()],
      oflcDatasets: [
        oflc(),
        oflc({
          datasetId: "oflc-other",
          dataSource: "Healthcare",
          wageYear: "2026-27",
        }),
      ],
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.oflc.datasetId, "oflc-approved");
      assert.equal(result.oflc.dataSource, "All Industries");
    }
  });

  it("CASE 9: only unrelated active OFLC data_source → UNAVAILABLE_DATASET_INACTIVE", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud()],
      oflcDatasets: [
        oflc({
          datasetId: "oflc-other",
          dataSource: "Healthcare",
        }),
      ],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reasonCode, GEOGRAPHY_DATASET_REASON.INACTIVE);
    }
  });

  it("CASE 10: no silent fallback to imported-but-inactive approved datasets", () => {
    const result = evaluateApprovedGeographyDatasets({
      hudVersions: [hud({ status: "imported" })],
      oflcDatasets: [oflc({ status: "imported" })],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reasonCode, GEOGRAPHY_DATASET_REASON.INACTIVE);
    }
  });
});
