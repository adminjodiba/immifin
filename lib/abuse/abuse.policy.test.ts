import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classForRouteGroup,
  getAbusePolicy,
  policyIdForRouteGroup,
  resolveAbuseWindows,
} from "@/lib/abuse/abuse.policy";

describe("abuse policy registry", () => {
  it("maps occupation search to CLASS 1", () => {
    assert.equal(policyIdForRouteGroup("h1b_occ"), "class-1");
    assert.equal(classForRouteGroup("h1b_occ"), 1);
  });

  it("maps geography to CLASS 2", () => {
    assert.equal(policyIdForRouteGroup("h1b_geo"), "class-2");
    assert.equal(classForRouteGroup("h1b_geo"), 2);
  });

  it("maps official-wage to CLASS 2", () => {
    assert.equal(policyIdForRouteGroup("h1b_wage"), "class-2");
    assert.equal(classForRouteGroup("h1b_wage"), 2);
  });

  it("maps official-estimate to CLASS 3", () => {
    assert.equal(policyIdForRouteGroup("h1b_estimate"), "class-3");
    assert.equal(classForRouteGroup("h1b_estimate"), 3);
  });

  it("shares one CLASS 2 policy budget between geography and official-wage", () => {
    assert.equal(policyIdForRouteGroup("h1b_geo"), policyIdForRouteGroup("h1b_wage"));
    assert.equal(getAbusePolicy("class-2").policyId, "class-2");
  });

  it("resolves anonymous CLASS 1–3 ceilings", () => {
    assert.deepEqual(resolveAbuseWindows(getAbusePolicy("class-1"), "anon"), [
      { id: "short", windowSeconds: 60, limit: 80 },
      { id: "long", windowSeconds: 3600, limit: 600 },
    ]);
    assert.deepEqual(resolveAbuseWindows(getAbusePolicy("class-2"), "anon"), [
      { id: "short", windowSeconds: 60, limit: 30 },
      { id: "long", windowSeconds: 3600, limit: 120 },
    ]);
    assert.deepEqual(resolveAbuseWindows(getAbusePolicy("class-3"), "anon"), [
      { id: "short", windowSeconds: 60, limit: 20 },
      { id: "long", windowSeconds: 3600, limit: 60 },
    ]);
  });

  it("resolves signed-in CLASS 1–3 ceilings at 2x", () => {
    assert.deepEqual(resolveAbuseWindows(getAbusePolicy("class-1"), "user"), [
      { id: "short", windowSeconds: 60, limit: 160 },
      { id: "long", windowSeconds: 3600, limit: 1200 },
    ]);
    assert.deepEqual(resolveAbuseWindows(getAbusePolicy("class-2"), "user"), [
      { id: "short", windowSeconds: 60, limit: 60 },
      { id: "long", windowSeconds: 3600, limit: 240 },
    ]);
    assert.deepEqual(resolveAbuseWindows(getAbusePolicy("class-3"), "user"), [
      { id: "short", windowSeconds: 60, limit: 40 },
      { id: "long", windowSeconds: 3600, limit: 120 },
    ]);
  });
});
