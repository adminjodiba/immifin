import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildProductionInspectArgs,
  buildProductionMigrationListArgs,
  buildSupabaseQueryArgs,
  commandContainsLink,
  commandUsesLinkedFlag,
  resolveDbTarget,
} from "./dbExecution";
import {
  activationStatusForbidden,
  evaluateProductionPreflight,
  importerHasActivationPath,
} from "./productionPreflight";
import { evaluateWageResume } from "./resumeOflcDev";
import {
  assertAuthorizedWriteSql,
  markDatasetFailed,
  resetAuthorizedWriteFn,
  resetAuthorizedWritePaths,
  setAuthorizedWriteFn,
} from "./writeOflcDev";
import { assertDevOnlyTarget, assertLoaderTarget, classifyProjectRef } from "./targetGuard";
import { EXPECTED_OFFICIAL_PACKAGE_SHA256 } from "./constants";

const DEV_REF = "vnhnxxxxxxxxxxxxxxxxxxxxtoxs";
const PROD_REF = "pmkxxxxxxxxxxxxxxxxxxxxysdv";
const UNKNOWN_REF = "abcdxxxxxxxxxxxxxxxxxxxxwxyz";

const projects = [
  { name: "immifin Dev", id: DEV_REF, linked: true },
  { name: "immifin production", id: PROD_REF, linked: false },
];

describe("assertLoaderTarget Production gates", () => {
  it("allows Dev target + Dev ref as no-write", () => {
    const result = assertLoaderTarget({ explicitTarget: "dev", projectRef: DEV_REF });
    assert.equal(result.ok, true);
    assert.equal(result.mode, "no-write");
    assert.equal(result.acceptDev, true);
    assert.equal(result.acceptProduction, false);
  });

  it("rejects Dev target + Production ref", () => {
    const result = assertLoaderTarget({
      explicitTarget: "dev",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
    });
    assert.equal(result.ok, false);
    assert.equal(result.mode, "no-write");
    assert.ok(result.issues.some((i) => i.code === "production_project_blocked"));
  });

  it("accepts Production target + Production ref as dry-run", () => {
    const result = assertLoaderTarget({ explicitTarget: "production", projectRef: PROD_REF });
    assert.equal(result.ok, true);
    assert.equal(result.mode, "no-write");
    assert.equal(result.acceptProduction, true);
  });

  it("rejects Production target + Dev ref", () => {
    const result = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: DEV_REF,
      write: true,
      writeEnabledInBuild: true,
      confirmProduction: true,
    });
    assert.equal(result.ok, false);
    assert.equal(result.mode, "no-write");
    assert.ok(result.issues.some((i) => i.code === "production_ref_mismatch"));
  });

  it("rejects Production target + unknown ref", () => {
    const result = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: UNKNOWN_REF,
      write: true,
      writeEnabledInBuild: true,
      confirmProduction: true,
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "production_ref_mismatch"));
  });

  it("rejects write without an explicit target", () => {
    const result = assertLoaderTarget({
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
      confirmProduction: true,
    });
    assert.equal(result.ok, false);
    assert.equal(result.mode, "no-write");
    assert.ok(result.issues.some((i) => i.code === "target_required"));
    assert.ok(result.issues.some((i) => i.code === "write_requires_target"));
  });

  it("keeps Production target without write as dry-run", () => {
    const result = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
      write: false,
      confirmProduction: true,
    });
    assert.equal(result.ok, true);
    assert.equal(result.mode, "no-write");
  });

  it("rejects Production write without --confirm-production", () => {
    const result = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
    });
    assert.equal(result.ok, false);
    assert.equal(result.mode, "no-write");
    assert.ok(result.issues.some((i) => i.code === "production_confirm_required"));
  });

  it("rejects Production write + confirm + wrong ref", () => {
    const result = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: DEV_REF,
      write: true,
      writeEnabledInBuild: true,
      confirmProduction: true,
    });
    assert.equal(result.ok, false);
    assert.equal(result.mode, "no-write");
  });

  it("authorizes Production write only when every gate passes", () => {
    const result = assertLoaderTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
      confirmProduction: true,
    });
    assert.equal(result.ok, true);
    assert.equal(result.mode, "write");
    assert.equal(result.acceptProduction, true);
  });

  it("keeps assertDevOnlyTarget hard-blocking Production", () => {
    const result = assertDevOnlyTarget({
      explicitTarget: "production",
      projectRef: PROD_REF,
      write: true,
      writeEnabledInBuild: true,
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((i) => i.code === "production_blocked"));
  });
});

