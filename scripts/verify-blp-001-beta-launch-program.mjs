/**
 * BLP-001 — IMMIFIN Beta Launch Program foundation documentation checks.
 * Run: npx tsx scripts/verify-blp-001-beta-launch-program.mjs
 * Documentation only — does not modify files or call providers.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function read(relPath) {
  const abs = resolve(relPath);
  assert(`${relPath} exists`, existsSync(abs));
  return readFileSync(abs, "utf8");
}

function assertIncludes(label, text, needle) {
  assert(`${label} includes "${needle}"`, text.includes(needle));
}

function main() {
  console.log("\nBLP-001 Beta Launch Program documentation verification\n");

  const blp = read("docs/BETA_LAUNCH_PROGRAM.md");
  const roadmap = read("docs/ROADMAP_v2.md");
  const state = read("docs/CURRENT_PROJECT_STATE.md");
  const guide = read("docs/PROJECT_GUIDE.md");

  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "BLP-001");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Epic 1");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Beta Infrastructure");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Epic 2");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Billing Validation");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Epic 3");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Operational Readiness");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Epic 4");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Customer Support");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Epic 5");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Beta User Management");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Epic 6");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Analytics");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Epic 7");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Immigration Data Quality");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Epic 8");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Intelligence Controlled Rollout");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Epic 9");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Public Launch Readiness");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Public launch criteria");
  assertIncludes("BETA_LAUNCH_PROGRAM", blp, "Exit criteria");

  assertIncludes("ROADMAP_v2", roadmap, "IMMIFIN Beta Launch Program");
  assertIncludes("ROADMAP_v2", roadmap, "Epic 1");
  assertIncludes("ROADMAP_v2", roadmap, "BETA_LAUNCH_PROGRAM.md");
  assertIncludes("ROADMAP_v2", roadmap, "BLP-001");
  assert(
    "ROADMAP records Sprint 9 as not started / planned only",
    /Sprint 9[\s\S]{0,200}not started/i.test(roadmap),
  );
  assert(
    "ROADMAP does not mark Sprint 9 In Progress",
    !/Sprint 9[^\n]{0,120}In Progress/i.test(roadmap),
  );

  assertIncludes("CURRENT_PROJECT_STATE", state, "IMMIFIN Beta Launch Program");
  assertIncludes("CURRENT_PROJECT_STATE", state, "Feature Development Frozen");
  assertIncludes("CURRENT_PROJECT_STATE", state, "Preparing Invite-only Beta");
  assertIncludes("CURRENT_PROJECT_STATE", state, "Controlled Beta");
  assertIncludes("CURRENT_PROJECT_STATE", state, "Not Approved");
  assertIncludes("CURRENT_PROJECT_STATE", state, "BETA_LAUNCH_PROGRAM.md");

  assertIncludes("PROJECT_GUIDE", guide, "Beta Launch Program");
  assertIncludes("PROJECT_GUIDE", guide, "Engineering Freeze");
  assertIncludes("PROJECT_GUIDE", guide, "Controlled Beta");
  assertIncludes("PROJECT_GUIDE", guide, "Public Launch");
  assertIncludes("PROJECT_GUIDE", guide, "BETA_LAUNCH_PROGRAM.md");
  assertIncludes("PROJECT_GUIDE", guide, "Development Lifecycle");

  assert(
    "BLP records Public Launch Not Approved as current status",
    /Public [Ll]aunch[^.\n]{0,40}Not Approved/i.test(blp),
  );
  assert(
    "CURRENT_PROJECT_STATE records Public Launch Not Approved",
    /Public Launch[^|\n]{0,40}Not Approved/i.test(state),
  );

  console.log("\nPASS: BLP-001 Beta Launch Program documentation verification\n");
}

main();
