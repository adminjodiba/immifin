import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listPublicVisaBulletinCombinations } from "@/lib/visaBulletinPublicSlugs";
import sitemap, { listPublicSitemapPaths } from "./sitemap";

describe("public sitemap cutover (S7A-SEO-VB-DYNAMIC-005)", () => {
  it("lists exactly 29 public URLs", () => {
    const paths = listPublicSitemapPaths();
    const entries = sitemap();

    assert.equal(paths.length, 29);
    assert.equal(entries.length, 29);
    assert.equal(new Set(paths).size, 29);
  });

  it("includes all 15 canonical Visa Bulletin search paths from the slug model", () => {
    const paths = listPublicSitemapPaths();
    const combinations = listPublicVisaBulletinCombinations();

    assert.equal(combinations.length, 15);

    for (const combination of combinations) {
      assert.equal(paths.includes(combination.canonicalPath), true, combination.canonicalPath);
    }
  });

  it("does not list the private parent, History, Movement, or invalid aliases", () => {
    const paths = listPublicSitemapPaths();
    const forbidden = [
      "/immigration/visa-bulletin",
      "/immigration/visa-bulletin-history",
      "/immigration/visa-bulletin-movement",
      "/immigration/visa-bulletin-dashboard-2",
      "/immigration/visa-bulletin/eb4/india",
      "/immigration/visa-bulletin/eb2/canada",
      "/immigration/visa-bulletin/eb-2/india",
      "/immigration/visa-bulletin/eb2/row",
      "/dashboard",
      "/user-profile",
      "/intelligence",
      "/admin",
    ];

    for (const path of forbidden) {
      assert.equal(paths.includes(path), false, path);
    }
  });

  it("emits absolute immifin.com URLs for the search matrix", () => {
    const urls = sitemap().map((entry) => entry.url);

    assert.equal(urls.includes("https://immifin.com/immigration/visa-bulletin"), false);
    assert.equal(urls.includes("https://immifin.com/immigration/visa-bulletin/eb2/india"), true);
    assert.equal(
      urls.includes("https://immifin.com/immigration/visa-bulletin/eb1/rest-of-the-world"),
      true,
    );
  });
});
