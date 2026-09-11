/**
 * S8-IIP-012 — Sprint 8 Engineering Freeze and Pre-Beta Transition.
 * Documentation / governance consistency checks only.
 * Run: npx tsx scripts/verify-s8-iip-012-sprint-freeze.mjs
 *
 * Does not modify files. Does not call providers. Does not deploy.
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

function assertIncludes(docLabel, text, needle) {
  assert(`${docLabel} includes "${needle}"`, text.includes(needle));
}

function main() {
  console.log("\nS8-IIP-012 Sprint freeze / handoff verification\n");

  const handoff = read("docs/SPRINT_8_HANDOFF.md");
  const state = read("docs/CURRENT_PROJECT_STATE.md");
  const roadmap = read("docs/ROADMAP_v2.md");
  const guide = read("docs/PROJECT_GUIDE.md");
  const readiness = read("docs/SPRINT_8_INTELLIGENCE_PRODUCTION_READINESS.md");
  const intelReadme = read("lib/intelligence/README.md");
  const ops = read("docs/INTELLIGENCE_BETA_OPERATIONS.md");

  assert("Sprint 8 handoff exists", handoff.length > 100);

  for (const [label, text] of [
    ["handoff", handoff],
    ["CURRENT_PROJECT_STATE", state],
    ["ROADMAP_v2", roadmap],
    ["PROJECT_GUIDE", guide],
    ["readiness", readiness],
    ["lib/intelligence/README", intelReadme],
  ]) {
    assertIncludes(label, text, "FROZEN");
    assertIncludes(label, text, "PRE-BETA ENABLEMENT PENDING");
    assertIncludes(label, text, "CONDITIONAL GO FOR INVITE-ONLY CONTROLLED BETA");
    assertIncludes(label, text, "NOT APPROVED");
  }

  assertIncludes("handoff", handoff, "COMPLETE WITH OPEN PRE-ENABLE ACTIONS");
  assertIncludes("CURRENT_PROJECT_STATE", state, "COMPLETE WITH OPEN PRE-ENABLE ACTIONS");
  assertIncludes("ROADMAP_v2", roadmap, "COMPLETE WITH OPEN PRE-ENABLE ACTIONS");
  assertIncludes("PROJECT_GUIDE", guide, "COMPLETE WITH OPEN PRE-ENABLE ACTIONS");
  assertIncludes("readiness", readiness, "COMPLETE WITH OPEN PRE-ENABLE ACTIONS");
  assertIncludes("lib/intelligence/README", intelReadme, "COMPLETE WITH OPEN PRE-ENABLE ACTIONS");

  assertIncludes("ROADMAP_v2", roadmap, "Pre-Beta Enablement Gate");
  assertIncludes("handoff", handoff, "Resume criteria");
  assertIncludes("lib/intelligence/README", intelReadme, "Resume criteria");

  assertIncludes("handoff", handoff, "multi-turn");
  assertIncludes("lib/intelligence/README", intelReadme, "deferred");

  // Must not falsely mark S8-IIP-011 as never started / only deferred
  assert(
    "CURRENT_PROJECT_STATE does not say S8-IIP-011 deferred-only",
    !/S8-IIP-011\*\*.*Deferred/i.test(state) && !state.includes("| **S8-IIP-011** | **Deferred**"),
  );
  assert(
    "PROJECT_GUIDE does not mark S8-IIP-011 Deferred",
    !guide.includes("| **S8-IIP-011** | **Deferred**"),
  );

  // Must record NOT APPROVED and must not claim GA / public launch readiness as achieved
  for (const [label, text] of [
    ["handoff", handoff],
    ["CURRENT_PROJECT_STATE", state],
    ["ROADMAP_v2", roadmap],
  ]) {
    assert(
      `${label} records public launch NOT APPROVED`,
      /NOT APPROVED/i.test(text),
    );
    assert(
      `${label} does not claim Generally available as status`,
      !/\*\*Generally available\*\*/.test(text) && !/Status[^.\n]{0,40}Generally available/i.test(text),
    );
  }

  assertIncludes("ops", ops, "PRE-BETA ENABLEMENT PENDING");
  assertIncludes("ops", ops, "NOT APPROVED");

  // No source-code feature claims that these docs invent new runtime features
  assert(
    "handoff does not claim streaming implemented",
    !/streaming[^.\n]{0,30}implemented/i.test(handoff),
  );
  assert(
    "README does not document RAG as existing",
    !/RAG[^.\n]{0,40}implemented/i.test(intelReadme),
  );

  console.log("\nPASS: S8-IIP-012 sprint freeze documentation verification\n");
}

main();
