import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listPublicVisaBulletinCombinations } from "@/lib/visaBulletinPublicSlugs";
import { listVisaBulletinRevalidatePaths } from "./refreshVisaBulletinData";

describe("Visa Bulletin refresh revalidation (S7A-SEO-VB-DYNAMIC-005)", () => {
  it("preserves existing bulletin/API revalidate paths", () => {
    const paths = listVisaBulletinRevalidatePaths();

    for (const path of [
      "/api/visa-bulletin",
      "/api/visa-bulletin-history",
      "/api/visa-bulletin-movement",
      "/immigration/visa-bulletin",
      "/immigration/visa-bulletin-movement",
    ]) {
      assert.equal(paths.includes(path), true, path);
    }
  });

  it("revalidates all 15 canonical public search paths from the slug model", () => {
    const paths = listVisaBulletinRevalidatePaths();
    const combinations = listPublicVisaBulletinCombinations();

    assert.equal(combinations.length, 15);

    for (const combination of combinations) {
      assert.equal(paths.includes(combination.canonicalPath), true, combination.canonicalPath);
    }
  });
});
