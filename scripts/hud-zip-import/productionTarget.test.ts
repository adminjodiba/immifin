import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSupabaseQueryArgs,
  commandContainsLink,
  commandContainsLinkSubcommand,
  commandUsesLinkedFlag,
  isSupportedProductionQueryArgs,
  resolveDbTarget,
} from "../oflc-wage-import/dbExecution";
import { assertDevOnlyTarget, assertLoaderTarget, classifyProjectRef } from "../oflc-wage-import/targetGuard";
import { EXPECTED_HUD_COUNTS, EXPECTED_HUD_PACKAGE_SHA256, HUD_FORBIDDEN_TABLES } from "./constants";
import { buildHudLoadPlan, evaluateHudActiveVersionSafety, evaluateHudRerun } from "./loadPlan";
import { assertHudSchemaShape, parseHudZipCountyWorkbook } from "./parseHudWorkbook";
import {
  activationStatusForbidden,
  evaluateHudProductionWriteAuthorization,
  evaluateProductionHudPreflight,
  HUD_SCHEMA_TABLES,
  hudImporterHasActivationPath,
  hudImporterWritesOflc,
} from "./productionPreflight";
import { evaluateHudResume } from "./resumeHudDev";
import {
  applyApprovedHudLoad,
  assertHudWriteSql,
  buildCrosswalkInsertSql,
  buildHudQueryArgs,
  buildVersionInsertSql,
  HUD_WRITE_ENABLED_IN_BUILD,
  resetHudAuthorizedWriteFn,
  resetHudMutationPaths,
  setHudAuthorizedWriteFn,
} from "./sqlPlan";
import { EXPECTED_HUD_ZIP_COUNTY_Q2_2026, HUD_USPS_ZIP_COUNTY_SOURCE } from "./types";
import type { HudImportResult, ZipCountyCrosswalkRecord } from "./types";
import type { HudSheetRow } from "./xlsx";

const DEV_REF = "vnhnxxxxxxxxxxxxxxxxxxxxtoxs";
const PROD_REF = "pmkxxxxxxxxxxxxxxxxxxxxysdv";
const UNKNOWN_REF = "abcdxxxxxxxxxxxxxxxxxxxxwxyz";

const projects = [
  { name: "immifin Dev", id: DEV_REF, linked: true },
  { name: "immifin production", id: PROD_REF, linked: false },
];

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

