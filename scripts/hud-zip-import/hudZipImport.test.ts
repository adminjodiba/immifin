import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertDevOnlyTarget, classifyProjectRef } from "../oflc-wage-import/targetGuard";
import { reconcileOrderedWageKeys } from "../oflc-wage-import/wageReconcile";
import { EXPECTED_HUD_COUNTS, EXPECTED_HUD_PACKAGE_SHA256, HUD_CROSSWALK_BATCH_SIZE } from "./constants";
import { buildHudLoadPlan, buildHudTableBatches, evaluateHudRerun } from "./loadPlan";
import { assertHudSchemaShape, parseHudZipCountyWorkbook } from "./parseHudWorkbook";
import {
  AUTHORIZED_HUD_RESUME_BATCHES,
  AUTHORIZED_HUD_RESUME_OFFSET,
  AUTHORIZED_HUD_RESUME_REMAINING,
  classifyHudBatchPresence,
  evaluateHudResume,
  remainingHudResumeBatches,
  resumeWouldWriteParents,
} from "./resumeHudDev";
import {
  applyApprovedHudLoad,
  applyApprovedHudResume,
  assertHudWriteSql,
  buildVersionInsertSql,
  HUD_VERSION_INSERT_COLUMNS,
  HUD_WRITE_ENABLED_IN_BUILD,
  proveHudCrosswalkInsertPayload,
  resetHudMutationPaths,
} from "./sqlPlan";
import { EXPECTED_HUD_ZIP_COUNTY_Q2_2026, HUD_USPS_ZIP_COUNTY_SOURCE } from "./types";
import type { HudImportResult, ZipCountyCrosswalkRecord } from "./types";
import { headerMatchesOfficial, parseHudWorksheetXml, type HudSheetRow } from "./xlsx";

const HEADER = [...EXPECTED_HUD_ZIP_COUNTY_Q2_2026.columns];

function row(
  zip: string,
  geoid: string,
  city: string,
  state: string,
  res: string,
  bus: string,
  oth: string,
  tot: string
): HudSheetRow {
  return { zip, geoid, city, state, res_ratio: res, bus_ratio: bus, oth_ratio: oth, tot_ratio: tot };
}

describe("xlsx header/parser", () => {
  it("accepts official HUD column names", () => {
    assert.equal(headerMatchesOfficial(HEADER), true);
    assert.equal(headerMatchesOfficial(["zip", "county"]), false);
  });

  it("parses inlineStr ZIP text so leading zeros survive", () => {
    const xml = `<?xml version="1.0"?><worksheet><sheetData>
      <row><c r="A1" t="inlineStr"><is><t>zip</t></is></c><c r="B1" t="inlineStr"><is><t>geoid</t></is></c><c r="C1" t="inlineStr"><is><t>city</t></is></c><c r="D1" t="inlineStr"><is><t>state</t></is></c><c r="E1" t="inlineStr"><is><t>res_ratio</t></is></c><c r="F1" t="inlineStr"><is><t>bus_ratio</t></is></c><c r="G1" t="inlineStr"><is><t>oth_ratio</t></is></c><c r="H1" t="inlineStr"><is><t>tot_ratio</t></is></c></row>
      <row><c r="A2" t="inlineStr"><is><t>00501</t></is></c><c r="B2" t="inlineStr"><is><t>36103</t></is></c><c r="C2" t="inlineStr"><is><t>HOLTSVILLE</t></is></c><c r="D2" t="inlineStr"><is><t>NY</t></is></c><c r="E2"><v>0</v></c><c r="F2"><v>1</v></c><c r="G2"><v>0</v></c><c r="H2"><v>1</v></c></row>
    </sheetData></worksheet>`;
    const parsed = parseHudWorksheetXml(xml);
    assert.deepEqual(parsed.header, HEADER);
    assert.equal(parsed.rows[0].zip, "00501");
    assert.equal(parsed.rows[0].geoid, "36103");
  });
});

