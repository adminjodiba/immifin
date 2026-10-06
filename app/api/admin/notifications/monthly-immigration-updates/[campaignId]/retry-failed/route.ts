export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { recoverFailedMonthlyUpdateRecipientsForAdmin } from "@/lib/notifications/monthly-update-failed-recipient-recovery-runtime";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";

type RouteContext = { params: Promise<{ campaignId: string }> };
type RequestBody = { confirm?: unknown; idempotencyKey?: unknown };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;
const AUDIT_ACTION = "RETRY_FAILED_MONTHLY_IMMIGRATION_UPDATE_RECIPIENTS";
const RESOURCE = "/api/admin/notifications/monthly-immigration-updates/[campaignId]/retry-failed";

export function parseRecoveryRequest(input: {
  campaignId: unknown;
  body: RequestBody;
}): { campaignId: string; idempotencyKey: string } | { errorCode: string; errorMessage: string } {
  if (typeof input.campaignId !== "string" || !UUID_PATTERN.test(input.campaignId.trim())) {
    return { errorCode: "NOTIFICATION_INVALID_INPUT", errorMessage: "Campaign ID must be a valid UUID." };
  }
  if (input.body.confirm !== true) {
    return {
      errorCode: "NOTIFICATION_CONFIRMATION_REQUIRED",
      errorMessage: "Explicit confirmation is required. Set confirm: true after the admin dialog.",
    };
  }
  if (typeof input.body.idempotencyKey !== "string") {
    return { errorCode: "NOTIFICATION_INVALID_INPUT", errorMessage: "A valid idempotencyKey is required." };
  }
  const idempotencyKey = input.body.idempotencyKey.trim();
  if (!idempotencyKey || idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    return {
      errorCode: "NOTIFICATION_INVALID_INPUT",
      errorMessage: `idempotencyKey must contain between 1 and ${MAX_IDEMPOTENCY_KEY_LENGTH} characters.`,
    };
  }
  return { campaignId: input.campaignId.trim(), idempotencyKey };
}

function failureResponse(result: Awaited<ReturnType<typeof recoverFailedMonthlyUpdateRecipientsForAdmin>>) {
  if (result.outcome === "campaign_not_found") {
    return NextResponse.json({ success: false, result }, { status: 404 });
  }
  if (
    result.outcome === "active_recovery_conflict" ||
    result.outcome === "legacy_campaign" ||
    result.outcome === "campaign_not_recoverable"
  ) {
    return NextResponse.json({ success: false, result }, { status: 409 });
  }
  return null;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const actor = await requireAdmin();
    const { campaignId } = await context.params;
    const body = (await request.json().catch(() => null)) as RequestBody | null;
    if (!body) {
      return NextResponse.json(
        { success: false, errorCode: "NOTIFICATION_INVALID_INPUT", errorMessage: "Request body must be JSON." },
        { status: 400 },
      );
    }
    const parsed = parseRecoveryRequest({ campaignId, body });
    if ("errorCode" in parsed) {
      return NextResponse.json({ success: false, ...parsed }, { status: 400 });
    }

    const result = await recoverFailedMonthlyUpdateRecipientsForAdmin({
      campaignId: parsed.campaignId,
      idempotencyKey: parsed.idempotencyKey,
      actorProfileId: actor.profile.id,
      actorClerkUserId: actor.profile.clerk_user_id,
      actorEmail: actor.profile.email,
    });

    try {
      const audit = getRequestAuditMetadata(request);
      await writeAdminAuditLog({
        actorProfileId: actor.profile.id,
        actorClerkUserId: actor.profile.clerk_user_id,
        actorEmail: actor.profile.email,
        action: AUDIT_ACTION,
        resource: RESOURCE,
        metadata: {
          campaignId: result.campaignId,
          recoveryRunId: result.recoveryRunId,
          outcome: result.outcome,
          status: result.status,
          targetedCount: result.targetedCount,
          providerAcceptedCount: result.providerAcceptedCount,
          failedCount: result.failedCount,
          skippedIneligibleCount: result.skippedIneligibleCount,
          submissionUnknownCount: result.submissionUnknownCount,
          remainingRetryableFailureCount: result.remainingRetryableFailureCount,
        },
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });
    } catch (auditError: unknown) {
      console.error("[admin] Failed to write failed-recipient recovery audit log:", auditError);
    }

    const failure = failureResponse(result);
    if (failure) {
      return failure;
    }
    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }
    console.error("[admin] failed-recipient recovery failed:", error);
    return NextResponse.json(
      {
        success: false,
        errorCode: "MONTHLY_UPDATE_FAILED_RECIPIENT_RECOVERY_FAILED",
        errorMessage: error instanceof Error ? error.message : "Failed to recover failed Monthly Immigration Update recipients.",
      },
      { status: 500 },
    );
  }
}