function officialHudResult(overrides: Partial<HudImportResult> = {}): HudImportResult {
  const rows: ZipCountyCrosswalkRecord[] = Array.from({ length: EXPECTED_HUD_COUNTS.rows }, (_, i) => ({
    crosswalk_version: "11111111-1111-4111-8111-111111111111",
    zip: String(10000 + (i % EXPECTED_HUD_COUNTS.uniqueZips)).padStart(5, "0"),
    county_fips: String(10000 + (i % EXPECTED_HUD_COUNTS.uniqueCountyFips)).padStart(5, "0"),
    res_ratio: 1,
    bus_ratio: i < EXPECTED_HUD_COUNTS.zeroBusRatioRows ? 0 : 1,
    oth_ratio: 0,
    tot_ratio: 1,
    pref_city: "CITY",
    pref_state: "TX",
    source: HUD_USPS_ZIP_COUNTY_SOURCE,
    hud_year: 2026,
    hud_quarter: 2,
  }));
  return {
    ok: true,
    version: {
      id: "11111111-1111-4111-8111-111111111111",
      hud_year: 2026,
      hud_quarter: 2,
      census_gazetteer_vintage: null,
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
    ...overrides,
  };
}

function passingWriteAuth(
  overrides: Partial<Parameters<typeof evaluateHudProductionWriteAuthorization>[0]> = {}
) {
  return evaluateHudProductionWriteAuthorization({
    explicitTarget: "production",
    projectRef: PROD_REF,
    write: true,
    confirmProduction: true,
    writeEnabledInBuild: HUD_WRITE_ENABLED_IN_BUILD,
    sourceValidated: true,
    shaOk: true,
    countsOk: true,
    parsedOk: true,
    preflightOk: true,
    planOk: true,
    activate: false,
    versionStatus: "imported",
    populateCountyFipsNames: false,
    ...overrides,
  });
}

describe("HUD target matrix", () => {
  it("accepts target dev + Dev ref", () => {
    const resolved = resolveDbTarget({ explicitTarget: "dev", projects });
    const guard = assertLoaderTarget({ explicitTarget: "dev", projectRef: DEV_REF });
    assert.equal(resolved.ok, true);
    assert.equal(guard.ok, true);
    assert.equal(guard.acceptDev, true);
    assert.equal(classifyProjectRef(DEV_REF), "dev");
  });

  it("rejects target dev + Production ref", () => {
    const guard = assertLoaderTarget({
      explicitTarget: "dev",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
    });
    assert.equal(guard.ok, false);
    assert.ok(guard.issues.some((item) => item.code === "production_project_blocked"));
  });

  it("accepts target production + Production ref as dry-run", () => {
    const resolved = resolveDbTarget({ explicitTarget: "production", projects });
    const guard = assertLoaderTarget({ explicitTarget: "production", projectRef: PROD_REF });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) throw new Error("expected resolve");
    assert.equal(resolved.target.kind, "production");
    assert.equal(resolved.target.maskedRef, "pmkx...ysdv");
    assert.equal(guard.ok, true);
    assert.equal(guard.mode, "no-write");
    assert.equal(guard.acceptProduction, true);
  });

  it("rejects target production + Dev ref", () => {
    const guard = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: DEV_REF,
      write: true,
      writeEnabledInBuild: true,
      confirmProduction: true,
    });
    assert.equal(guard.ok, false);
    assert.ok(guard.issues.some((item) => item.code === "production_ref_mismatch"));
  });

  it("rejects target production + unknown ref", () => {
    const guard = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: UNKNOWN_REF,
      write: true,
      writeEnabledInBuild: true,
      confirmProduction: true,
    });
    assert.equal(guard.ok, false);
    assert.ok(guard.issues.some((item) => item.code === "production_ref_mismatch"));
  });

  it("rejects missing target + write", () => {
    const guard = assertLoaderTarget({
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
      confirmProduction: true,
    });
    assert.equal(guard.ok, false);
    assert.equal(guard.mode, "no-write");
    assert.ok(guard.issues.some((item) => item.code === "write_requires_target"));
  });

  it("keeps Production target without write as dry-run / zero writes", () => {
    const guard = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
      write: false,
      confirmProduction: true,
    });
    const auth = passingWriteAuth({ write: false, confirmProduction: true });
    assert.equal(guard.ok, true);
    assert.equal(guard.mode, "no-write");
    assert.equal(auth.authorized, false);
    assert.equal(auth.wouldInvokeWrite, false);
  });

  it("rejects Production target + write without confirm", () => {
    const guard = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
    });
    assert.equal(guard.ok, false);
    assert.ok(guard.issues.some((item) => item.code === "production_confirm_required"));
  });

  it("rejects Production target + write + confirm + wrong ref", () => {
    const auth = passingWriteAuth({ projectRef: DEV_REF });
    assert.equal(auth.authorized, false);
    assert.equal(auth.wouldInvokeWrite, false);
    assert.ok(auth.issues.includes("production_ref_mismatch"));
  });

  it("does not fall back to the linked project when Production is requested", () => {
    const resolved = resolveDbTarget({ explicitTarget: "production", projects });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) throw new Error("expected resolve");
    assert.equal(resolved.target.kind, "production");
    assert.notEqual(resolved.target.projectRef, DEV_REF);
    assert.equal(projects.find((item) => item.linked)?.id, DEV_REF);
  });

  it("keeps the Dev-only helper hard-blocking Production", () => {
    const blocked = assertDevOnlyTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
    });
    assert.equal(blocked.ok, false);
    assert.ok(blocked.issues.some((item) => item.code === "production_blocked"));
  });
});

