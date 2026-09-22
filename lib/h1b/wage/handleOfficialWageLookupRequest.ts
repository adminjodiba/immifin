import { NextResponse } from "next/server";
import type { WorksiteGeographyResolver } from "@/lib/h1b/geo/api/handleWorksiteGeographyRequest";
import { lookupOfficialWage } from "@/lib/h1b/wage/lookupOfficialWage";
import type { OfficialWageLookupStore } from "@/lib/h1b/wage/officialWageLookup.types";
import type { OfficialWageLookupApiErrorBody } from "@/lib/h1b/wage/officialWageLookup.types";
import {
  assertOfficialWageLookupContentType,
  OfficialWageLookupApiRequestError,
  readOfficialWageLookupJsonBody,
  validateOfficialWageLookupRequest,
} from "@/lib/h1b/wage/officialWageLookup.validation";

const NO_STORE = "no-store";

function jsonError(message: string, status: number): NextResponse<OfficialWageLookupApiErrorBody> {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": NO_STORE } },
  );
}

export async function handleOfficialWageLookupRequest(
  request: Request,
  resolveWorksiteGeography: WorksiteGeographyResolver,
  store: OfficialWageLookupStore,
): Promise<NextResponse> {
  try {
    assertOfficialWageLookupContentType(request);
    const body = await readOfficialWageLookupJsonBody(request);
    const accepted = validateOfficialWageLookupRequest(body);
    const result = await lookupOfficialWage(accepted, {
      resolveWorksiteGeography,
      store,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": NO_STORE },
    });
  } catch (error: unknown) {
    if (error instanceof OfficialWageLookupApiRequestError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Unable to look up official wages.", 500);
  }
}