describe("parseHudZipCountyWorkbook", () => {
  it("keeps both official rows for a multi-county ZIP including BUS_RATIO 0", () => {
    const result = parseHudZipCountyWorkbook({
      filename: "sample.xlsx",
      packageSha256: "b".repeat(64),
      header: HEADER,
      validateOfficialIdentity: false,
      validateFixtures: false,
      rows: [
        row("76945", "48081", "ROBERT LEE", "TX", "0.9952606635", "1", "1", "0.9954128440"),
        row("76945", "48451", "ROBERT LEE", "TX", "0.0047393365", "0", "0", "0.0045871560"),
      ],
    });
    assert.equal(result.ok, true);
    assert.equal(result.rows.length, 2);
    assert.equal(result.counts.multiCountyZips, 1);
    assert.equal(result.counts.zeroBusRatioRows, 1);
    assert.equal(result.rows[1].bus_ratio, 0);
    assert.equal(result.rows[0].zip, "76945");
    assert.equal(typeof result.rows[0].zip, "string");
    assert.equal(result.rows[0].source, HUD_USPS_ZIP_COUNTY_SOURCE);
    assert.deepEqual(assertHudSchemaShape(result), []);
  });

  it("preserves leading-zero ZIP and FIPS text", () => {
    const result = parseHudZipCountyWorkbook({
      filename: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename,
      packageSha256: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256,
      header: HEADER,
      validateFixtures: false,
      rows: [
        row("00501", "36103", "HOLTSVILLE", "NY", "0", "1", "0", "1"),
        row("00601", "72001", "ADJUNTAS", "PR", "0.99", "0.99", "0.98", "0.99"),
        row("07030", "34017", "HOBOKEN", "NJ", "1", "1", "1", "1"),
      ],
    });
    assert.equal(result.rows.map((r) => r.zip).join(","), "00501,00601,07030");
    assert.equal(result.rows[2].county_fips, "34017");
  });

  it("fails closed on duplicate keys, malformed ZIP/FIPS, and out-of-range ratios", () => {
    const result = parseHudZipCountyWorkbook({
      filename: "sample.xlsx",
      packageSha256: "c".repeat(64),
      header: HEADER,
      validateOfficialIdentity: false,
      validateFixtures: false,
      rows: [
        row("77433", "48201", "CYPRESS", "TX", "1", "1", "1", "1"),
        row("77433", "48201", "CYPRESS", "TX", "1", "1", "1", "1"),
        row("501", "ABCD", "BAD", "NY", "2", "-0.1", "0", "1"),
      ],
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "duplicate_key"));
    assert.ok(result.issues.some((i) => i.code === "malformed_zip"));
    assert.ok(result.issues.some((i) => i.code === "malformed_fips"));
    assert.ok(result.issues.some((i) => i.code === "ratio_out_of_bounds"));
  });

  it("does not drop a second county when BUS_RATIO is zero", () => {
    const result = parseHudZipCountyWorkbook({
      filename: "sample.xlsx",
      packageSha256: "d".repeat(64),
      header: HEADER,
      validateOfficialIdentity: false,
      validateFixtures: false,
      rows: [
        row("77031", "48201", "HOUSTON", "TX", "0.9987804878", "0.9557522124", "0.9824561404", "0.9951650780"),
        row("77031", "48157", "HOUSTON", "TX", "0.0012195122", "0.0442477876", "0.0175438596", "0.0048349220"),
      ],
    });
    assert.equal(result.rows.length, 2);
    assert.equal(result.counts.maxCountiesPerZip, 2);
    assert.ok(!result.rows.some((r) => "resolution" in r));
  });

  it("pads short official GEOID placeholders to 5-character FIPS without dropping the row", () => {
    const result = parseHudZipCountyWorkbook({
      filename: "sample.xlsx",
      packageSha256: "f".repeat(64),
      header: HEADER,
      validateOfficialIdentity: false,
      validateFixtures: false,
      rows: [row("77352", "48", "LIVINGSTON", "TX", "1", "1", "1", "1")],
    });
    assert.equal(result.ok, true);
    assert.equal(result.rows[0].county_fips, "00048");
    assert.ok(result.issues.some((i) => i.code === "fips_padded"));
  });

  it("fails official identity when SHA-256 differs", () => {
    const result = parseHudZipCountyWorkbook({
      filename: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename,
      packageSha256: "e".repeat(64),
      header: HEADER,
      validateFixtures: false,
      rows: [row("77433", "48201", "CYPRESS", "TX", "1", "1", "1", "1")],
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "sha256_mismatch"));
  });
});

