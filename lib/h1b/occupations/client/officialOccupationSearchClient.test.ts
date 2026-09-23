import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOfficialOccupationSearchPath,
  fetchOfficialOccupations,
  nextOccupationSearchThrottleUntilMs,
  occupationSearchShouldPause,
  parseOfficialOccupationSearchResponse,
} from "@/lib/h1b/occupations/client/officialOccupationSearchClient";

describe("officialOccupationSearchClient", () => {
  it("builds a GET path with only q", () => {
    const path = buildOfficialOccupationSearchPath("software developer");
    assert.equal(path.startsWith("/api/h1b/official-occupations?"), true);
    const params = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    assert.equal(params.get("q"), "software developer");
    assert.equal([...params.keys()].join(","), "q");
  });

  it("preserves SOC queries without extra authority fields", () => {
    const path = buildOfficialOccupationSearchPath("15-1252");
    const params = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    assert.equal(params.get("q"), "15-1252");
    assert.equal(params.has("area_code"), false);
    assert.equal(params.has("dataset_id"), false);
  });

  it("parses approved display enrichment without requiring reason_code", () => {
    const parsed = parseOfficialOccupationSearchResponse({
      outcome: "AUTO",
      results: [
        {
          soc_code: "15-1252",
          title: "Software Developers",
          group: "Computer & Mathematical Occupations",
          common_job_titles: ["software engineer"],
          typical_h1b: true,
          match_confidence: "High",
        },
      ],
    });
    assert.equal(parsed?.outcome, "AUTO");
    assert.equal(parsed?.results[0]?.soc_code, "15-1252");
    assert.equal(parsed?.results[0]?.typical_h1b, true);
    assert.equal(parsed?.results[0]?.match_confidence, "High");
    assert.equal(parsed ? "reason_code" in parsed : true, false);
  });

  it("maps HTTP 429 to kind throttled and pauses autocomplete", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }), {
        status: 429,
        headers: { "Retry-After": "60", "Content-Type": "application/json" },
      });
    try {
      const result = await fetchOfficialOccupations("software");
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.kind, "throttled");
        assert.equal(result.retryAfterSeconds, 60);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.equal(occupationSearchShouldPause(2_000, 1_000), true);
    assert.equal(occupationSearchShouldPause(1_000, 2_000), false);
    assert.equal(nextOccupationSearchThrottleUntilMs(30, 1_000), 31_000);
  });
});
