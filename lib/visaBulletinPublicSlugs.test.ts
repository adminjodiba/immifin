import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPublicVisaBulletinCanonicalPath,
  getPublicVisaBulletinCategoryConfig,
  getPublicVisaBulletinCountryConfig,
  isPublicVisaBulletinCategorySlug,
  isPublicVisaBulletinCountrySlug,
  listPublicVisaBulletinCombinations,
  listPublicVisaBulletinStaticParams,
} from "./visaBulletinPublicSlugs";

describe("public Visa Bulletin slug allowlist", () => {
  it("represents exactly 15 valid category/country combinations", () => {
    const combinations = listPublicVisaBulletinCombinations();
    const unique = new Set(combinations.map((item) => item.canonicalPath));

    assert.equal(combinations.length, 15);
    assert.equal(unique.size, 15);
    assert.equal(listPublicVisaBulletinStaticParams().length, 15);
  });

  it("validates eb2 + india", () => {
    assert.equal(isPublicVisaBulletinCategorySlug("eb2"), true);
    assert.equal(isPublicVisaBulletinCountrySlug("india"), true);
    assert.equal(
      getPublicVisaBulletinCanonicalPath("eb2", "india"),
      "/immigration/visa-bulletin/eb2/india",
    );
    assert.equal(getPublicVisaBulletinCategoryConfig("eb2")?.matchKey, "EB2");
    assert.equal(getPublicVisaBulletinCategoryConfig("eb2")?.displayLabel, "EB-2");
    assert.equal(getPublicVisaBulletinCountryConfig("india")?.matchValue, "India");
  });

  it("validates eb3 + philippines", () => {
    assert.equal(isPublicVisaBulletinCategorySlug("eb3"), true);
    assert.equal(isPublicVisaBulletinCountrySlug("philippines"), true);
    assert.equal(
      getPublicVisaBulletinCanonicalPath("eb3", "philippines"),
      "/immigration/visa-bulletin/eb3/philippines",
    );
  });

  it("validates eb1 + rest-of-the-world", () => {
    assert.equal(isPublicVisaBulletinCategorySlug("eb1"), true);
    assert.equal(isPublicVisaBulletinCountrySlug("rest-of-the-world"), true);
    assert.deepEqual(getPublicVisaBulletinCountryConfig("rest-of-the-world"), {
      slug: "rest-of-the-world",
      matchValue: "Rest of the World",
      displayLabel: "Rest of the World",
    });
    assert.equal(
      getPublicVisaBulletinCanonicalPath("eb1", "rest-of-the-world"),
      "/immigration/visa-bulletin/eb1/rest-of-the-world",
    );
  });

  it("rejects eb-2 as a canonical category slug", () => {
    assert.equal(isPublicVisaBulletinCategorySlug("eb-2"), false);
    assert.equal(getPublicVisaBulletinCategoryConfig("eb-2"), null);
    assert.equal(getPublicVisaBulletinCanonicalPath("eb-2", "india"), null);
  });

  it("rejects EB2 as a canonical category slug", () => {
    assert.equal(isPublicVisaBulletinCategorySlug("EB2"), false);
    assert.equal(getPublicVisaBulletinCategoryConfig("EB2"), null);
    assert.equal(getPublicVisaBulletinCanonicalPath("EB2", "india"), null);
  });

  it("rejects eb4", () => {
    assert.equal(isPublicVisaBulletinCategorySlug("eb4"), false);
    assert.equal(getPublicVisaBulletinCanonicalPath("eb4", "india"), null);
  });

  it("rejects canada", () => {
    assert.equal(isPublicVisaBulletinCountrySlug("canada"), false);
    assert.equal(getPublicVisaBulletinCanonicalPath("eb2", "canada"), null);
  });

  it("rejects row as a canonical country slug", () => {
    assert.equal(isPublicVisaBulletinCountrySlug("row"), false);
    assert.equal(isPublicVisaBulletinCountrySlug("other"), false);
    assert.equal(getPublicVisaBulletinCanonicalPath("eb1", "row"), null);
  });
});
