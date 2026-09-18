import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPublicCurrentVisaBulletinPath } from "./publicRoutes";
import { isPublicNavigationPath, requiresAuthForNavigation } from "./publicNavigation";

describe("isPublicCurrentVisaBulletinPath", () => {
  it("matches only the canonical Current Visa Bulletin route", () => {
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin"), true);
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin?type=filing"), true);
  });

  it("does not match History, Movement, hub, or API siblings", () => {
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin-history"), false);
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin-movement"), false);
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration/visa-bulletin-dashboard-2"), false);
    assert.equal(isPublicCurrentVisaBulletinPath("/immigration"), false);
    assert.equal(isPublicCurrentVisaBulletinPath("/api/visa-bulletin"), false);
  });
});

describe("public navigation chrome for Current Visa Bulletin", () => {
  it("lets unsigned visitors open Current Visa Bulletin without Login Required", () => {
    assert.equal(isPublicNavigationPath("/immigration/visa-bulletin"), true);
    assert.equal(requiresAuthForNavigation("/immigration/visa-bulletin"), false);
  });

  it("keeps History, Movement, dashboard, profile, Intelligence, and Admin behind Login Required", () => {
    const protectedHrefs = [
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
