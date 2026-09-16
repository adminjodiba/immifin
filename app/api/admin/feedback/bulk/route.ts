export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";
import {
  bulkModerateAdminFeedback,
  isAdminFeedbackReviewError,
  parseAdminFeedbackBulkAction,
} from "@/lib/feedback/adminFeedbackReview";

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as {
      action?: unknown;
      ids?: unknown;
    };
    const action = parseAdminFeedbackBulkAction(body.action);
    const result = await bulkModerateAdminFeedback({
      ids: Array.isArray(body.ids) ? body.ids : [],
      action,
      actorClerkUserId: actor.profile.clerk_user_id,
    });

    const audit = getRequestAuditMetadata(request);
    try {
      await writeAdminAuditLog({
        actorProfileId: actor.profile.id,
        actorClerkUserId: actor.profile.clerk_user_id,
        actorEmail: actor.profile.email,
        action: `bulk_${action}_user_feedback`,
        resource: "/api/admin/feedback/bulk",
        metadata: {
          action,
          requested: result.requested,
          successful: result.successful,
          skipped: result.skipped,
        },
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    } catch (error: unknown) {
      console.error("[admin-feedback] audit log failed:", error);
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    if (isAdminFeedbackReviewError(error)) {
      return jsonError(error.message, error.status);
    }

    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    return jsonError("Unable to update feedback.", 500);
  }
}