describe("HUD Production command shape", () => {
  it("builds Production SQL args as db query --linked --project-ref --file", () => {
    const built = buildHudQueryArgs({
      kind: "production",
      projectRef: PROD_REF,
      filePath: "hud.sql",
      mode: "write",
    });
    assert.equal(built.ok, true);
    if (!built.ok) throw new Error("expected args");
    assert.deepEqual(built.args, [
      "db",
      "query",
      "--linked",
      "--project-ref",
      PROD_REF,
      "--file",
      "hud.sql",
    ]);
    assert.equal(isSupportedProductionQueryArgs(built.args, PROD_REF), true);
    assert.equal(commandUsesLinkedFlag(built.args), true);
    assert.equal(commandContainsLinkSubcommand(built.args), false);
    assert.equal(commandContainsLink(built.args), false);
  });

  it("uses the same Production shape for read and write", () => {
    const readArgs = buildSupabaseQueryArgs({
      kind: "production",
      projectRef: PROD_REF,
      filePath: "hud.sql",
      mode: "read",
    });
    const writeArgs = buildHudQueryArgs({
      kind: "production",
      projectRef: PROD_REF,
      filePath: "hud.sql",
      mode: "write",
    });
    assert.equal(readArgs.ok && writeArgs.ok, true);
    if (!readArgs.ok || !writeArgs.ok) throw new Error("expected args");
    assert.deepEqual(writeArgs.args, readArgs.args);
  });

  it("never uses the link subcommand", () => {
    assert.equal(commandContainsLinkSubcommand(["db", "query", "--linked", "--project-ref", PROD_REF]), false);
    assert.equal(commandContainsLinkSubcommand(["link", "--project-ref", PROD_REF]), true);
    assert.equal(isSupportedProductionQueryArgs(["link", "--project-ref", PROD_REF], PROD_REF), false);
  });
});

describe("HUD Production write gates and mocked write boundary", () => {
  it("authorizes Production write only when every gate passes, without live writes", () => {
    const auth = passingWriteAuth();
    assert.equal(auth.authorized, true);
    assert.equal(auth.wouldInvokeWrite, true);
  });

  it("blocks Production writes when SHA or counts fail", () => {
    const auth = passingWriteAuth({ shaOk: false, countsOk: false });
    assert.equal(auth.authorized, false);
    assert.ok(auth.issues.includes("source_sha_failed"));
    assert.ok(auth.issues.includes("source_counts_failed"));
  });

  it("reaches the authorized write function only through mocked hooks", () => {
    resetHudMutationPaths();
    resetHudAuthorizedWriteFn();
    let liveBoundaryCalls = 0;
    setHudAuthorizedWriteFn(() => {
      liveBoundaryCalls += 1;
      throw new Error("live Production write boundary must not run in tests");
    });
    const version = officialHudResult().version;
    const rows = [
      {
        crosswalk_version: version.id,
        zip: "00501",
        county_fips: "36103",
        res_ratio: 0,
        bus_ratio: 1,
        oth_ratio: 0,
        tot_ratio: 1,
        pref_city: "HOLTSVILLE",
        pref_state: "NY",
        source: HUD_USPS_ZIP_COUNTY_SOURCE,
        hud_year: 2026,
        hud_quarter: 2,
      },
    ];
    let mockedInserts = 0;
    const written = applyApprovedHudLoad(
      version,
      rows,
      [
        { table: "zip_crosswalk_versions", index: 0, start: 0, count: 1 },
        { table: "zip_county_crosswalk", index: 1, start: 0, count: 1 },
      ],
      {
        assertAbsent: () => 0,
        assertPresent: () => 1,
        onBatch: () => undefined,
        insertVersion: () => {
          mockedInserts += 1;
        },
        insertBatch: () => {
          mockedInserts += 1;
        },
      }
    );
    resetHudAuthorizedWriteFn();
    assert.equal(written.ok, true);
    assert.equal(mockedInserts, 2);
    assert.equal(liveBoundaryCalls, 0);
  });

  it("does not invoke the write function when Production confirm is missing", () => {
    let writes = 0;
    const auth = passingWriteAuth({ confirmProduction: false });
    if (auth.authorized) writes += 1;
    assert.equal(auth.authorized, false);
    assert.equal(writes, 0);
  });
});

