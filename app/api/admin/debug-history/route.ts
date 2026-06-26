import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";
import {
  getVisaBulletinHistory,
  type VisaBulletinHistoryRecord,
} from "@/lib/visaBulletinHistory";

export const runtime = "nodejs";
export const revalidate = 86400;

type DebugHistoryResponse = {
  totalRows: number;
  firstTenRows: VisaBulletinHistoryRecord[];
  uniqueCategories: string[];
  uniqueCountries: string[];
  uniqueTypes: string[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin();
    const records = await getVisaBulletinHistory({});

    const response: DebugHistoryResponse = {
      totalRows: records.length,
      firstTenRows: records.slice(0, 10),
      uniqueCategories: uniqueSorted(records.map((row) => row.category)),
      uniqueCountries: uniqueSorted(records.map((row) => row.country)),
      uniqueTypes: uniqueSorted(records.map((row) => row.type)),
    };

    const auditMetadata = getRequestAuditMetadata(request);

    await writeAdminAuditLog({
      actorProfileId: actor.profile.id,
      actorClerkUserId: actor.profile.clerk_user_id,
      actorEmail: actor.profile.email,
      action: "debug_visa_bulletin_history",
      resource: "/api/admin/debug-history",
      metadata: { totalRows: response.totalRows },
      ipAddress: auditMetadata.ipAddress,
      userAgent: auditMetadata.userAgent,
    });

    return NextResponse.json(response);
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to load visa bulletin history debug data";

    console.error("[debug-history] error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
