import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EXPECTED_OFFICIAL_COUNTS,
  EXPECTED_OFFICIAL_GEOGRAPHY,
  EXPECTED_OFFICIAL_LABELS,
  EXPECTED_OFFICIAL_PACKAGE_SHA256,
  WAGE_RECORD_BATCH_SIZE,
} from "./constants";
import {
  buildLoadPlan,
  buildTableBatches,
  chunkSizes,
  evaluateRerun,
  evaluateSchemaCompatibility,
  validateOfficialDataset,
} from "./loadPlan";
import { assertReadOnlySql, isMutationSql, mutationPathsInvoked, WRITE_ENABLED_IN_BUILD } from "./readOnlySql";
import {
  firstWageGlobalIndex,
  reconcileOrderedWageKeys,
  wageBatchFromGlobalIndex,
  wageRecordKey,
} from "./wageReconcile";
import {
  assertAuthorizedWriteSql,
  applyApprovedDevWageResume,
  bindImportToDatasetId,
  buildOccupationInsertSql,
  childLoadBatches,
  hasMultipleStatements,
  proveOccupationInsertPayload,
  resetAuthorizedWritePaths,
  sanitizeCliWriteFailure,
  statementHead,
  writeSqlKind,
} from "./writeOflcDev";
import {
  AUTHORIZED_WAGE_RESUME_OFFSET,
  classifyBatchPresence,
  evaluateWageResume,
  mayMarkDatasetImported,
  remainingWageResumeBatches,
  resumeWouldWriteParents,
} from "./resumeOflcDev";
import { assertDevOnlyTarget, classifyProjectRef } from "./targetGuard";
import { OFLC_ALL_INDUSTRIES_DATA_SOURCE, type OflcImportResult } from "./types";

const DEV_REF = "vnhnxxxxxxxxxxxxxxxxxxxxtoxs";
const PROD_REF = "pmkxxxxxxxxxxxxxxxxxxxxysdv";

function officialShapedResult(overrides: Partial<OflcImportResult> = {}): OflcImportResult {
  const occupations = Array.from({ length: EXPECTED_OFFICIAL_COUNTS.occupations }, () => ({
    dataset_id: "11111111-1111-4111-8111-111111111111",
    soc_code: "15-1252",
    title: "Software Developers",
    description: null,
  }));
  const areas = Array.from({ length: EXPECTED_OFFICIAL_COUNTS.areas }, () => ({
    dataset_id: "11111111-1111-4111-8111-111111111111",
    area_code: "26420",
    area_name: "Houston",
  }));
  const localities = Array.from({ length: EXPECTED_OFFICIAL_COUNTS.localities }, () => ({
    dataset_id: "11111111-1111-4111-8111-111111111111",
    area_code: "26420",
    state_ab: "TX",
    state_name: "Texas",
    county_town_name: "Harris County",
    county_fips: "48201",
  }));
  const wageRecords = { length: EXPECTED_OFFICIAL_COUNTS.wage_records } as OflcImportResult["wageRecords"];
  const base: OflcImportResult = {
    ok: true,
    dataset: {
      id: "11111111-1111-4111-8111-111111111111",
      wage_year: "2026-27",
      effective_start: "2026-07-01",
      effective_end: "2027-06-30",
      data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
      package_filename: "OFLC_Wages_2026-27.zip",
      package_sha256: EXPECTED_OFFICIAL_PACKAGE_SHA256,
      source_url: null,
      bls_survey: "BLS May 2025 OEWS",
      soc_version: "2018 SOC",
      status: "imported",
      imported_at: null,
      activated_at: null,
      activated_by_clerk_user_id: null,
      row_counts: {
        occupations: occupations.length,
        areas: areas.length,
        localities: localities.length,
        wage_records: wageRecords.length,
      },
      validation_report: {},
      notes: null,
    },
    occupations,
    areas,
    localities,
    wageRecords,
    labelDistribution: { ...EXPECTED_OFFICIAL_LABELS },
    otherLabels: [],
    fixtures: [],
    issues: [],
    fipsResolution: { ...EXPECTED_OFFICIAL_GEOGRAPHY, unmatchedSamples: [] },
  };
  return { ...base, ...overrides };
}

