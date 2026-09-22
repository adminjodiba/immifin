import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { filterOfficialOccupations } from "@/lib/h1b/occupations/filterOfficialOccupations";
import { handleOfficialOccupationSearchRequest } from "@/lib/h1b/occupations/handleOfficialOccupationSearchRequest";
import {
  OCCUPATION_SEARCH_REASON,
  OFFICIAL_OCCUPATION_SEARCH_LIMIT,
  OFFICIAL_OCCUPATION_SEARCH_MAX_QUERY_CHARS,
  type OfficialOccupationRow,
  type OfficialOccupationSearchStore,
} from "@/lib/h1b/occupations/officialOccupationSearch.types";
import { validateOfficialOccupationSearchQuery } from "@/lib/h1b/occupations/officialOccupationSearch.validation";
import { searchOfficialOccupations } from "@/lib/h1b/occupations/searchOfficialOccupations";

const SAMPLE: OfficialOccupationRow[] = [
  { socCode: "15-1252", title: "Software Developers" },
  { socCode: "15-1253", title: "Software Quality Assurance Analysts and Testers" },
  { socCode: "15-1211", title: "Computer Systems Analysts" },
  { socCode: "15-1299", title: "Computer Occupations, All Other" },
  { socCode: "11-9032", title: "Education Administrators, Kindergarten through Secondary" },
  { socCode: "11-1021", title: "General and Operations Managers" },
  { socCode: "11-2021", title: "Marketing Managers" },
  { socCode: "13-1111", title: "Management Analysts" },
];

function store(occupations = SAMPLE): OfficialOccupationSearchStore {
  return {
    async loadActiveAllIndustriesDatasets() {
      return [{ id: "runtime-selected-id" }];
    },
    async loadOccupations() {
      return occupations;
    },
  };
}

function getRequest(query: string): Request {
  const url = new URL("http://localhost:3000/api/h1b/official-occupations");
  if (query !== "") {
    url.search = query.startsWith("q=") || query.startsWith("q=%") ? query : `q=${encodeURIComponent(query)}`;
  }
  return new Request(url, { method: "GET" });
}

describe("validateOfficialOccupationSearchQuery", () => {
  it("trims and collapses surrounding/internal whitespace", () => {
    assert.equal(validateOfficialOccupationSearchQuery("  software   developer  "), "software developer");
  });

  it("rejects excessive query length", () => {
    const raw = "x".repeat(OFFICIAL_OCCUPATION_SEARCH_MAX_QUERY_CHARS + 1);
    assert.throws(() => validateOfficialOccupationSearchQuery(raw), /too long/i);
  });

  it("accepts an empty query", () => {
    assert.equal(validateOfficialOccupationSearchQuery("   "), "");
  });
});

describe("filterOfficialOccupations", () => {
  it("returns empty results for an empty query", () => {
    assert.deepEqual(filterOfficialOccupations(SAMPLE, ""), []);
  });

  it("matches software developer case-insensitively", () => {
    const lower = filterOfficialOccupations(SAMPLE, "software developer");
    const mixed = filterOfficialOccupations(SAMPLE, "Software Developer");
    assert.equal(lower[0]?.socCode, "15-1252");
    assert.equal(lower[0]?.title, "Software Developers");
    assert.deepEqual(lower, mixed);
  });

  it("matches exact SOC 15-1252 first", () => {
    const results = filterOfficialOccupations(SAMPLE, "15-1252");
    assert.equal(results.length, 1);
    assert.equal(results[0]?.socCode, "15-1252");
  });

  it("matches SOC prefix 15-12", () => {
    const results = filterOfficialOccupations(SAMPLE, "15-12");
    assert.ok(results.some((row) => row.socCode === "15-1252"));
    assert.ok(results.every((row) => row.socCode.startsWith("15-12")));
  });

  it("returns empty results for nonexistent text", () => {
    assert.deepEqual(filterOfficialOccupations(SAMPLE, "underwater basket weaving"), []);
  });

  it("returns empty results for a well-formed unknown SOC", () => {
    assert.deepEqual(filterOfficialOccupations(SAMPLE, "99-9999"), []);
  });

  it("matches punctuation in an official title", () => {
    const results = filterOfficialOccupations(
      SAMPLE,
      "Education Administrators, Kindergarten through Secondary",
    );
    assert.equal(results[0]?.socCode, "11-9032");
  });

  it("bounds broad-term results and keeps deterministic title/soc order", () => {
    const many: OfficialOccupationRow[] = Array.from({ length: 40 }, (_, index) => ({
      socCode: `11-${String(index).padStart(4, "0")}`,
      title: `Managers, Variant ${String(index).padStart(2, "0")}`,
    }));
    const results = filterOfficialOccupations(many, "manager");
    assert.equal(results.length, OFFICIAL_OCCUPATION_SEARCH_LIMIT);
    const codes = results.map((row) => row.socCode);
    const sorted = [...codes].sort((a, b) => a.localeCompare(b, "en"));
    assert.deepEqual(codes, sorted);
  });
});