const DEV_REF = "vnhnxxxxxxxxxxxxxxxxxxxxtoxs";
const PROD_REF = "pmkxxxxxxxxxxxxxxxxxxxxysdv";

function sampleCrosswalk(index: number): ZipCountyCrosswalkRecord {
  return {
    crosswalk_version: "1175d049-6ea6-4ec6-8571-ce47adb63502",
    zip: String(10000 + (index % 90000)).padStart(5, "0"),
    county_fips: String(48000 + (index % 100)).padStart(5, "0"),
    res_ratio: 1,
    bus_ratio: index % 7 === 0 ? 0 : 1,
    oth_ratio: 1,
    tot_ratio: 1,
    pref_city: "CYPRESS",
    pref_state: "TX",
    source: HUD_USPS_ZIP_COUNTY_SOURCE,
    hud_year: 2026,
    hud_quarter: 2,
  };
}

function officialHudResult(): HudImportResult {
  const rows = { length: EXPECTED_HUD_COUNTS.rows } as HudImportResult["rows"];
  return {
    ok: true,
    version: {
      id: "1175d049-6ea6-4ec6-8571-ce47adb63502",
      hud_year: 2026,
      hud_quarter: 2,
      census_gazetteer_vintage: "2026",
      package_sha256: EXPECTED_HUD_PACKAGE_SHA256,
      status: "imported",
      imported_at: null,
      unmatched_locality_count: 8,
      validation_report: {},
    },
    rows,
    issues: [],
    counts: {
      rows: EXPECTED_HUD_COUNTS.rows,
      uniqueZips: EXPECTED_HUD_COUNTS.uniqueZips,
      uniqueCountyFips: EXPECTED_HUD_COUNTS.uniqueCountyFips,
      multiCountyZips: EXPECTED_HUD_COUNTS.multiCountyZips,
      maxCountiesPerZip: EXPECTED_HUD_COUNTS.maxCountiesPerZip,
      zeroBusRatioRows: EXPECTED_HUD_COUNTS.zeroBusRatioRows,
      busResPrimaryDiffer: EXPECTED_HUD_COUNTS.busResPrimaryDiffer,
      duplicateSourceKeys: 0,
      malformedZips: 0,
      placeholderGeoidRows: EXPECTED_HUD_COUNTS.placeholderGeoidRows,
      placeholderGeoids: ["00048", "00060", "00064", "00068", "00070"],
    },
    fixtures: {},
    leadingZeroFixtures: {},
    join: null,
  };
}