describe("targetGuard", () => {
  it("defaults to no-write and accepts only verified Dev", () => {
    const ok = assertDevOnlyTarget({
      explicitTarget: "dev",
      projectRef: DEV_REF,
      write: false,
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.mode, "no-write");
    assert.equal(ok.acceptDev, true);
    assert.equal(ok.rejectProduction, false);
  });

  it("rejects missing explicit target", () => {
    const result = assertDevOnlyTarget({ projectRef: DEV_REF });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "target_required"));
  });

  it("hard-blocks Production target and project ref", () => {
    const byName = assertDevOnlyTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
    });
    assert.equal(byName.ok, false);
    assert.equal(byName.rejectProduction, true);
    assert.ok(byName.issues.some((i) => i.code === "production_blocked"));
    assert.ok(byName.issues.some((i) => i.code === "production_project_blocked"));
    assert.equal(classifyProjectRef(PROD_REF), "production");
  });

  it("rejects an unexpected project even when --target dev is set", () => {
    const result = assertDevOnlyTarget({
      explicitTarget: "dev",
      projectRef: "abcdxxxxxxxxxxxxxxxxxxxxwxyz",
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "unexpected_project"));
  });

  it("rejects write mode when write is disabled in the build", () => {
    const result = assertDevOnlyTarget({
      explicitTarget: "dev",
      projectRef: DEV_REF,
      write: true,
      writeEnabledInBuild: false,
    });
    assert.equal(result.ok, false);
    assert.equal(result.mode, "no-write");
    assert.ok(result.issues.some((i) => i.code === "write_disabled"));
  });

  it("allows write only for verified Dev with explicit --write", () => {
    const result = assertDevOnlyTarget({
      explicitTarget: "dev",
      projectRef: DEV_REF,
      write: true,
      writeEnabledInBuild: true,
    });
    assert.equal(result.ok, true);
    assert.equal(result.mode, "write");
    assert.equal(result.acceptDev, true);
  });

  it("still hard-blocks Production even when write is enabled in the build", () => {
    const result = assertDevOnlyTarget({
      explicitTarget: "dev",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
    });
    assert.equal(result.ok, false);
    assert.equal(result.mode, "no-write");
    assert.equal(result.rejectProduction, true);
  });
});

describe("official dataset gates", () => {
  it("accepts the expected official dataset shape", () => {
    const issues = validateOfficialDataset(officialShapedResult());
    assert.deepEqual(issues, []);
  });

  it("rejects a source hash mismatch", () => {
    const result = officialShapedResult();
    result.dataset.package_sha256 = "a".repeat(64);
    const issues = validateOfficialDataset(result);
    assert.ok(issues.some((i) => i.code === "source_hash_mismatch"));
  });

  it("rejects unexpected counts", () => {
    const result = officialShapedResult();
    result.occupations = result.occupations.slice(0, 10);
    const issues = validateOfficialDataset(result);
    assert.ok(issues.some((i) => i.code === "unexpected_counts"));
  });

  it("rejects unexpected labels", () => {
    const result = officialShapedResult();
    result.labelDistribution.other = 1;
    result.otherLabels = ["Special Case"];
    const issues = validateOfficialDataset(result);
    assert.ok(issues.some((i) => i.code === "unexpected_label"));
  });
});

