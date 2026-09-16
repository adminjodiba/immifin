/**
 * S7A-DS2-WHAT-USERS-SAY-002 — daily ticker selection helpers.
 * Run: npx tsx scripts/verify-s7a-ds2-what-users-say-002.mjs
 */

import {
  WHAT_USERS_SAY_CANDIDATE_LIMIT,
  WHAT_USERS_SAY_MAX_TESTIMONIALS,
  WHAT_USERS_SAY_PUBLIC_COLUMNS,
  buildWhatUsersSaySnapshot,
  distributeIntoFourRows,
  pickUniqueTopTestimonials,
  rowSizesForCount,
} from "../lib/feedback/whatUsersSay.ts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function candidate(id, profileId, rating = 5, createdAt = "2026-09-01T00:00:00.000Z") {
  return {
    id,
    profileId,
    rating,
    feedbackText: `Story ${id}`.padEnd(12, "."),
    displayName: `Person ${profileId.replace("p", "")}`,
    createdAt,
  };
}

function main() {
  assert("100 distribution", rowSizesForCount(100).join("/") === "25/25/25/25");
  assert("80 distribution", rowSizesForCount(80).join("/") === "20/20/20/20");
  assert("63 distribution", rowSizesForCount(63).join("/") === "16/16/16/15");
  assert("10 distribution", rowSizesForCount(10).join("/") === "3/3/2/2");
  assert("3 distribution", rowSizesForCount(3).join("/") === "1/1/1/0");
  assert("0 distribution", rowSizesForCount(0).join("/") === "0/0/0/0");

  const ten = Array.from({ length: 10 }, (_, index) => ({
    key: `wus-${index + 1}`,
    rating: 5,
    feedbackText: "text",
    displayName: "IMMIFIN User",
    createdAt: "2026-09-01T00:00:00.000Z",
  }));
  const tenRows = distributeIntoFourRows(ten);
  assert("round-robin 10 sizes match 3/3/2/2", tenRows.map((row) => row.length).join("/") === "3/3/2/2");
  assert(
    "no duplication across rows",
    new Set(tenRows.flat().map((item) => item.key)).size === 10,
  );

  const sixtyThree = distributeIntoFourRows(
    Array.from({ length: 63 }, (_, index) => ({
      key: `wus-${index + 1}`,
      rating: 5,
      feedbackText: "text",
      displayName: "IMMIFIN User",
      createdAt: "2026-09-01T00:00:00.000Z",
    })),
  );
  assert("round-robin 63 sizes match 16/16/16/15", sixtyThree.map((row) => row.length).join("/") === "16/16/16/15");

  const ranked = [
    candidate("a", "u1", 5, "2026-09-02T00:00:00.000Z"),
    candidate("b", "u1", 5, "2026-09-01T00:00:00.000Z"),
    candidate("c", "u2", 4, "2026-09-03T00:00:00.000Z"),
  ];
  const unique = pickUniqueTopTestimonials(ranked);
  assert("one per user keeps first ranked", unique.map((row) => row.id).join(",") === "a,c");

  const snapshot = buildWhatUsersSaySnapshot(
    Array.from({ length: 250 }, (_, index) =>
      candidate(`id-${index}`, `p${index % 120}`, index % 5 === 0 ? 5 : 4, `2026-09-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`),
    ),
  );
  assert("caps at 100 unique users", snapshot.selectedCount === 100);
  assert("public payload has no profile id", !JSON.stringify(snapshot).includes('"profileId"'));
  assert("candidate window is bounded", WHAT_USERS_SAY_CANDIDATE_LIMIT === 500);
  assert("max testimonials is 100", WHAT_USERS_SAY_MAX_TESTIMONIALS === 100);

  const serviceSource = readFileSync(resolve("lib/feedback/whatUsersSayService.ts"), "utf8");
  assert("pool eligibility uses approved", serviceSource.includes('.eq("moderation_status", "approved")'));
  assert("pool eligibility uses publication permission", serviceSource.includes('.eq("publication_permission", true)'));
  assert("query is bounded", serviceSource.includes("WHAT_USERS_SAY_CANDIDATE_LIMIT"));
  assert("cache tag is what-users-say-daily", serviceSource.includes("WHAT_USERS_SAY_CACHE_TAG"));
  assert("does not select star", !serviceSource.includes('.select("*")'));
  assert("pool query columns omit email", !WHAT_USERS_SAY_PUBLIC_COLUMNS.includes("email"));
  assert("identity is resolved before snapshot", serviceSource.includes("resolvePublicTestimonialIdentity"));
  assert("does not select moderation_note", !serviceSource.includes("moderation_note"));

  console.log("\nAll What Users Say selection checks passed.");
}

main();
