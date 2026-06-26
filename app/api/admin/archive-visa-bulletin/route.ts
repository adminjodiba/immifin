export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";
import {
  archiveVisaBulletinMonth,
  parseArchiveMonth,
  type ArchiveVisaBulletinResult,
} from "@/lib/visaBulletinArchive";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseArchiveMonth(searchParams.get("month"));

  if (!month) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or missing month. Use ?month=YYYY-MM.",
      },
      { status: 400 },
    );
  }

  try {
    const actor = await requireAdmin();
    const result: ArchiveVisaBulletinResult = await archiveVisaBulletinMonth(month);

    if (result.success) {
      const auditMetadata = getRequestAuditMetadata(request);

      await writeAdminAuditLog({
        actorProfileId: actor.profile.id,
        actorClerkUserId: actor.profile.clerk_user_id,
        actorEmail: actor.profile.email,
        action: "archive_visa_bulletin",
        resource: "/api/admin/archive-visa-bulletin",
        metadata: { month, recordsAdded: result.recordsAdded },
        ipAddress: auditMetadata.ipAddress,
        userAgent: auditMetadata.userAgent,
      });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to archive visa bulletin data";

    console.error("[visa-bulletin-archive] error:", message);

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