describe("HUD Production preflight and lifecycle", () => {
  it("passes when 021 HUD tables exist, counts match, and no active HUD version exists", () => {
    const result = evaluateProductionHudPreflight({
      hudTablesPresent: [...HUD_SCHEMA_TABLES],
      migration021Present: true,
      activeHudCount: 0,
      existingVersionCount: 0,
      sourceValidated: true,
      shaOk: true,
      countsOk: true,
      parsedOk: true,
    });
    assert.equal(result.ok, true);
  });

  it("blocks when an active HUD version exists and never archives it", () => {
    const existing = [
      { id: "11111111-1111-4111-8111-111111111111", package_sha256: EXPECTED_HUD_PACKAGE_SHA256, status: "active" },
    ];
    const preflight = evaluateProductionHudPreflight({
      hudTablesPresent: [...HUD_SCHEMA_TABLES],
      migration021Present: true,
      activeHudCount: 1,
      existingVersionCount: 1,
      sourceValidated: true,
      shaOk: true,
      countsOk: true,
      parsedOk: true,
    });
    const safety = evaluateHudActiveVersionSafety(existing);
    const rerun = evaluateHudRerun(existing, EXPECTED_HUD_PACKAGE_SHA256);
    assert.equal(preflight.ok, false);
    assert.ok(preflight.issues.includes("active_hud_conflict"));
    assert.equal(safety.archiveActive, false);
    assert.equal(safety.replaceActive, false);
    assert.equal(safety.activate, false);
    assert.equal(safety.allowedNewImported, false);
    assert.equal(rerun.allowed, false);
  });

  it("rejects a same-SHA duplicate and never activates", () => {
    const existing = [
      { id: "11111111-1111-4111-8111-111111111111", package_sha256: EXPECTED_HUD_PACKAGE_SHA256, status: "imported" },
    ];
    const rerun = evaluateHudRerun(existing, EXPECTED_HUD_PACKAGE_SHA256);
    const plan = buildHudLoadPlan(officialHudResult(), existing);
    assert.equal(rerun.action, "reject-duplicate");
    assert.equal(plan.ok, false);
    assert.equal(plan.activate, false);
    assert.equal(hudImporterHasActivationPath(), false);
    assert.equal(activationStatusForbidden("active"), true);
    assert.throws(() =>
      assertHudWriteSql("insert into public.zip_crosswalk_versions (status) values ('active')")
    );
  });

  it("keeps Production resume rejected even with confirm", () => {
    const resume = evaluateHudResume({
      resumeRequested: true,
      writeRequested: true,
      explicitTarget: "production",
      targetKind: "production",
      confirmProduction: true,
      packageSha256: EXPECTED_HUD_PACKAGE_SHA256,
      expectedSha256: EXPECTED_HUD_PACKAGE_SHA256,
      existingVersionId: "11111111-1111-4111-8111-111111111111",
      requiredVersionId: "11111111-1111-4111-8111-111111111111",
      existingStatus: "imported",
      existingActive: false,
      matchingShaCount: 1,
      versionCount: 1,
      countyFipsNames: 0,
      reconciled: {
        expected: 54570,
        persisted: 35000,
        matching: 35000,
        missing: 19570,
        unexpected: 0,
        duplicates: 0,
        firstMissingIndex: 35000,
        holesBeforeFirstMissing: 0,
        missingIsContiguousSuffix: true,
        remaining: 19570,
      },
      requiredOffset: 35000,
    });
    assert.equal(resume.ok, false);
    assert.ok(resume.issues.includes("production_resume_rejected"));
  });

  it("never writes OFLC or county_fips_names", () => {
    assert.equal(hudImporterWritesOflc("oflc_wage_records"), true);
    assert.equal(hudImporterWritesOflc("zip_county_crosswalk"), false);
    for (const table of HUD_FORBIDDEN_TABLES) {
      assert.throws(() => assertHudWriteSql(`insert into public.${table} default values`));
    }
  });
});