describe("rerun and activation", () => {
  it("rejects a silent duplicate of an already imported SHA", () => {
    const decision = evaluateRerun(
      [
        {
          id: "already",
          package_sha256: EXPECTED_OFFICIAL_PACKAGE_SHA256,
          data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
          status: "imported",
        },
      ],
      EXPECTED_OFFICIAL_PACKAGE_SHA256
    );
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "reject-duplicate");
  });

  it("never auto-replaces an active dataset", () => {
    const decision = evaluateRerun(
      [
        {
          id: "live",
          package_sha256: EXPECTED_OFFICIAL_PACKAGE_SHA256,
          data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
          status: "active",
        },
      ],
      EXPECTED_OFFICIAL_PACKAGE_SHA256
    );
    assert.equal(decision.allowed, false);
    assert.equal(decision.action, "reject-active");
  });

  it("allows retry of a failed SHA without activating", () => {
    const small = officialShapedResult({
      occupations: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          soc_code: "15-1252",
          title: "Software Developers",
          description: null,
        },
      ],
      areas: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          area_code: "26420",
          area_name: "Houston",
        },
      ],
      localities: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          area_code: "26420",
          state_ab: "TX",
          state_name: "Texas",
          county_town_name: "Harris County",
          county_fips: "48201",
        },
      ],
      wageRecords: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
          area_code: "26420",
          soc_code: "15-1252",
          geo_level: 1,
          level1: 1,
          level2: 2,
          level3: 3,
          level4: 4,
          average: 2.5,
          label: null,
        },
      ],
    });
    const plan = buildLoadPlan(
      small,
      [
        {
          id: "failed",
          package_sha256: EXPECTED_OFFICIAL_PACKAGE_SHA256,
          data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
          status: "failed",
        },
      ],
      { officialGate: false }
    );
    assert.equal(plan.rerun.action, "retry-failed");
    assert.equal(plan.activate, false);
    assert.equal(plan.write, false);
    assert.equal(plan.datasetStatus, "imported");
    assert.equal(
      childLoadBatches(plan).some((batch) => batch.table === "wage_datasets"),
      false
    );
    const rebound = bindImportToDatasetId(small, "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    assert.equal(rebound.dataset.id, "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    assert.equal(rebound.dataset.status, "failed");
    assert.equal(rebound.occupations[0]?.dataset_id, "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    assert.equal(rebound.areas[0]?.dataset_id, "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    assert.equal(rebound.localities[0]?.dataset_id, "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    assert.equal(rebound.wageRecords[0]?.dataset_id, "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    assert.equal(rebound.dataset.activated_at, null);
  });
});

describe("batch construction", () => {
  it("covers all 449440 wage records", () => {
    const sizes = chunkSizes(EXPECTED_OFFICIAL_COUNTS.wage_records, WAGE_RECORD_BATCH_SIZE);
    assert.equal(sizes.reduce((a, b) => a + b, 0), 449440);
    assert.equal(sizes.length, 225);
    assert.equal(sizes[0], 2000);
    assert.equal(sizes[sizes.length - 1], 1440);
    const batches = buildTableBatches(
      "oflc_wage_records",
      EXPECTED_OFFICIAL_COUNTS.wage_records,
      WAGE_RECORD_BATCH_SIZE,
      0
    );
    const last = batches[batches.length - 1];
    assert.ok(last);
    assert.equal(last.start + last.count, 449440);
  });

  it("plans dependency-safe load order and does not activate", () => {
    const small = officialShapedResult({
      occupations: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          soc_code: "15-1252",
          title: "Software Developers",
          description: null,
        },
      ],
      areas: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          area_code: "26420",
          area_name: "Houston",
        },
      ],
      localities: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          area_code: "26420",
          state_ab: "TX",
          state_name: "Texas",
          county_town_name: "Harris County",
          county_fips: "48201",
        },
      ],
      wageRecords: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
          area_code: "26420",
          soc_code: "15-1252",
          geo_level: 1,
          level1: 1,
          level2: 2,
          level3: 3,
          level4: 4,
          average: 2.5,
          label: null,
        },
      ],
    });
    const plan = buildLoadPlan(small, [], { officialGate: false });
    assert.equal(plan.ok, true);
    assert.deepEqual([...plan.futureLoadOrder], [
      "wage_datasets",
      "oflc_occupations",
      "oflc_areas",
      "oflc_area_localities",
      "oflc_wage_records",
    ]);
    assert.equal(plan.batches[0].table, "wage_datasets");
    assert.equal(plan.totals.wage_record_batches, 1);
    assert.equal(plan.activate, false);
    assert.equal(plan.write, false);
  });
});

