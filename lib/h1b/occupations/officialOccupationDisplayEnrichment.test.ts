import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createSeedOfficialOccupationDisplayEnricher,
  enrichOfficialOccupationDisplay,
  OFFICIAL_OCCUPATION_COMMON_TITLE_LIMIT,
} from "@/lib/h1b/occupations/officialOccupationDisplayEnrichment";
import { handleOfficialOccupationSearchRequest } from "@/lib/h1b/occupations/handleOfficialOccupationSearchRequest";
import type { OfficialOccupationSearchStore } from "@/lib/h1b/occupations/officialOccupationSearch.types";

describe("enrichOfficialOccupationDisplay", () => {
  it("returns selected-occupation display fields without scores for Software Developers", () => {
    const enrichment = enrichOfficialOccupationDisplay({
      socCode: "15-1252",
      query: "software engineer",
    });
    assert.equal(enrichment.group, "Computer & Mathematical Occupations");
    assert.equal(enrichment.typical_h1b, true);
    assert.equal(enrichment.match_confidence, "High");
    assert.ok(enrichment.common_job_titles.includes("software engineer"));
    assert.ok(enrichment.common_job_titles.length <= OFFICIAL_OCCUPATION_COMMON_TITLE_LIMIT);
    assert.equal("matchScore" in enrichment, false);
    assert.equal("matchedOn" in enrichment, false);
    assert.equal("keywords" in enrichment, false);
  });

  it("returns empty display enrichment for an official SOC without seed metadata", () => {
    const enrichment = enrichOfficialOccupationDisplay({
      socCode: "99-9999",
      query: "unknown",
    });
    assert.deepEqual(enrichment, {
      group: null,
      common_job_titles: [],
      typical_h1b: false,
      match_confidence: null,
    });
  });
});

describe("official occupation search display enrichment", () => {
  it("attaches selected-row enrichment after official search", async () => {
    const store: OfficialOccupationSearchStore = {
      async loadActiveAllIndustriesDatasets() {
        return [{ id: "runtime-selected-id" }];
      },
      async loadOccupations() {
        return [{ socCode: "15-1252", title: "Software Developers" }];
      },
    };
    const response = await handleOfficialOccupationSearchRequest(
      new Request("http://localhost:3000/api/h1b/official-occupations?q=software%20developer"),
      store,
      createSeedOfficialOccupationDisplayEnricher(),
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      results: Array<{
        soc_code: string;
        title: string;
        group: string | null;
        typical_h1b: boolean;
        common_job_titles: string[];
        match_confidence: string | null;
      }>;
    };
    assert.equal(body.results[0]?.soc_code, "15-1252");
    assert.equal(body.results[0]?.title, "Software Developers");
    assert.equal(body.results[0]?.group, "Computer & Mathematical Occupations");
    assert.equal(body.results[0]?.typical_h1b, true);
    assert.equal(body.results[0]?.match_confidence, "High");
    assert.ok(body.results[0]?.common_job_titles.includes("software developer"));
    assert.equal(JSON.stringify(body).includes("runtime-selected-id"), false);
    assert.equal(JSON.stringify(body).includes("matchScore"), false);
  });
});
