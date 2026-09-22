/**
 * Thin official OFLC occupation search API.
 * Reads ACTIVE All Industries oflc_occupations only. Does not search the 722-title seed.
 * Display enrichment for the matched official rows is attached after official search.
 */

import { NextResponse } from "next/server";
import { createSeedOfficialOccupationDisplayEnricher } from "@/lib/h1b/occupations/officialOccupationDisplayEnrichment";
import { handleOfficialOccupationSearchRequest } from "@/lib/h1b/occupations/handleOfficialOccupationSearchRequest";
import { createSupabaseOfficialOccupationSearchStore } from "@/lib/h1b/occupations/officialOccupationSearchStore";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  return handleOfficialOccupationSearchRequest(
    request,
    createSupabaseOfficialOccupationSearchStore(),
    createSeedOfficialOccupationDisplayEnricher(),
  );
}