describe("HUD ZIP / FIPS / multi-county / ratio semantics", () => {
  it("preserves leading-zero ZIPs including 00501 and 00801", () => {
    const parsed = parseHudZipCountyWorkbook({
      filename: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename,
      packageSha256: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256,
      header: HEADER,
      rows: [
        row("00501", "36103", "HOLTSVILLE", "NY", "0", "1", "0", "1"),
        row("00801", "78010", "ST THOMAS", "VI", "1", "1", "1", "1"),
      ],
      validateOfficialIdentity: false,
      validateFixtures: false,
    });
    assert.equal(parsed.rows[0]?.zip, "00501");
    assert.equal(parsed.rows[1]?.zip, "00801");
    assert.equal(Number(parsed.rows[0]?.zip), 501);
    assert.notEqual(parsed.rows[0]?.zip, "501");
    assert.equal(assertHudSchemaShape(parsed).length, 0);
  });

  it("preserves 5-digit county FIPS including leading zeros", () => {
    const parsed = parseHudZipCountyWorkbook({
      filename: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename,
      packageSha256: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256,
      header: HEADER,
      rows: [
        row("00501", "36103", "HOLTSVILLE", "NY", "0", "1", "0", "1"),
        row("00801", "78010", "ST THOMAS", "VI", "1", "1", "1", "1"),
        row("77433", "00048", "PLACEHOLDER", "TX", "1", "1", "1", "1"),
      ],
      validateOfficialIdentity: false,
      validateFixtures: false,
    });
    assert.equal(parsed.rows[0]?.county_fips, "36103");
    assert.equal(parsed.rows[1]?.county_fips, "78010");
    assert.equal(parsed.rows[2]?.county_fips, "00048");
    assert.notEqual(parsed.rows[2]?.county_fips, "48");
  });

  it("preserves all multi-county ZIP rows and official ratios", () => {
    const parsed = parseHudZipCountyWorkbook({
      filename: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.filename,
      packageSha256: EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256,
      header: HEADER,
      rows: [
        row("77433", "48201", "CYPRESS", "TX", "1", "1", "1", "1"),
        row("77031", "48201", "HOUSTON", "TX", "0.9987804878", "0.9557522124", "0.9824561404", "0.9951650780"),
        row("77031", "48157", "HOUSTON", "TX", "0.0012195122", "0.0442477876", "0.0175438596", "0.0048349220"),
        row("76945", "48081", "ROBERT LEE", "TX", "0.9952606635", "1", "1", "0.9954128440"),
        row("76945", "48451", "ROBERT LEE", "TX", "0.0047393365", "0", "0", "0.0045871560"),
        row("00501", "36103", "HOLTSVILLE", "NY", "0", "1", "0", "1"),
        row("00801", "78010", "ST THOMAS", "VI", "1", "1", "1", "1"),
      ],
      validateOfficialIdentity: false,
      validateFixtures: false,
    });
    const byZip = (zip: string) => parsed.rows.filter((item) => item.zip === zip);
    assert.equal(byZip("77433").length, 1);
    assert.equal(byZip("77031").length, 2);
    assert.equal(byZip("76945").length, 2);
    assert.equal(byZip("00501")[0]?.zip, "00501");
    assert.equal(byZip("00801")[0]?.zip, "00801");
    assert.equal(byZip("76945")[0]?.res_ratio, 0.9952606635);
    assert.equal(byZip("76945")[1]?.bus_ratio, 0);
    const sql = buildCrosswalkInsertSql(parsed.rows);
    assert.match(sql, /00501/);
    assert.match(sql, /00801/);
    assert.match(sql, /76945/);
    const versionSql = buildVersionInsertSql({
      id: "11111111-1111-4111-8111-111111111111",
      hud_year: 2026,
      hud_quarter: 2,
      census_gazetteer_vintage: null,
      package_sha256: EXPECTED_HUD_PACKAGE_SHA256,
      status: "imported",
      imported_at: null,
      unmatched_locality_count: 8,
      validation_report: { activate: false },
    });
    assert.equal(versionSql.toLowerCase().includes("'active'"), false);
  });
});
