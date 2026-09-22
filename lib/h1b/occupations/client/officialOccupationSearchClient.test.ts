import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOfficialOccupationSearchPath,
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
});
