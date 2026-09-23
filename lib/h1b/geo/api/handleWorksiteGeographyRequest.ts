import { NextResponse } from "next/server";
import { enforceAbuseGate, type CheckAbuseGateInput } from "@/lib/abuse/checkAbuseGate";
import { toWorksiteGeographyResponse } from "@/lib/h1b/geo/api/toWorksiteGeographyResponse";
import type { WorksiteGeographyApiErrorBody } from "@/lib/h1b/geo/api/worksiteGeographyApi.types";
import {
  assertWorksiteGeographyContentType,
  readWorksiteGeographyJsonBody,
  validateWorksiteGeographyRequest,
  WorksiteGeographyApiRequestError,
} from "@/lib/h1b/geo/api/worksiteGeographyApi.validation";
import type {
  GeographyResolution,
  ResolveGeographyInput,
} from "@/lib/h1b/geo/geographyResolution.types";

const NO_STORE = "no-store";

function jsonError(message: string, status: number): NextResponse<WorksiteGeographyApiErrorBody> {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": NO_STORE } },
  );
}

export type WorksiteGeographyResolver = (
  input: ResolveGeographyInput,
) => Promise<GeographyResolution>;

export type WorksiteGeographyHandlerOptions = {
  abuse?: Omit<CheckAbuseGateInput, "request" | "routeGroup">;
};

/**
 * Thin HTTP adapter. Request-contract validation only.
 * Geographic authority is entirely delegated to the injected resolver.
 */
export async function handleWorksiteGeographyRequest(
  request: Request,
  resolveWorksiteGeography: WorksiteGeographyResolver,
  options?: WorksiteGeographyHandlerOptions,
): Promise<NextResponse> {
  try {
    assertWorksiteGeographyContentType(request);
    const body = await readWorksiteGeographyJsonBody(request);
    const accepted = validateWorksiteGeographyRequest(body);
    const denied = await enforceAbuseGate(request, "h1b_geo", options?.abuse);
    if (denied) {
      return denied;
    }

    const resolution = await resolveWorksiteGeography({
      zip: accepted.zip,
      countyFips: accepted.countyFips,
    });

    return NextResponse.json(toWorksiteGeographyResponse(resolution), {
      status: 200,
      headers: { "Cache-Control": NO_STORE },
    });
  } catch (error: unknown) {
    if (error instanceof WorksiteGeographyApiRequestError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Unable to resolve worksite geography.", 500);
  }
}
