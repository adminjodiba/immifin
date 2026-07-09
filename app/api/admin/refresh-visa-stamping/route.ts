export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";
import { getVisaStampingSheetData } from "@/lib/visa/visaStampingSheetService";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const sheetData = await getVisaStampingSheetData({ forceRefresh: true });
    const auditMetadata = getRequestAuditMetadata(request);

    await writeAdminAuditLog({
      actorProfileId: actor.profile.id,
      actorClerkUserId: actor.profile.clerk_user_id,
      actorEmail: actor.profile.email,
      action: "refresh_visa_stamping",
      resource: "/api/admin/refresh-visa-stamping",
      metadata: {
        source: sheetData.source,
        lastUpdated: sheetData.lastUpdated,
        recordCount: sheetData.records.length,
      },
      ipAddress: auditMetadata.ipAddress,
      userAgent: auditMetadata.userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Visa stamping wait times refreshed from Google Sheets.",
      metadata: {
        source: sheetData.source,
        lastUpdated: sheetData.lastUpdated,
        count: sheetData.records.length,
        countries: sheetData.countries,
      },
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to refresh visa stamping wait times";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
