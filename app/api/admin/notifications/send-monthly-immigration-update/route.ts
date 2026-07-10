export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  renderMonthlyImmigrationReportEmail,
} from "@/emails/templates/monthly-immigration-report-email";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  createNotificationService,
  isNotificationError,
  mapMonthlyImmigrationReportEmailProps,
  isMonthlyUpdateAssemblyError,
  prepareMonthlyImmigrationUpdateForUser,
} from "@/lib/notifications";
import { getRequestAuditMetadata, writeAdminAuditLog } from "@/lib/supabase/audit";
import { getProfileWithRelationsByEmail } from "@/lib/supabase/profiles";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUDIT_ACTION = "SEND_SINGLE_MONTHLY_IMMIGRATION_UPDATE";
const RESOURCE = "/api/admin/notifications/send-monthly-immigration-update";

type RequestBody = {
  action?: unknown;
  email?: unknown;
};

function resolveSingleEmail(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes(",") || trimmed.includes(";")) {
    return null;
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
}

async function writeSendAudit(input: {
  actor: Awaited<ReturnType<typeof requireAdmin>>;
  request: Request;
  targetEmail: string;
  bulletinMonth: string | null;
  success: boolean;
  provider: string | null;
  providerMessageId: string | null;
  errorCode?: string | null;
}): Promise<void> {
  try {
    const auditMetadata = getRequestAuditMetadata(input.request);
    await writeAdminAuditLog({
      actorProfileId: input.actor.profile.id,
      actorClerkUserId: input.actor.profile.clerk_user_id,
      actorEmail: input.actor.profile.email,
      action: AUDIT_ACTION,
      resource: RESOURCE,
      metadata: {
        targetEmail: input.targetEmail,
        bulletinMonth: input.bulletinMonth,
        provider: input.provider,
        providerMessageId: input.providerMessageId,
        success: input.success,
        errorCode: input.errorCode ?? null,
      },
      ipAddress: auditMetadata.ipAddress,
      userAgent: auditMetadata.userAgent,
    });
  } catch (error: unknown) {
    console.error("[admin] Failed to write monthly update audit log:", error);
  }
}

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
          errorMessage: "Request body must be JSON with action and email.",
        },
        { status: 400 }
      );
    }

    const action =
      body.action === "preview" || body.action === "send" ? body.action : null;
    if (!action) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_INVALID_INPUT",
          errorMessage: 'Action must be "preview" or "send".',
        },
        { status: 400 }
      );
    }

    const email = resolveSingleEmail(body.email);
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_INVALID_INPUT",
          errorMessage:
            "Enter exactly one valid IMMIFIN user email (no comma-separated lists).",
        },
        { status: 400 }
      );
    }

    const profileWithRelations = await getProfileWithRelationsByEmail(email);
    if (!profileWithRelations) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "MONTHLY_UPDATE_USER_NOT_FOUND",
          errorMessage:
            "No IMMIFIN user found for that email. Only existing users can receive this update.",
        },
        { status: 404 }
      );
    }

    let prepared;
    try {
      prepared = await prepareMonthlyImmigrationUpdateForUser(profileWithRelations);
    } catch (error: unknown) {
      if (isMonthlyUpdateAssemblyError(error)) {
        return NextResponse.json(
          {
            success: false,
            errorCode: error.code,
            errorMessage: error.message,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    if (action === "preview") {
      return NextResponse.json({
        success: true,
        action: "preview",
        preview: prepared.preview,
      });
    }

    const emailProps = mapMonthlyImmigrationReportEmailProps(prepared.source);
    const rendered = await renderMonthlyImmigrationReportEmail(emailProps);
    const notificationService = createNotificationService();
    const result = await notificationService.sendEmail({
      to: profileWithRelations.profile.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: [
        { name: "template", value: "monthly-immigration-report" },
        { name: "send_mode", value: "single_user" },
      ],
    });

    await writeSendAudit({
      actor,
      request,
      targetEmail: profileWithRelations.profile.email,
      bulletinMonth: prepared.preview.updateMonth,
      success: result.success,
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      errorCode: result.success ? null : result.errorCode,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          action: "send",
          provider: result.provider,
          providerMessageId: null,
          errorCode: result.errorCode,
          errorMessage:
            result.errorMessage || "Failed to send Monthly Immigration Update.",
          preview: prepared.preview,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      action: "send",
      provider: result.provider,
      providerMessageId: result.providerMessageId,
      preview: prepared.preview,
      message: "Monthly Immigration Update sent to one user.",
    });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    if (isNotificationError(error)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: error.code,
          errorMessage: error.message,
        },
        { status: 400 }
      );
    }

    console.error("[admin] send-monthly-immigration-update failed:", error);
    return NextResponse.json(
      {
        success: false,
        errorCode: "NOTIFICATION_PROVIDER_ERROR",
        errorMessage: "Failed to process Monthly Immigration Update request.",
      },
      { status: 500 }
    );
  }
}
