import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listPublicVisaBulletinCombinations } from "@/lib/visaBulletinPublicSlugs";
import {
  PUBLIC_ROUTE_PATTERNS,
  isPublicCurrentVisaBulletinPath,
  isPublicVisaBulletinSearchPath,
} from "./publicRoutes";
import { isPublicNavigationPath, requiresAuthForNavigation } from "./publicNavigation";

describe("isPublicCurrentVisaBulletinPath", () => {
  it("matches only the canonical Current Visa Bulletin route", () => {
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin"), true);
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin?type=filing"), true);
  });

  it("does not match History, Movement, hub, API siblings, or search children", () => {
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin-history"), false);
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin-movement"), false);
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin-dashboard-2"), false);
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration"), false);
    assert.equal(isPublicCurrentVisaBulletinPath("/api/visa-bulletin"), false);
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin/eb2/india"), false);
  });
});

describe("isPublicVisaBulletinSearchPath", () => {
  it("allows exactly the 15 canonical two-segment combinations", () => {
    const combinations = listPublicVisaBulletinCombinations();
    assert.equal(combinations.length, 15);

    for (const combination of combinations) {
      assert.equal(isPublicVisaBulletinSearchPath(combination.canonicalPath), true, combination.canonicalPath);
    }
  });

  it("allows the two-segment shape so invalid slugs can reach notFound()", () => {
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin/eb4/india"), true);
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin/eb2/canada"), true);
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin/eb-2/india"), true);
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin/eb2/row"), true);
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin/foo/bar"), true);
  });

  it("does not match parent, History, Movement, one-segment, or extra-segment paths", () => {
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin"), false);
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin-history"), false);
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin-movement"), false);
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin-dashboard-2"), false);
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin/eb2"), false);
    assert.equal(isPublicVisaBulletinSearchPath("/immigration/visa-bulletin/eb2/india/extra"), false);
    assert.equal(isPublicVisaBulletinSearchPath("/api/visa-bulletin"), false);
    assert.equal(isPublicVisaBulletinSearchPath("/api/visa-bulletin-history"), false);
    assert.equal(isPublicVisaBulletinSearchPath("/api/visa-bulletin-movement"), false);
  });
});

describe("public navigation chrome for Current Visa Bulletin", () => {
  it("treats the parent Current Visa Bulletin Dashboard as Login Required", () => {
    assert.equal(isPublicNavigationPath("/immigration/visa-bulletin"), false);
    assert.equal(requiresAuthForNavigation("/immigration/visa-bulletin"), true);
  });

  it("lets unsigned visitors open two-segment search pages without Login Required", () => {
    assert.equal(isPublicNavigationPath("/immigration/visa-bulletin/eb2/india"), true);
    assert.equal(requiresAuthForNavigation("/immigration/visa-bulletin/eb2/india"), false);
    assert.equal(isPublicNavigationPath("/immigration/visa-bulletin/eb1/rest-of-the-world"), true);
  });

  it("keeps History, Movement, dashboard, profile, Intelligence, and Admin behind Login Required", () => {
    const protectedHrefs = [
      "/immigration/visa-bulletin",
      "/immigration/visa-bulletin-history",
      "/immigration/visa-bulletin-movement",
      "/dashboard",
      "/user-profile",
      "/intelligence",
      "/admin",
      "/admin/notifications",
    ];

    for (const href of protectedHrefs) {
      assert.equal(requiresAuthForNavigation(href), true, href);
    }
  });
});

describe("Visa Bulletin public matcher safety (S7A-SEO-VB-DYNAMIC-005)", () => {
  it("never uses a visa-bulletin(.*) public pattern", () => {
    for (const pattern of PUBLIC_ROUTE_PATTERNS) {
      assert.equal(pattern.includes("visa-bulletin(.*)"), false, pattern);
    }
  });

  it("does not allowlist the private parent dashboard or current-bulletin API", () => {
    const patterns = PUBLIC_ROUTE_PATTERNS as readonly string[];
    assert.equal(patterns.includes("/immigration/visa-bulletin"), false);
    assert.equal(patterns.includes("/api/visa-bulletin"), false);
  });

  it("keeps only the two-segment search matcher for Visa Bulletin pages", () => {
    const visaBulletinPagePatterns = PUBLIC_ROUTE_PATTERNS.filter((pattern) =>
      pattern.includes("/immigration/visa-bulletin"),
    );

    assert.deepEqual(visaBulletinPagePatterns, [
      "/immigration/visa-bulletin/:category/:country",
    ]);
  });

  it("does not treat History or Movement lookalikes as public search paths", () => {
    const protectedLookalikes = [
      "/immigration/visa-bulletin-history",
      "/immigration/visa-bulletin-movement",
      "/immigration/visa-bulletin-dashboard-2",
      "/api/visa-bulletin",
      "/api/visa-bulletin-history",
      "/api/visa-bulletin-movement",
    ];

    for (const path of protectedLookalikes) {
      assert.equal(isPublicVisaBulletinSearchPath(path), false, path);
      assert.equal(isPublicNavigationPath(path), false, path);
    }
  });
});
