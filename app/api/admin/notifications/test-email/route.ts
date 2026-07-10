export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  createNotificationService,
  isNotificationError,
} from "@/lib/notifications";

const TEST_SUBJECT = "IMMIFIN | Notification Infrastructure Test";
const TEST_TEXT =
  "The IMMIFIN notification infrastructure is working correctly.";
const TEST_HTML =
  "<p>The IMMIFIN notification infrastructure is working correctly.</p>";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TestEmailBody = {
  email?: unknown;
  to?: unknown;
};

function notFound() {
  return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
}

function resolveRecipient(body: TestEmailBody): string | null {
  const raw =
    typeof body.email === "string"
      ? body.email
      : typeof body.to === "string"
        ? body.to
        : null;
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return notFound();
  }

  try {
    await requireAdmin();

    let body: TestEmailBody = {};
    try {
      body = (await request.json()) as TestEmailBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_INVALID_INPUT",
          errorMessage: "Request body must be JSON with a recipient email",
        },
        { status: 400 }
      );
    }

    const recipient = resolveRecipient(body);
    if (!recipient || !EMAIL_PATTERN.test(recipient)) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_INVALID_INPUT",
          errorMessage: "A valid recipient email is required",
        },
        { status: 400 }
      );
    }

    const notificationService = createNotificationService();
    const result = await notificationService.sendEmail({
      to: recipient,
      subject: TEST_SUBJECT,
      text: TEST_TEXT,
      html: TEST_HTML,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          provider: result.provider,
          providerMessageId: null,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: result.provider,
      providerMessageId: result.providerMessageId,
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

    return NextResponse.json(
      {
        success: false,
        errorCode: "NOTIFICATION_PROVIDER_ERROR",
        errorMessage: "Failed to send test email",
      },
      { status: 500 }
    );
  }
}
