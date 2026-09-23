/**
 * SERVER-ONLY — official wage lookup + IMMIFIN estimate in one request.
 * Browser sends user inputs only. Server re-resolves geography and official wages.
 */

import { NextResponse } from "next/server";
import { enforceAbuseGate, type CheckAbuseGateInput } from "@/lib/abuse/checkAbuseGate";
import type { OfficialOccupationDisplayEnricher } from "@/lib/h1b/occupations/officialOccupationDisplayEnrichment";
import type { WorksiteGeographyResolver } from "@/lib/h1b/geo/api/handleWorksiteGeographyRequest";
import { lookupOfficialWage } from "@/lib/h1b/wage/lookupOfficialWage";
import type { OfficialWageLookupStore } from "@/lib/h1b/wage/officialWageLookup.types";
import type { OfficialEstimateApiErrorBody } from "@/lib/h1b/wage/estimator/officialEstimate.types";
import { toOfficialEstimateResponse } from "@/lib/h1b/wage/estimator/toOfficialEstimateResponse";
import {
  assertOfficialEstimateContentType,
  OfficialEstimateApiRequestError,
  readOfficialEstimateJsonBody,
  validateOfficialEstimateRequest,
} from "@/lib/h1b/wage/estimator/officialEstimate.validation";
import { estimateOfficialWageLevel } from "@/lib/h1b/wage/v2/estimateOfficialWageLevel";

const NO_STORE = "no-store";

function jsonError(message: string, status: number): NextResponse<OfficialEstimateApiErrorBody> {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": NO_STORE } },
  );
}

export type OfficialEstimateHandlerOptions = {
  abuse?: Omit<CheckAbuseGateInput, "request" | "routeGroup">;
};

export async function handleOfficialEstimateRequest(
  request: Request,
  resolveWorksiteGeography: WorksiteGeographyResolver,
  store: OfficialWageLookupStore,
  enricher: OfficialOccupationDisplayEnricher,
  options?: OfficialEstimateHandlerOptions,
): Promise<NextResponse> {
  try {
    assertOfficialEstimateContentType(request);
    const body = await readOfficialEstimateJsonBody(request);
    const accepted = validateOfficialEstimateRequest(body);
    const denied = await enforceAbuseGate(request, "h1b_estimate", options?.abuse);
    if (denied) {
      return denied;
    }
    const wageLookup = await lookupOfficialWage(
      {
        socCode: accepted.socCode,
        zip: accepted.zip,
        countyFips: accepted.countyFips,
      },
      { resolveWorksiteGeography, store },
    );

    const wage = wageLookup.wage;
    const estimate =
      wageLookup.outcome === "AUTO" && wage
        ? estimateOfficialWageLevel({
            socCode: accepted.socCode,
            officialTitle: wage.occupation_title,
            annualSalary: accepted.annualSalary,
            experience: accepted.experience,
            education: accepted.education,
            wageAreaName: wageLookup.geography.resolved_area?.area_name ?? "the resolved official wage area",
            wage,
          })
        : null;

    return NextResponse.json(
      toOfficialEstimateResponse({
        request: accepted,
        wageLookup,
        estimate,
        enricher,
      }),
      {
        status: 200,
        headers: { "Cache-Control": NO_STORE },
      },
    );
  } catch (error: unknown) {
    if (error instanceof OfficialEstimateApiRequestError) {
      return jsonError(error.message, error.status);
    }

    return jsonError("Unable to estimate wage level.", 500);
  }
}
