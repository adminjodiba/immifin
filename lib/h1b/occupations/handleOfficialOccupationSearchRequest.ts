import { NextResponse } from "next/server";
import {
  createEmptyOfficialOccupationDisplayEnricher,
  type OfficialOccupationDisplayEnricher,
} from "@/lib/h1b/occupations/officialOccupationDisplayEnrichment";
import { searchOfficialOccupations } from "@/lib/h1b/occupations/searchOfficialOccupations";
import type {
  OfficialOccupationSearchApiErrorBody,
  OfficialOccupationSearchDisplayResponse,
  OfficialOccupationSearchStore,
} from "@/lib/h1b/occupations/officialOccupationSearch.types";
import {
  OfficialOccupationSearchApiRequestError,
  validateOfficialOccupationSearchQuery,
} from "@/lib/h1b/occupations/officialOccupationSearch.validation";

const NO_STORE = "no-store";

function jsonError(message: string, status: number): NextResponse<OfficialOccupationSearchApiErrorBody> {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": NO_STORE } },
  );
}

export async function handleOfficialOccupationSearchRequest(
  request: Request,
  store: OfficialOccupationSearchStore,
  enricher: OfficialOccupationDisplayEnricher = createEmptyOfficialOccupationDisplayEnricher(),
): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const rawQuery = url.searchParams.get("q") ?? "";
    const normalized = validateOfficialOccupationSearchQuery(rawQuery);
    const result = await searchOfficialOccupations(normalized, store);
    const body: OfficialOccupationSearchDisplayResponse = {
      outcome: result.outcome,
      results: result.results.map((row) => ({
        soc_code: row.soc_code,
        title: row.title,
        ...enricher.enrich({ socCode: row.soc_code, query: normalized }),
      })),
    };

    return NextResponse.json(body, {
      status: 200,
      headers: { "Cache-Control": NO_STORE },
    });
  } catch (error: unknown) {
    if (error instanceof OfficialOccupationSearchApiRequestError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Unable to search official occupations.", 500);
  }
}
