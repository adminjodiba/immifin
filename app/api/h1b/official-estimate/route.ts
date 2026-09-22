/**
 * Thin official H-1B IMMIFIN estimate API.
 * Re-resolves worksite geography and official wages; never accepts area_code or client-calculated outputs.
 */

import { NextResponse } from "next/server";
import { createSeedOfficialOccupationDisplayEnricher } from "@/lib/h1b/occupations/officialOccupationDisplayEnrichment";
import { resolveWorksiteGeography } from "@/lib/h1b/geo/resolveWorksiteGeography";
import { handleOfficialEstimateRequest } from "@/lib/h1b/wage/estimator/handleOfficialEstimateRequest";
import { createSupabaseOfficialWageStore } from "@/lib/h1b/wage/officialWageStore";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  return handleOfficialEstimateRequest(
    request,
    resolveWorksiteGeography,
    createSupabaseOfficialWageStore(),
    createSeedOfficialOccupationDisplayEnricher(),
  );
}