describe("All Industries and ACWIA", () => {
  it("selects All Industries only", () => {
    const result = officialShapedResult();
    assert.equal(result.dataset.data_source, OFLC_ALL_INDUSTRIES_DATA_SOURCE);
    const issues = validateOfficialDataset(result);
    assert.equal(issues.some((i) => i.code === "unsupported_data_source"), false);
  });

  it("rejects ACWIA Higher Education", () => {
    const result = officialShapedResult();
    result.dataset.data_source = "ACWIA Higher Education";
    const issues = validateOfficialDataset(result);
    assert.ok(issues.some((i) => i.code === "unsupported_data_source"));
  });

  it("rejects an unsupported wage year", () => {
    const result = officialShapedResult();
    result.dataset.wage_year = "2025-26";
    const issues = validateOfficialDataset(result);
    assert.ok(issues.some((i) => i.code === "unsupported_wage_year"));
  });
});

describe("no-write mutation path", () => {
  it("keeps default load plans non-activating", () => {
    assert.equal(WRITE_ENABLED_IN_BUILD, true);
    const small = officialShapedResult({
      occupations: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          soc_code: "15-1252",
          title: "Software Developers",
          description: null,
        },
      ],
      areas: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          area_code: "26420",
          area_name: "Houston",
        },
      ],
      localities: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          area_code: "26420",
          state_ab: "TX",
          state_name: "Texas",
          county_town_name: "Harris County",
          county_fips: "48201",
        },
      ],
      wageRecords: [
        {
          dataset_id: "11111111-1111-4111-8111-111111111111",
          data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
          area_code: "26420",
          soc_code: "15-1252",
          geo_level: 1,
          level1: 1,
          level2: 2,
          level3: 3,
          level4: 4,
          average: 2.5,
          label: null,
        },
      ],
    });
    const plan = buildLoadPlan(small, [], { officialGate: false });
    assert.equal(plan.write, false);
    assert.equal(plan.activate, false);
    assert.deepEqual(mutationPathsInvoked(), []);
  });

  it("rejects mutation SQL and accepts SELECT", () => {
    assert.equal(isMutationSql("select count(*) from public.wage_datasets"), false);
    assert.equal(isMutationSql("INSERT INTO public.wage_datasets (id) VALUES (gen_random_uuid())"), true);
    assert.equal(isMutationSql("UPDATE public.wage_datasets SET status = 'active'"), true);
    assert.equal(isMutationSql("DELETE FROM public.oflc_wage_records"), true);
    assert.doesNotThrow(() => assertReadOnlySql("select 1 as n"));
    assert.throws(() => assertReadOnlySql("insert into public.wage_datasets default values"));
  });
});