describe("dbExecution abstraction", () => {
  it("resolves Dev from the linked Dev project", () => {
    const resolved = resolveDbTarget({ explicitTarget: "dev", projects });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) throw new Error("expected resolve");
    assert.equal(resolved.target.kind, "dev");
    assert.equal(resolved.target.maskedRef.startsWith("vnhn"), true);
  });

  it("resolves Production without using the Dev link", () => {
    const resolved = resolveDbTarget({ explicitTarget: "production", projects });
    assert.equal(resolved.ok, true);
    if (!resolved.ok) throw new Error("expected resolve");
    assert.equal(resolved.target.kind, "production");
    assert.equal(resolved.target.maskedRef, "pmkx...ysdv");
  });

  it("rejects Production when the repo is linked to Production", () => {
    const resolved = resolveDbTarget({
      explicitTarget: "production",
      projects: [
        { name: "immifin Dev", id: DEV_REF, linked: false },
        { name: "immifin production", id: PROD_REF, linked: true },
      ],
    });
    assert.equal(resolved.ok, false);
    if (resolved.ok) throw new Error("expected reject");
    assert.ok(resolved.issues.includes("repo_must_not_be_linked_to_production"));
  });

  it("builds Dev query args with --linked only", () => {
    const built = buildSupabaseQueryArgs({
      kind: "dev",
      projectRef: DEV_REF,
      filePath: "x.sql",
      mode: "write",
    });
    assert.equal(built.ok, true);
    if (!built.ok) throw new Error("expected args");
    assert.equal(commandUsesLinkedFlag(built.args), true);
    assert.equal(commandContainsLink(built.args), false);
    assert.equal(built.args.includes("--project-ref"), false);
  });

  it("builds Production query args with --project-ref and never --linked", () => {
    const built = buildSupabaseQueryArgs({
      kind: "production",
      projectRef: PROD_REF,
      filePath: "x.sql",
      mode: "write",
    });
    assert.equal(built.ok, true);
    if (!built.ok) throw new Error("expected args");
    assert.equal(commandUsesLinkedFlag(built.args), false);
    assert.equal(commandContainsLink(built.args), false);
    assert.equal(built.args.includes("--project-ref"), true);
    assert.equal(built.args.includes("link"), false);
  });

  it("rejects Production execution args for a Dev ref", () => {
    const built = buildSupabaseQueryArgs({
      kind: "production",
      projectRef: DEV_REF,
      filePath: "x.sql",
      mode: "write",
    });
    assert.equal(built.ok, false);
  });

  it("builds Production inspect/migration-list args without link", () => {
    const inspect = buildProductionInspectArgs(PROD_REF);
    const list = buildProductionMigrationListArgs(PROD_REF);
    assert.equal(inspect.ok, true);
    assert.equal(list.ok, true);
    if (!inspect.ok || !list.ok) throw new Error("expected inspect args");
    assert.equal(commandUsesLinkedFlag(inspect.args), false);
    assert.equal(commandUsesLinkedFlag(list.args), false);
    assert.equal(buildProductionInspectArgs(DEV_REF).ok, false);
  });
});

describe("Production preflight and activation lock", () => {
  it("passes when 021 tables exist and source gates pass", () => {
    const result = evaluateProductionPreflight({
      oflcTablesPresent: [
        "wage_datasets",
        "oflc_occupations",
        "oflc_areas",
        "oflc_area_localities",
        "oflc_wage_records",
      ],
      migration021Present: true,
      activeAllIndustriesCount: 0,
      activeSameShaCount: 0,
      sourceValidated: true,
      shaOk: true,
      countsOk: true,
      parsedOk: true,
    });
    assert.equal(result.ok, true);
  });

  it("refuses a same-SHA ACTIVE conflict and missing schema", () => {
    const result = evaluateProductionPreflight({
      oflcTablesPresent: ["wage_datasets"],
      migration021Present: false,
      activeAllIndustriesCount: 1,
      activeSameShaCount: 1,
      sourceValidated: false,
      shaOk: false,
      countsOk: false,
      parsedOk: false,
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.includes("migration_021_missing"));
    assert.ok(result.issues.includes("active_same_sha_conflict"));
    assert.ok(result.issues.includes("source_sha_failed"));
  });

  it("has no activation path and rejects active SQL", () => {
    assert.equal(importerHasActivationPath(), false);
    assert.equal(activationStatusForbidden("active"), true);
    assert.equal(activationStatusForbidden("imported"), false);
    assert.throws(() =>
      assertAuthorizedWriteSql("update public.wage_datasets set status = 'active' where id = 'x'")
    );
  });
});

describe("Production resume gates", () => {
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
    explicitTarget: "production",
    targetKind: "production" as const,
    packageSha256: EXPECTED_OFFICIAL_PACKAGE_SHA256,
    expectedSha256: EXPECTED_OFFICIAL_PACKAGE_SHA256,
    existingDatasetId: "11111111-1111-4111-8111-111111111111",
    requiredDatasetId: "11111111-1111-4111-8111-111111111111",
    existingStatus: "failed",
    existingActive: false,
    matchingShaCount: 1,
    reconciled,
    requiredOffset: 418000,
  };

  it("rejects Production resume without confirmation", () => {
    const result = evaluateWageResume(base);
    assert.equal(result.ok, false);
    assert.ok(result.issues.includes("production_confirm_required"));
  });

  it("rejects Production resume against a Dev ref", () => {
    const result = evaluateWageResume({ ...base, confirmProduction: true, targetKind: "dev" });
    assert.equal(result.ok, false);
    assert.ok(result.issues.includes("production_ref_mismatch"));
  });

  it("allows Production resume only with the same write gates", () => {
    const result = evaluateWageResume({ ...base, confirmProduction: true });
    assert.equal(result.ok, true);
    assert.equal(result.resumeOffset, 418000);
  });
});

describe("mocked Production write boundary", () => {
  it("never reaches a real database and never activates", () => {
    resetAuthorizedWritePaths();
    const writes: string[] = [];
    setAuthorizedWriteFn((sql) => {
      writes.push(sql);
    });
    markDatasetFailed("11111111-1111-4111-8111-111111111111", "oflc_wage_records", 1);
    resetAuthorizedWriteFn();
    assert.equal(writes.length, 1);
    assert.equal(writes[0]?.includes("status = 'failed'"), true);
    assert.equal(writes[0]?.includes("status = 'active'"), false);
    assert.equal(writes[0]?.includes("status <> 'active'"), true);
  });
});

describe("project classification", () => {
  it("classifies masked-safe fixtures", () => {
    assert.equal(classifyProjectRef(DEV_REF), "dev");
    assert.equal(classifyProjectRef(PROD_REF), "production");
    assert.equal(classifyProjectRef(UNKNOWN_REF), "unknown");
  });
});