describe("HUD load readiness", () => {
  it("requires the exact official source SHA and 54570 rows", () => {
    const plan = buildHudLoadPlan(officialHudResult());
    assert.equal(plan.ok, true);
    assert.equal(plan.packageSha256, EXPECTED_HUD_PACKAGE_SHA256);
    assert.equal(plan.totals.zip_county_crosswalk, 54570);
    assert.equal(plan.write, false);
    assert.equal(plan.activate, false);
    assert.equal(plan.populateCountyFipsNames, false);
    assert.equal(plan.datasetStatus, "imported");
    assert.equal(plan.version.status, "imported");
    assert.equal(plan.version.census_gazetteer_vintage, null);
  });

  it("plans conservative 1000-row crosswalk batches covering every official row", () => {
    const batches = buildHudTableBatches("zip_county_crosswalk", 54570, HUD_CROSSWALK_BATCH_SIZE, 1);
    assert.equal(HUD_CROSSWALK_BATCH_SIZE, 1000);
    assert.equal(batches.length, 55);
    assert.equal(batches[0]?.count, 1000);
    assert.equal(batches[54]?.count, 570);
    assert.equal(batches.reduce((sum, batch) => sum + batch.count, 0), 54570);
  });

  it("rejects the same SHA on rerun and does not create a second version", () => {
    const existing = [
      { id: "11111111-1111-4111-8111-111111111111", package_sha256: EXPECTED_HUD_PACKAGE_SHA256, status: "imported" },
    ];
    const decision = evaluateHudRerun(existing, EXPECTED_HUD_PACKAGE_SHA256);
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "reject-duplicate");
    const plan = buildHudLoadPlan(officialHudResult(), existing);
    assert.equal(plan.ok, false);
  });

  it("defaults to Dev-only no-write and hard-blocks Production and unknown targets", () => {
    const ok = assertDevOnlyTarget({ explicitTarget: "dev", projectRef: DEV_REF, write: false });
    assert.equal(ok.ok, true);
    assert.equal(ok.mode, "no-write");
    const prod = assertDevOnlyTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: HUD_WRITE_ENABLED_IN_BUILD,
    });
    assert.equal(prod.ok, false);
    assert.equal(prod.rejectProduction, true);
    assert.equal(classifyProjectRef(PROD_REF), "production");
    const unknown = assertDevOnlyTarget({ explicitTarget: "staging", projectRef: "abcdxxxxxxxxxxxxxxxxxxxxwxyz" });
    assert.equal(unknown.ok, false);
    const write = assertDevOnlyTarget({
      explicitTarget: "dev",
      projectRef: DEV_REF,
      write: true,
      writeEnabledInBuild: HUD_WRITE_ENABLED_IN_BUILD,
    });
    assert.equal(HUD_WRITE_ENABLED_IN_BUILD, true);
    assert.equal(write.ok, true);
    assert.equal(write.mode, "write");
    assert.equal(
      assertDevOnlyTarget({ explicitTarget: "dev", projectRef: DEV_REF, write: false, writeEnabledInBuild: true }).mode,
      "no-write"
    );
  });

  it("forbids OFLC and county_fips_names writes and never activates", () => {
    assert.throws(() => assertHudWriteSql("insert into public.oflc_occupations default values"));
    assert.throws(() => assertHudWriteSql("insert into public.wage_datasets default values"));
    assert.throws(() => assertHudWriteSql("insert into public.county_fips_names default values"));
    assert.throws(() =>
      assertHudWriteSql("insert into public.zip_crosswalk_versions (status) values ('active')")
    );
    const versionSql = buildVersionInsertSql(officialHudResult().version);
    assert.equal(versionSql.toLowerCase().includes("'active'"), false);
    assert.equal(HUD_VERSION_INSERT_COLUMNS.includes("resolution_policy" as never), false);
    assert.equal(/resolution_policy/i.test(versionSql.split(/\bvalues\b/i)[0] ?? ""), false);
  });

  it("rejects a pre-existing HUD version even when the SHA differs", () => {
    const existing = [
      { id: "11111111-1111-4111-8111-111111111111", package_sha256: "a".repeat(64), status: "imported" },
    ];
    const decision = evaluateHudRerun(existing, EXPECTED_HUD_PACKAGE_SHA256);
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "reject-existing");
  });

  it("stops subsequent batches after a write failure and does not retry", () => {
    resetHudMutationPaths();
    const rows = [sampleCrosswalk(0), sampleCrosswalk(1)];
    const result = officialHudResult();
    result.rows = rows as typeof result.rows;
    const batches = [
      { table: "zip_county_crosswalk" as const, index: 1, start: 0, count: 1 },
      { table: "zip_county_crosswalk" as const, index: 2, start: 1, count: 1 },
    ];
    let insertCalls = 0;
    const written = applyApprovedHudLoad(result.version, rows, batches, {
      assertAbsent: () => 0,
      assertPresent: (batchRows) => batchRows.length,
      onBatch: () => {},
      insertVersion: () => {},
      insertBatch: () => {
        insertCalls += 1;
        if (insertCalls === 1) throw new Error("category=payload");
      },
    });
    assert.equal(written.ok, false);
    if (written.ok) throw new Error("expected failure");
    assert.equal(insertCalls, 1);
    assert.equal(written.completed.length, 1);
    assert.equal(written.failed.batchIndex, 1);
  });

  it("preserves BUS_RATIO=0, multi-county, leading zeros, and ratios with no winner-selection", () => {
    const result = parseHudZipCountyWorkbook({
      filename: "sample.xlsx",
      packageSha256: "b".repeat(64),
      header: HEADER,
      validateOfficialIdentity: false,
      validateFixtures: false,
      rows: [
        row("76945", "48081", "ROBERT LEE", "TX", "0.9952606635", "1", "1", "0.9954128440"),
        row("76945", "48451", "ROBERT LEE", "TX", "0.0047393365", "0", "0", "0.0045871560"),
        row("00501", "36103", "HOLTSVILLE", "NY", "0", "1", "0", "1"),
      ],
    });
    assert.equal(result.rows.length, 3);
    assert.equal(result.counts.zeroBusRatioRows, 1);
    assert.equal(result.counts.multiCountyZips, 1);
    assert.equal(result.rows[1].bus_ratio, 0);
    assert.equal(result.rows[2].zip, "00501");
    assert.equal(result.rows[0].res_ratio, 0.9952606635);
    assert.ok(!result.rows.some((item) => "resolution" in item));
  });

  it("pads official placeholder GEOIDs instead of dropping them", () => {
    const result = parseHudZipCountyWorkbook({
      filename: "sample.xlsx",
      packageSha256: "f".repeat(64),
      header: HEADER,
      validateOfficialIdentity: false,
      validateFixtures: false,
      rows: [row("77352", "48", "LIVINGSTON", "TX", "1", "1", "1", "1")],
    });
    assert.equal(result.rows[0].county_fips, "00048");
    assert.equal(result.counts.placeholderGeoidRows, 1);
    assert.deepEqual(result.counts.placeholderGeoids, ["00048"]);
  });

  it("proves a 1000-row HUD INSERT payload stays a single approved statement", () => {
    const proof = proveHudCrosswalkInsertPayload(Array.from({ length: 1000 }, (_, i) => sampleCrosswalk(i)));
    assert.equal(proof.ok, true);
    assert.equal(proof.rowCount, 1000);
    assert.equal(proof.kind, "insert");
    assert.equal(proof.multipleStatements, false);
    assert.ok(proof.byteLength > 0);
    assert.ok(proof.byteLength < 400000);
  });
});