describe("authorized write SQL guard", () => {
  const occupationInsert =
    "insert into public.oflc_occupations (dataset_id, soc_code, title, description) values ('x', '15-1252', 'Directors', 'Do research. Delete files. Drop copies. Alter nothing. Truncate never.')";

  it("classifies INSERT by statement head and ignores VALUES text", () => {
    assert.equal(writeSqlKind(occupationInsert), "insert");
    assert.equal(statementHead(occupationInsert).toLowerCase().includes("do research"), false);
    assert.doesNotThrow(() => assertAuthorizedWriteSql(occupationInsert));
    assert.equal(
      hasMultipleStatements(
        "insert into public.oflc_occupations (dataset_id, soc_code, title, description) values ('x', '15-1252', 'Directors', 'Plan projects; do research. Delete nothing.')"
      ),
      false
    );
    assert.equal(
      hasMultipleStatements(
        "insert into public.oflc_occupations (dataset_id, soc_code, title, description) values ('x', '15-1252', 'Directors', 'Do research.'); delete from public.oflc_occupations"
      ),
      true
    );
    assert.doesNotThrow(() =>
      assertAuthorizedWriteSql(
        "insert into public.oflc_occupations (dataset_id, soc_code, title, description) values ('x', '15-1252', 'Directors', 'Plan projects; do research. Delete nothing.')"
      )
    );
    assert.throws(() =>
      assertAuthorizedWriteSql(
        "insert into public.oflc_occupations (dataset_id, soc_code, title, description) values ('x', '15-1252', 'Directors', 'Do research.'); delete from public.oflc_occupations"
      )
    );
  });

  it("allows approved INSERT even when VALUES resemble SQL command names", () => {
    assert.doesNotThrow(() =>
      assertAuthorizedWriteSql(
        "insert into public.wage_datasets (id, status) values ('x', 'imported')"
      )
    );
  });

  it("allows the approved failed-status UPDATE", () => {
    assert.doesNotThrow(() =>
      assertAuthorizedWriteSql(
        "update public.wage_datasets set status = 'failed' where id = '11111111-1111-4111-8111-111111111111' and status <> 'active'"
      )
    );
  });

  it("allows the approved imported-status UPDATE only for a specific failed dataset", () => {
    assert.doesNotThrow(() =>
      assertAuthorizedWriteSql(
        "update public.wage_datasets set status = 'imported' where id = '11111111-1111-4111-8111-111111111111' and lower(package_sha256) = 'edc01f64e2f805efe577337935e5c664adbd93d3135750aff8015fefe805f08f' and status = 'failed' and status <> 'active'"
      )
    );
  });

  it("rejects actual DO statements", () => {
    assert.equal(writeSqlKind("do $$ begin null; end $$"), "do");
    assert.throws(() => assertAuthorizedWriteSql("do $$ begin null; end $$"));
  });

  it("rejects DELETE", () => {
    assert.throws(() => assertAuthorizedWriteSql("delete from public.oflc_wage_records"));
  });

  it("rejects DROP", () => {
    assert.throws(() => assertAuthorizedWriteSql("drop table public.oflc_occupations"));
  });

  it("rejects ALTER", () => {
    assert.throws(() => assertAuthorizedWriteSql("alter table public.wage_datasets add column x int"));
  });

  it("rejects TRUNCATE", () => {
    assert.throws(() => assertAuthorizedWriteSql("truncate public.oflc_wage_records"));
  });

  it("rejects unsupported mutation types", () => {
    assert.throws(() => assertAuthorizedWriteSql("create table public.x (id int)"));
    assert.throws(() => assertAuthorizedWriteSql("grant all on public.wage_datasets to public"));
    assert.throws(() => assertAuthorizedWriteSql("call some_proc()"));
  });

  it("rejects activation and unconstrained updates", () => {
    assert.throws(() =>
      assertAuthorizedWriteSql("update public.wage_datasets set status = 'active' where id = 'x'")
    );
    assert.throws(() =>
      assertAuthorizedWriteSql("update public.wage_datasets set status = 'imported'")
    );
    assert.throws(() =>
      assertAuthorizedWriteSql("update public.oflc_occupations set title = 'x' where soc_code = '15-1252'")
    );
  });

  it("rejects HUD and county_fips_names writes", () => {
    assert.throws(() => assertAuthorizedWriteSql("insert into public.county_fips_names default values"));
    assert.throws(() =>
      assertAuthorizedWriteSql("insert into public.zip_crosswalk_versions (id) values ('x')")
    );
  });

  it("proves an occupation INSERT payload without executing it", () => {
    const rows = [
      {
        dataset_id: "11111111-1111-4111-8111-111111111111",
        soc_code: "15-1252",
        title: "Software Developers",
        description: "Do research; write the organization's software.",
      },
      {
        dataset_id: "11111111-1111-4111-8111-111111111111",
        soc_code: "11-1011",
        title: "Chief Executives",
        description: "Lead organizations.",
      },
    ];
    const proof = proveOccupationInsertPayload(rows, 2);
    assert.equal(proof.ok, true);
    assert.equal(proof.rowCount, 2);
    assert.equal(proof.uniqueSocCount, 2);
    assert.equal(proof.tupleCount, 2);
    assert.equal(proof.kind, "insert");
    assert.equal(proof.multipleStatements, false);
    assert.equal(proof.rowsWithSemicolon, 1);
    assert.equal(proof.unquotedSemicolons, 0);
    assert.equal(proof.quotedSemicolons, 1);
    assert.equal(proof.headContainsDo, false);
    assert.equal(proof.guardAccepted, true);
    const sql = buildOccupationInsertSql(rows);
    assert.equal(hasMultipleStatements(sql), false);
    assert.doesNotThrow(() => assertAuthorizedWriteSql(sql));
  });
});

