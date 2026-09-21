/**
 * Thin H-1B worksite geography API.
 * Delegates all geographic authority to resolveWorksiteGeography().
 */

import { NextResponse } from "next/server";
import { handleWorksiteGeographyRequest } from "@/lib/h1b/geo/api/handleWorksiteGeographyRequest";
import { resolveWorksiteGeography } from "@/lib/h1b/geo/resolveWorksiteGeography";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  return handleWorksiteGeographyRequest(request, resolveWorksiteGeography);
}