describe("searchOfficialOccupations", () => {
  it("fails closed when no single ACTIVE All Industries dataset exists", async () => {
    const result = await searchOfficialOccupations("software", {
      async loadActiveAllIndustriesDatasets() {
        return [];
      },
      async loadOccupations() {
        throw new Error("must not load occupations without an active dataset");
      },
    });

    assert.equal(result.outcome, "UNAVAILABLE");
    assert.equal(result.reason_code, OCCUPATION_SEARCH_REASON.UNAVAILABLE_DATASET_INACTIVE);
    assert.deepEqual(result.results, []);
  });

  it("does not load occupations for an empty query", async () => {
    const result = await searchOfficialOccupations("", {
      async loadActiveAllIndustriesDatasets() {
        return [{ id: "runtime-selected-id" }];
      },
      async loadOccupations() {
        throw new Error("empty query must not load official occupations");
      },
    });
    assert.equal(result.outcome, "AUTO");
    assert.deepEqual(result.results, []);
  });

  it("does not expose dataset UUID in the public response", async () => {
    const result = await searchOfficialOccupations("15-1252", store());
    const text = JSON.stringify(result);
    assert.equal(text.includes("runtime-selected-id"), false);
    assert.equal("id" in result, false);
  });
});

describe("handleOfficialOccupationSearchRequest", () => {
  it("normalizes whitespace on GET q", async () => {
    const response = await handleOfficialOccupationSearchRequest(
      getRequest("  software developer  "),
      store(),
    );
    assert.equal(response.status, 200);
    const body = (await response.json()) as { outcome: string; results: { soc_code: string }[] };
    assert.equal(body.results[0]?.soc_code, "15-1252");
    assert.equal("reason_code" in body, false);
    assert.equal(body.outcome, "AUTO");
  });

  it("returns a controlled 400 for excessive query length", async () => {
    const response = await handleOfficialOccupationSearchRequest(
      getRequest("x".repeat(OFFICIAL_OCCUPATION_SEARCH_MAX_QUERY_CHARS + 1)),
      store(),
    );
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Query is too long.");
  });

  it("returns empty results for an omitted query", async () => {
    const response = await handleOfficialOccupationSearchRequest(getRequest(""), store());
    assert.equal(response.status, 200);
    const body = (await response.json()) as { results: unknown[] };
    assert.deepEqual(body.results, []);
  });

  it("returns a controlled 500 without leaking internals", async () => {
    const response = await handleOfficialOccupationSearchRequest(getRequest("software"), {
      async loadActiveAllIndustriesDatasets() {
        throw new Error("secret connection string postgres://internal");
      },
      async loadOccupations() {
        return [];
      },
    });
    assert.equal(response.status, 500);
    const body = (await response.json()) as { error: string };
    assert.equal(body.error, "Unable to search official occupations.");
    const text = JSON.stringify(body);
    assert.equal(text.includes("postgres://"), false);
    assert.equal(text.includes("secret"), false);
  });
});

describe("official occupation implementation boundary", () => {
  it("does not use the curated 722 seed or wage records", () => {
    const files = [
      "lib/h1b/occupations/officialOccupationSearch.types.ts",
      "lib/h1b/occupations/officialOccupationSearch.validation.ts",
      "lib/h1b/occupations/filterOfficialOccupations.ts",
      "lib/h1b/occupations/searchOfficialOccupations.ts",
      "lib/h1b/occupations/officialOccupationSearchStore.ts",
      "lib/h1b/occupations/handleOfficialOccupationSearchRequest.ts",
      "app/api/h1b/official-occupations/route.ts",
    ];
    const forbidden = [
      "socOccupationsSeed",
      "occupationService",
      "SOC_OCCUPATIONS",
      "oflc_wage_records",
    ];
    for (const file of files) {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      for (const token of forbidden) {
        assert.equal(text.includes(token), false, `${file} contains ${token}`);
      }
    }
  });
});
