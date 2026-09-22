import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOfficialOccupationSearchPath } from "@/lib/h1b/occupations/client/officialOccupationSearchClient";

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
});