describe("HUD resume gates and recovery", () => {
  const sourceKeys = Array.from({ length: 54570 }, (_, i) => `z${String(i).padStart(5, "0")}|c${String(i).padStart(5, "0")}`);
  const prefixKeys = sourceKeys.slice(0, AUTHORIZED_HUD_RESUME_OFFSET);
  const reconciled = reconcileOrderedWageKeys(sourceKeys, prefixKeys);
  const existingId = "11111111-1111-4111-8111-111111111111";
  const base = {
    resumeRequested: true,
    writeRequested: true,
    explicitTarget: "dev",
    targetKind: "dev" as const,
    packageSha256: EXPECTED_HUD_PACKAGE_SHA256,
    expectedSha256: EXPECTED_HUD_PACKAGE_SHA256,
    existingVersionId: existingId,
    requiredVersionId: existingId,
    existingStatus: "imported",
    existingActive: false,
    matchingShaCount: 1,
    versionCount: 1,
    countyFipsNames: 0,
    reconciled,
    requiredOffset: AUTHORIZED_HUD_RESUME_OFFSET,
  };

  it("requires explicit resume intent, write, and Dev", () => {
    assert.equal(evaluateHudResume(base).ok, true);
    assert.ok(evaluateHudResume({ ...base, resumeRequested: false }).issues.includes("resume_intent_required"));
    assert.ok(evaluateHudResume({ ...base, writeRequested: false }).issues.includes("resume_requires_write"));
    assert.ok(evaluateHudResume({ ...base, explicitTarget: "staging" }).issues.includes("resume_requires_dev_target"));
    const write = assertDevOnlyTarget({
      explicitTarget: "dev",
      projectRef: DEV_REF,
      write: true,
      writeEnabledInBuild: HUD_WRITE_ENABLED_IN_BUILD,
    });
    assert.equal(write.ok, true);
    assert.equal(write.mode, "write");
    assert.equal(
      assertDevOnlyTarget({ explicitTarget: "dev", projectRef: DEV_REF, write: false, writeEnabledInBuild: true }).mode,
      "no-write"
    );
  });

  it("rejects Production and unknown resume targets", () => {
    assert.ok(
      evaluateHudResume({ ...base, explicitTarget: "production", targetKind: "production" }).issues.includes(
        "production_resume_rejected"
      )
    );
    const prod = assertDevOnlyTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: HUD_WRITE_ENABLED_IN_BUILD,
    });
    assert.equal(prod.ok, false);
    assert.equal(prod.rejectProduction, true);
    assert.equal(classifyProjectRef(PROD_REF), "production");
    assert.ok(evaluateHudResume({ ...base, targetKind: "unknown" }).issues.includes("resume_requires_dev"));
    assert.equal(
      assertDevOnlyTarget({ explicitTarget: "staging", projectRef: "abcdxxxxxxxxxxxxxxxxxxxxwxyz" }).ok,
      false
    );
  });

  it("requires the exact official SHA and existing imported version", () => {
    assert.ok(evaluateHudResume({ ...base, packageSha256: "a".repeat(64) }).issues.includes("wrong_package_sha"));
    assert.ok(evaluateHudResume({ ...base, existingVersionId: null }).issues.includes("existing_version_id_required"));
    assert.ok(
      evaluateHudResume({ ...base, requiredVersionId: "22222222-2222-4222-8222-222222222222" }).issues.includes(
        "wrong_version"
      )
    );
    assert.ok(evaluateHudResume({ ...base, matchingShaCount: 2 }).issues.includes("matching_sha_count_rejected"));
    assert.ok(evaluateHudResume({ ...base, versionCount: 2 }).issues.includes("version_count_rejected"));
  });

  it("rejects an active HUD version and does not activate", () => {
    assert.ok(evaluateHudResume({ ...base, existingActive: true }).issues.includes("active_version_rejected"));
    assert.ok(evaluateHudResume({ ...base, existingStatus: "failed" }).issues.includes("non_imported_version_rejected"));
    assert.throws(() => assertHudWriteSql("insert into public.zip_crosswalk_versions (status) values ('active')"));
  });

  it("rejects offset mismatch, holes, unexpected keys, and non-contiguous prefixes", () => {
    assert.ok(evaluateHudResume({ ...base, requiredOffset: 0 }).issues.includes("resume_offset_mismatch"));
    assert.ok(evaluateHudResume({ ...base, requiredOffset: 34999 }).issues.includes("unauthorized_resume_offset"));
    const holes = reconcileOrderedWageKeys(sourceKeys, prefixKeys.filter((_, i) => i !== 100));
    assert.ok(evaluateHudResume({ ...base, reconciled: holes }).issues.includes("holes_before_resume_boundary"));
    const unexpected = reconcileOrderedWageKeys(sourceKeys, [...prefixKeys, "xx|yy"]);
    assert.ok(evaluateHudResume({ ...base, reconciled: unexpected }).issues.includes("unexpected_persisted_keys"));
    const mixed = reconcileOrderedWageKeys(sourceKeys.slice(0, 4), [sourceKeys[0] ?? "", sourceKeys[2] ?? ""]);
    assert.ok(
      evaluateHudResume({
        ...base,
        reconciled: mixed,
        requiredOffset: 1,
        authorizedOffset: 1,
      }).issues.includes("non_contiguous_missing_rows")
    );
    const duplicatePersisted = reconcileOrderedWageKeys(sourceKeys, [...prefixKeys, prefixKeys[0] ?? ""]);
    assert.ok(evaluateHudResume({ ...base, reconciled: duplicatePersisted }).issues.includes("duplicate_persisted_keys"));
  });

  it("stops when next-batch keys already exist and does not insert", () => {
    resetHudMutationPaths();
    const rows = Array.from({ length: 4 }, (_, i) => sampleCrosswalk(i));
    const batches = [
      { sourceOffset: 0, zeroBasedResumeIndex: 0, oneBasedResumeNumber: 1, count: 2 },
      { sourceOffset: 2, zeroBasedResumeIndex: 1, oneBasedResumeNumber: 2, count: 2 },
    ];
    let insertCalls = 0;
    const written = applyApprovedHudResume(rows, batches, {
      assertAbsent: (batchRows) => (batchRows[0]?.zip === sampleCrosswalk(2).zip ? 2 : 0),
      assertPresent: (batchRows) => batchRows.length,
      onBatch: () => {},
      insertBatch: () => {
        insertCalls += 1;
      },
    });
    assert.equal(written.ok, false);
    if (written.ok) throw new Error("expected resume stop");
    assert.equal(written.stateChanged, true);
    assert.equal(written.reason, "RESUME STATE CHANGED — REVIEW REQUIRED");
    assert.equal(written.completed.length, 1);
    assert.equal(insertCalls, 1);
    assert.equal(written.failed.sourceOffset, 2);
    assert.equal(classifyHudBatchPresence(0), "absent");
    assert.equal(classifyHudBatchPresence(1), "state-changed");
  });

  it("never writes a version, county_fips_names, or OFLC during resume", () => {
    assert.equal(resumeWouldWriteParents(["zip_crosswalk_versions"]), true);
    assert.equal(resumeWouldWriteParents(["county_fips_names"]), true);
    assert.equal(resumeWouldWriteParents(["wage_datasets"]), true);
    assert.equal(resumeWouldWriteParents(["oflc_occupations"]), true);
    assert.equal(resumeWouldWriteParents(["zip_county_crosswalk"]), false);
    resetHudMutationPaths();
    const rows = [sampleCrosswalk(0)];
    const written = applyApprovedHudResume(
      rows,
      [{ sourceOffset: 0, zeroBasedResumeIndex: 0, oneBasedResumeNumber: 1, count: 1 }],
      {
        assertAbsent: () => 0,
        assertPresent: () => 1,
        onBatch: () => {},
        insertBatch: () => {},
      }
    );
    assert.equal(written.ok, true);
    assert.throws(() => assertHudWriteSql("insert into public.county_fips_names default values"));
    assert.throws(() => assertHudWriteSql("insert into public.oflc_wage_records default values"));
    assert.throws(() => assertHudWriteSql("insert into public.wage_datasets default values"));
  });

  it("writes sequentially, does not retry, and handles the final 570-row batch as batch 20", () => {
    const batches = remainingHudResumeBatches(54570, AUTHORIZED_HUD_RESUME_OFFSET, HUD_CROSSWALK_BATCH_SIZE);
    assert.equal(batches.length, AUTHORIZED_HUD_RESUME_BATCHES);
    assert.equal(AUTHORIZED_HUD_RESUME_BATCHES, 20);
    assert.equal(batches[0]?.sourceOffset, 35000);
    assert.equal(batches[0]?.zeroBasedResumeIndex, 0);
    assert.equal(batches[0]?.oneBasedResumeNumber, 1);
    assert.equal(batches[0]?.count, 1000);
    assert.equal(batches[18]?.sourceOffset, 53000);
    assert.equal(batches[18]?.count, 1000);
    assert.equal(batches[19]?.sourceOffset, 54000);
    assert.equal(batches[19]?.zeroBasedResumeIndex, 19);
    assert.equal(batches[19]?.oneBasedResumeNumber, 20);
    assert.equal(batches[19]?.count, 570);
    assert.equal(batches.reduce((sum, batch) => sum + batch.count, 0), AUTHORIZED_HUD_RESUME_REMAINING);

    resetHudMutationPaths();
    const rows = Array.from({ length: 3 }, (_, i) => sampleCrosswalk(i));
    let insertCalls = 0;
    const sequential = applyApprovedHudResume(
      rows,
      [
        { sourceOffset: 0, zeroBasedResumeIndex: 0, oneBasedResumeNumber: 1, count: 1 },
        { sourceOffset: 1, zeroBasedResumeIndex: 1, oneBasedResumeNumber: 2, count: 1 },
        { sourceOffset: 2, zeroBasedResumeIndex: 2, oneBasedResumeNumber: 3, count: 1 },
      ],
      {
        assertAbsent: () => 0,
        assertPresent: () => 1,
        onBatch: () => {},
        insertBatch: () => {
          insertCalls += 1;
        },
      }
    );
    assert.equal(sequential.ok, true);
    if (!sequential.ok) throw new Error("expected sequential resume");
    assert.equal(insertCalls, 3);
    assert.equal(sequential.completed.length, 3);
    assert.deepEqual(
      sequential.completed.map((item) => item.oneBasedResumeNumber),
      [1, 2, 3]
    );

    insertCalls = 0;
    const failed = applyApprovedHudResume(
      rows,
      [
        { sourceOffset: 0, zeroBasedResumeIndex: 0, oneBasedResumeNumber: 1, count: 1 },
        { sourceOffset: 1, zeroBasedResumeIndex: 1, oneBasedResumeNumber: 2, count: 1 },
      ],
      {
        assertAbsent: () => 0,
        assertPresent: () => 1,
        onBatch: () => {},
        insertBatch: () => {
          insertCalls += 1;
          if (insertCalls === 1) throw new Error("category=payload");
        },
      }
    );
    assert.equal(failed.ok, false);
    if (failed.ok) throw new Error("expected resume failure");
    assert.equal(insertCalls, 1);
    assert.equal(failed.completed.length, 0);
    assert.equal(failed.stateChanged, false);
  });
});

