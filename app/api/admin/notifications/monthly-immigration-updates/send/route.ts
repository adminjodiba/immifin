export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendMonthlyImmigrationUpdatesBulk } from "@/lib/notifications/monthly-update-control-center";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";

type RequestBody = {
  confirm?: unknown;
};

const AUDIT_ACTION = "SEND_MONTHLY_IMMIGRATION_UPDATES";
const RESOURCE = "/api/admin/notifications/monthly-immigration-updates/send";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();

    let body: RequestBody = {};
    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_INVALID_INPUT",
          errorMessage: "Request body must be JSON with confirm: true.",
        },
        { status: 400 }
      );
    }

    if (body.confirm !== true) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_CONFIRMATION_REQUIRED",
          errorMessage:
            "Explicit confirmation is required. Set confirm: true after the admin dialog.",
        },
        { status: 400 }
      );
    }

    const result = await sendMonthlyImmigrationUpdatesBulk({
      actorProfileId: actor.profile.id,
      actorClerkUserId: actor.profile.clerk_user_id,
      actorEmail: actor.profile.email,
    });

    try {
      const auditMetadata = getRequestAuditMetadata(request);
      await writeAdminAuditLog({
        actorProfileId: actor.profile.id,
        actorClerkUserId: actor.profile.clerk_user_id,
        actorEmail: actor.profile.email,
        action: AUDIT_ACTION,
        resource: RESOURCE,
        metadata: {
          bulletinMonth: result.bulletinMonthKey,
          bulletinMonthLabel: result.bulletinMonthLabel,
          proCount: result.proCount,
          powerCount: result.powerCount,
          totalCount: result.totalRecipients,
          successCount: result.successCount,
          failureCount: result.failureCount,
          skippedCount: result.skippedCount,
          status: result.controlStatus,
          provider: result.provider,
          campaignId: result.campaignId,
        },
        ipAddress: auditMetadata.ipAddress,
        userAgent: auditMetadata.userAgent,
      });
    } catch (auditError: unknown) {
      console.error("[admin] Failed to write bulk monthly update audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      result,
      message:
        result.failureCount > 0
          ? "Monthly Update completed with failures."
          : "Monthly Update Complete",
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error
        ? error.message
        : "Failed to send Monthly Immigration Updates.";

    console.error("[admin] monthly-immigration-updates send failed:", error);
    return NextResponse.json(
      {
        success: false,
        errorCode: "MONTHLY_UPDATE_BULK_SEND_FAILED",
        errorMessage: message,
      },
      { status: 400 }
    );
  }
}