describe("schema compatibility", () => {
  it("requires the five OFLC tables and ignores HUD for this load", () => {
    const missing = evaluateSchemaCompatibility(["profiles"]);
    assert.ok(missing.some((i) => i.code === "unexpected_schema"));
    const ok = evaluateSchemaCompatibility([
      "wage_datasets",
      "oflc_occupations",
      "oflc_areas",
      "oflc_area_localities",
      "oflc_wage_records",
      "zip_crosswalk_versions",
    ]);
    assert.deepEqual(ok, []);
  });
});

describe("wage batch numbering and key reconcile", () => {
  it("maps global batch 214 to wage offset 418000", () => {
    assert.equal(firstWageGlobalIndex(1, 1, 2), 5);
    const ref = wageBatchFromGlobalIndex(214, 5, WAGE_RECORD_BATCH_SIZE, 449440);
    assert.equal(ref.zeroBasedWageIndex, 209);
    assert.equal(ref.oneBasedWageNumber, 210);
    assert.equal(ref.sourceOffset, 418000);
    assert.equal(ref.sourceEndExclusive, 420000);
    assert.equal(ref.count, 2000);
  });

  it("detects a contiguous missing suffix with no holes", () => {
    const source = ["a|1", "b|2", "c|3", "d|4"];
    const persisted = ["a|1", "b|2"];
    const result = reconcileOrderedWageKeys(source, persisted);
    assert.equal(result.matching, 2);
    assert.equal(result.missing, 2);
    assert.equal(result.unexpected, 0);
    assert.equal(result.duplicates, 0);
    assert.equal(result.firstMissingIndex, 2);
    assert.equal(result.holesBeforeFirstMissing, 0);
    assert.equal(result.missingIsContiguousSuffix, true);
    assert.equal(wageRecordKey("26420", "15-1252"), "26420|15-1252");
  });

  it("rejects mixed missing keys as a simple suffix", () => {
    const source = ["a|1", "b|2", "c|3", "d|4"];
    const persisted = ["a|1", "c|3"];
    const result = reconcileOrderedWageKeys(source, persisted);
    assert.equal(result.firstMissingIndex, 1);
    assert.equal(result.missingIsContiguousSuffix, false);
    assert.equal(result.matching, 2);
  });
});

describe("sanitized write failure classification", () => {
  it("classifies timeout, connection, constraint, and payload without leaking secrets", () => {
    const timeout = sanitizeCliWriteFailure(1, "", "statement timeout SQLSTATE 57014");
    assert.equal(timeout.category, "timeout");
    assert.equal(timeout.postgresCode, "57014");
    const connection = sanitizeCliWriteFailure(1, "", "ECONNRESET socket hang up");
    assert.equal(connection.category, "connection");
    const constraint = sanitizeCliWriteFailure(1, "", "duplicate key violates unique constraint SQLSTATE 23505");
    assert.equal(constraint.category, "constraint");
    assert.equal(constraint.postgresCode, "23505");
    const payload = sanitizeCliWriteFailure(1, "statusCode: 413", "payload too large");
    assert.equal(payload.category, "payload");
    assert.equal(payload.httpStatus, 413);
    const leaked = sanitizeCliWriteFailure(1, "", "password=supersecret statement timeout");
    assert.equal(leaked.category, "timeout");
    assert.equal(JSON.stringify(leaked).includes("supersecret"), false);
  });
});

