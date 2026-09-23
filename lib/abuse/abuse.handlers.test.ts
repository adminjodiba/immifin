import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { handleOfficialOccupationSearchRequest } from "@/lib/h1b/occupations/handleOfficialOccupationSearchRequest";
import { handleWorksiteGeographyRequest } from "@/lib/h1b/geo/api/handleWorksiteGeographyRequest";
import { handleOfficialWageLookupRequest } from "@/lib/h1b/wage/handleOfficialWageLookupRequest";
import { handleOfficialEstimateRequest } from "@/lib/h1b/wage/estimator/handleOfficialEstimateRequest";
import { createEmptyOfficialOccupationDisplayEnricher } from "@/lib/h1b/occupations/officialOccupationDisplayEnrichment";
import { OFFICIAL_OCCUPATION_SEARCH_MAX_QUERY_CHARS } from "@/lib/h1b/occupations/officialOccupationSearch.types";
import { ABUSE_THROTTLED_MESSAGE } from "@/lib/abuse/abuse.types";
import type { AbuseStore } from "@/lib/abuse/stores/abuseStore";

const SECRET = "immifin-test-abuse-identity-secret";

function denyingStore(calls: { count: number }): AbuseStore {
  return {
    async check() {
      calls.count += 1;
      return { allowed: false, retryAfterSeconds: 7, exhaustedWindowId: "short" };
    },
  };
}

function allowingStore(calls: { count: number }): AbuseStore {
  return {
    async check() {
      calls.count += 1;
      return { allowed: true };
    },
  };
}

const abuseAllow = (store: AbuseStore) => ({
  secret: SECRET,
  userId: null,
  clientIp: "203.0.113.10",
  store,
});

describe("H-1B handler abuse wiring", () => {
  it("does not consume occupation budget for an invalid query", async () => {
    const calls = { count: 0 };
    const response = await handleOfficialOccupationSearchRequest(
      new Request(
        `http://localhost:3000/api/h1b/official-occupations?q=${"x".repeat(OFFICIAL_OCCUPATION_SEARCH_MAX_QUERY_CHARS + 1)}`,
      ),
      {
        async loadActiveAllIndustriesDatasets() {
          throw new Error("should not load");
        },
        async loadOccupations() {
          throw new Error("should not load");
        },
      },
      createEmptyOfficialOccupationDisplayEnricher(),
      { abuse: abuseAllow(denyingStore(calls)) },
    );
    assert.equal(response.status, 400);
    assert.equal(calls.count, 0);
  });

  it("does not consume geography budget for invalid JSON", async () => {
    const calls = { count: 0 };
    let resolved = 0;
    const response = await handleWorksiteGeographyRequest(
      new Request("http://localhost:3000/api/h1b/worksite-geography", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ zip: "77433", area_code: "26420" }),
      }),
      async () => {
        resolved += 1;
        throw new Error("should not resolve");
      },
      { abuse: abuseAllow(denyingStore(calls)) },
    );
    assert.equal(response.status, 400);
    assert.equal(calls.count, 0);
    assert.equal(resolved, 0);
  });

  it("returns 429 for a throttled official-estimate and skips expensive work", async () => {
    const calls = { count: 0 };
    let resolved = 0;
    const response = await handleOfficialEstimateRequest(
      new Request("http://localhost:3000/api/h1b/official-estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          soc_code: "15-1252",
          zip: "77433",
          annual_salary: 185000,
          experience: "4-6",
          education: "Master",
        }),
      }),
      async () => {
        resolved += 1;
        throw new Error("should not resolve");
      },
      {
        async loadActiveAllIndustriesDatasets() {
          throw new Error("should not load");
        },
        async loadOccupation() {
          return null;
        },
        async loadArea() {
          return null;
        },
        async loadWageRecord() {
          return null;
        },
      },
      createEmptyOfficialOccupationDisplayEnricher(),
      { abuse: abuseAllow(denyingStore(calls)) },
    );
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Retry-After"), "30");
    assert.deepEqual(await response.json(), { error: ABUSE_THROTTLED_MESSAGE });
    assert.equal(calls.count, 1);
    assert.equal(resolved, 0);
  });

  it("returns 429 for throttled official-wage and skips lookup", async () => {
    const calls = { count: 0 };
    let resolved = 0;
    const response = await handleOfficialWageLookupRequest(
      new Request("http://localhost:3000/api/h1b/official-wage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ soc_code: "15-1252", zip: "77433" }),
      }),
      async () => {
        resolved += 1;
        throw new Error("should not resolve");
      },
      {
        async loadActiveAllIndustriesDatasets() {
          throw new Error("should not load");
        },
        async loadOccupation() {
          return null;
        },
        async loadArea() {
          return null;
        },
        async loadWageRecord() {
          return null;
        },
      },
      { abuse: abuseAllow(denyingStore(calls)) },
    );
    assert.equal(response.status, 429);
    assert.equal(calls.count, 1);
    assert.equal(resolved, 0);
  });

  it("preserves occupation search behavior when the gate allows", async () => {
    const calls = { count: 0 };
    const response = await handleOfficialOccupationSearchRequest(
      new Request("http://localhost:3000/api/h1b/official-occupations?q=software"),
      {
        async loadActiveAllIndustriesDatasets() {
          return [{ id: "runtime-selected-id" }];
        },
        async loadOccupations() {
          return [{ socCode: "15-1252", title: "Software Developers" }];
        },
      },
      createEmptyOfficialOccupationDisplayEnricher(),
      { abuse: abuseAllow(allowingStore(calls)) },
    );
    assert.equal(response.status, 200);
    assert.equal(calls.count, 1);
    const body = (await response.json()) as { results: { soc_code: string }[] };
    assert.equal(body.results[0]?.soc_code, "15-1252");
  });
});
