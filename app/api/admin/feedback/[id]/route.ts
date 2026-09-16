export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";
import {
  approveAdminFeedback,
  deleteAdminFeedback,
  getAdminFeedbackDetail,
  isAdminFeedbackReviewError,
  saveAdminFeedbackNote,
  setAdminFeedbackPublished,
} from "@/lib/feedback/adminFeedbackReview";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const item = await getAdminFeedbackDetail(id);
    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    if (isAdminFeedbackReviewError(error)) {
      return jsonError(error.message, error.status);
    }

    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    return jsonError("Unable to load feedback details.", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const actor = await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      note?: string | null;
      featured?: boolean;
    };

    const note = typeof body.note === "string" ? body.note.trim() || null : body.note === null ? null : undefined;

    if (body.action === "approve") {
      const item = await approveAdminFeedback({
        id,
        actorClerkUserId: actor.profile.clerk_user_id,
      });

      const audit = getRequestAuditMetadata(request);
      try {
        await writeAdminAuditLog({
          actorProfileId: actor.profile.id,
          actorClerkUserId: actor.profile.clerk_user_id,
          actorEmail: actor.profile.email,
          action: "approve_user_feedback",
          resource: `/api/admin/feedback/${id}`,
          metadata: {
            feedbackId: id,
            publicationPermission: item.publicationPermission,
            moderationStatus: item.moderationStatus,
          },
          ipAddress: audit.ipAddress,
          userAgent: audit.userAgent,
        });
      } catch (error: unknown) {
        console.error("[admin-feedback] audit log failed:", error);
      }

      return NextResponse.json({ success: true, item });
    }

    if (body.action === "reject" || body.action === "acknowledge" || body.action === "delete") {
      await deleteAdminFeedback({
        id,
        mode: body.action,
      });

      const audit = getRequestAuditMetadata(request);
      try {
        await writeAdminAuditLog({
          actorProfileId: actor.profile.id,
          actorClerkUserId: actor.profile.clerk_user_id,
          actorEmail: actor.profile.email,
          action:
            body.action === "reject"
              ? "reject_delete_user_feedback"
              : body.action === "acknowledge"
                ? "acknowledge_delete_user_feedback"
                : "delete_user_feedback",
          resource: `/api/admin/feedback/${id}`,
          metadata: {
            feedbackId: id,
            mode: body.action,
          },
          ipAddress: audit.ipAddress,
          userAgent: audit.userAgent,
        });
      } catch (error: unknown) {
        console.error("[admin-feedback] audit log failed:", error);
      }

      return NextResponse.json({ success: true, deleted: true });
    }

    if (body.action === "publish") {
      const item = await setAdminFeedbackPublished({
        id,
        featured: body.featured === true,
      });

      const audit = getRequestAuditMetadata(request);
      try {
        await writeAdminAuditLog({
          actorProfileId: actor.profile.id,
          actorClerkUserId: actor.profile.clerk_user_id,
          actorEmail: actor.profile.email,
          action: item.featured ? "publish_user_feedback" : "unpublish_user_feedback",
          resource: `/api/admin/feedback/${id}`,
          metadata: {
            feedbackId: id,
            featured: item.featured,
            publicationPermission: item.publicationPermission,
            moderationStatus: item.moderationStatus,
          },
          ipAddress: audit.ipAddress,
          userAgent: audit.userAgent,
        });
      } catch (error: unknown) {
        console.error("[admin-feedback] audit log failed:", error);
      }

      return NextResponse.json({ success: true, item });
    }

    if (note !== undefined) {
      const item = await saveAdminFeedbackNote({ id, note });
      return NextResponse.json({ success: true, item });
    }

    return jsonError("Unsupported action.", 400);
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