describe("explicit wage resume gates", () => {
  const reconciled = {
    expected: 449440,
    persisted: 418000,
    matching: 418000,
    missing: 31440,
    unexpected: 0,
    duplicates: 0,
    firstMissingIndex: 418000,
    holesBeforeFirstMissing: 0,
    missingIsContiguousSuffix: true,
    remaining: 31440,
  };
  const base = {
    resumeRequested: true,
    writeRequested: true,
    explicitTarget: "dev",
    targetKind: "dev" as const,
    packageSha256: EXPECTED_OFFICIAL_PACKAGE_SHA256,
    expectedSha256: EXPECTED_OFFICIAL_PACKAGE_SHA256,
    existingDatasetId: "11111111-1111-4111-8111-111111111111",
    requiredDatasetId: "11111111-1111-4111-8111-111111111111",
    existingStatus: "failed",
    existingActive: false,
    matchingShaCount: 1,
    reconciled,
    requiredOffset: AUTHORIZED_WAGE_RESUME_OFFSET,
  };

  it("allows the authorized Dev resume", () => {
    const result = evaluateWageResume(base);
    assert.equal(result.ok, true);
    assert.equal(result.resumeOffset, 418000);
    const batches = remainingWageResumeBatches(449440, 418000, 2000);
    assert.equal(batches.length, 16);
    assert.equal(batches[0]?.sourceOffset, 418000);
    assert.equal(batches[0]?.zeroBasedWageIndex, 209);
    assert.equal(batches[0]?.oneBasedWageNumber, 210);
    assert.equal(batches[15]?.count, 1440);
    assert.equal(batches.reduce((sum, batch) => sum + batch.count, 0), 31440);
  });

  it("requires explicit resume intent, write, and Dev", () => {
    assert.equal(evaluateWageResume({ ...base, resumeRequested: false }).ok, false);
    assert.equal(evaluateWageResume({ ...base, writeRequested: false }).ok, false);
    assert.equal(evaluateWageResume({ ...base, explicitTarget: "production", targetKind: "production" }).ok, false);
    assert.ok(evaluateWageResume({ ...base, targetKind: "production" }).issues.includes("production_resume_rejected"));
    assert.ok(evaluateWageResume({ ...base, targetKind: "unknown" }).issues.includes("resume_requires_dev"));
  });

  it("rejects wrong SHA, wrong dataset, active, and non-failed status", () => {
    assert.ok(evaluateWageResume({ ...base, packageSha256: "a".repeat(64) }).issues.includes("wrong_package_sha"));
    assert.ok(
      evaluateWageResume({ ...base, requiredDatasetId: "22222222-2222-4222-8222-222222222222" }).issues.includes(
        "wrong_dataset"
      )
    );
    assert.ok(evaluateWageResume({ ...base, existingActive: true }).issues.includes("active_dataset_rejected"));
    assert.ok(evaluateWageResume({ ...base, existingStatus: "imported" }).issues.includes("non_failed_dataset_rejected"));
  });

  it("rejects non-contiguous missing rows and offset mismatch", () => {
    const mixed = reconcileOrderedWageKeys(["a|1", "b|2", "c|3"], ["a|1", "c|3"]);
    assert.ok(
      evaluateWageResume({ ...base, reconciled: mixed, requiredOffset: 1 }).issues.includes("non_contiguous_missing_rows")
    );
    assert.ok(evaluateWageResume({ ...base, requiredOffset: 0 }).issues.includes("resume_offset_mismatch"));
    assert.equal(classifyBatchPresence(0), "absent");
    assert.equal(classifyBatchPresence(1), "state-changed");
  });

  it("stops when expected keys already exist in the next batch and does not retry", () => {
    resetAuthorizedWritePaths();
    const rows = Array.from({ length: 4 }, (_, i) => ({
      dataset_id: "11111111-1111-4111-8111-111111111111",
      data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
      area_code: `A${i}`,
      soc_code: `S${i}`,
      geo_level: 1,
      level1: 1,
      level2: 2,
      level3: 3,
      level4: 4,
      average: 2.5,
      label: null,
    }));
    const batches = [
      { sourceOffset: 0, zeroBasedWageIndex: 0, oneBasedWageNumber: 1, count: 2 },
      { sourceOffset: 2, zeroBasedWageIndex: 1, oneBasedWageNumber: 2, count: 2 },
    ];
    let insertCalls = 0;
    const written = applyApprovedDevWageResume(rows, batches, {
      assertAbsent: (batchRows) => (batchRows[0]?.area_code === "A2" ? 2 : 0),
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
  });

  it("does not insert a dataset or parent tables in resume mode", () => {
    assert.equal(resumeWouldWriteParents(["wage_datasets"]), true);
    assert.equal(resumeWouldWriteParents(["oflc_occupations"]), true);
    assert.equal(resumeWouldWriteParents(["oflc_areas"]), true);
    assert.equal(resumeWouldWriteParents(["oflc_area_localities"]), true);
    assert.equal(resumeWouldWriteParents(["oflc_wage_records"]), false);
    resetAuthorizedWritePaths();
    const rows = [
      {
        dataset_id: "11111111-1111-4111-8111-111111111111",
        data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
        area_code: "A0",
        soc_code: "S0",
        geo_level: 1,
        level1: 1,
        level2: 2,
        level3: 3,
        level4: 4,
        average: 2.5,
        label: null,
      },
    ];
    const written = applyApprovedDevWageResume(
      rows,
      [{ sourceOffset: 0, zeroBasedWageIndex: 0, oneBasedWageNumber: 1, count: 1 }],
      {
        assertAbsent: () => 0,
        assertPresent: () => 1,
        onBatch: () => {},
        insertBatch: () => {},
      }
    );
    assert.equal(written.ok, true);
    if (!written.ok) throw new Error("expected resume success");
    assert.equal(written.completed.length, 1);
  });

  it("does not automatically retry after a batch write failure", () => {
    resetAuthorizedWritePaths();
    const rows = Array.from({ length: 2 }, (_, i) => ({
      dataset_id: "11111111-1111-4111-8111-111111111111",
      data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
      area_code: `A${i}`,
      soc_code: `S${i}`,
      geo_level: 1,
      level1: 1,
      level2: 2,
      level3: 3,
      level4: 4,
      average: 2.5,
      label: null,
    }));
    let insertCalls = 0;
    const written = applyApprovedDevWageResume(
      rows,
      [{ sourceOffset: 0, zeroBasedWageIndex: 0, oneBasedWageNumber: 1, count: 2 }],
      {
        assertAbsent: () => 0,
        assertPresent: () => 2,
        onBatch: () => {},
        insertBatch: () => {
          insertCalls += 1;
          throw new Error("category=payload");
        },
      }
    );
    assert.equal(written.ok, false);
    if (written.ok) throw new Error("expected resume failure");
    assert.equal(insertCalls, 1);
    assert.equal(written.completed.length, 0);
    assert.equal(written.stateChanged, false);
  });

  it("transitions to imported only after full validation", () => {
    const pass = {
      wageDatasets: 1,
      occupations: 848,
      areas: 530,
      localities: 3275,
      wages: 449440,
      matchingSha: 1,
      datasetStatus: "failed",
      activeWageDatasets: 0,
      expected: 449440,
      persisted: 449440,
      matching: 449440,
      missing: 0,
      unexpected: 0,
      duplicates: 0,
      orphanOccupations: 0,
      orphanAreas: 0,
      duplicateWageKeys: 0,
      blank: 410620,
      annualWage: 32299,
      highWage: 5866,
      noLeveledWage: 655,
      other: 0,
      fixturesOk: true,
      newRows: 31440,
      completedBatches: 16,
      hudCounty: 0,
      hudVersions: 0,
      hudCrosswalk: 0,
    };
    assert.equal(mayMarkDatasetImported(pass), true);
    assert.equal(mayMarkDatasetImported({ ...pass, missing: 1 }), false);
    assert.equal(mayMarkDatasetImported({ ...pass, datasetStatus: "imported" }), false);
    assert.equal(mayMarkDatasetImported({ ...pass, fixturesOk: false }), false);
    assert.equal(mayMarkDatasetImported({ ...pass, wages: 418000 }), false);
    assert.equal(mayMarkDatasetImported({ ...pass, activeWageDatasets: 1 }), false);
  });
});
