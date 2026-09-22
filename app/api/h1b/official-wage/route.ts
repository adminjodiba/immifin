/**
 * Thin official OFLC wage lookup API.
 * Re-resolves worksite geography; never accepts area_code as authority.
 */

import { NextResponse } from "next/server";
import { resolveWorksiteGeography } from "@/lib/h1b/geo/resolveWorksiteGeography";
import { handleOfficialWageLookupRequest } from "@/lib/h1b/wage/handleOfficialWageLookupRequest";
import { createSupabaseOfficialWageStore } from "@/lib/h1b/wage/officialWageStore";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  return handleOfficialWageLookupRequest(
    request,
    resolveWorksiteGeography,
    createSupabaseOfficialWageStore(),
  );
}
