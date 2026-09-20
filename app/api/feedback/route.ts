import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { isWriteFrozenError } from "@/lib/platform/writeFreeze";
import { requireUser } from "@/lib/auth/requireUser";
import {
  isFeedbackServiceError,
  submitUserFeedback,
} from "@/lib/feedback/feedbackService";
import {
  FEEDBACK_LIMITS,
  FEEDBACK_VALIDATION_ERROR,
  validateFeedbackSubmission,
} from "@/lib/feedback/feedbackValidation";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const profileWithRelations = await requireUser();

    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (Number.isFinite(contentLength) && contentLength > FEEDBACK_LIMITS.maxBodyBytes) {
        return jsonError(FEEDBACK_VALIDATION_ERROR, 400);
      }
    }

    const raw = await request.text();
    if (raw.length > FEEDBACK_LIMITS.maxBodyBytes) {
      return jsonError(FEEDBACK_VALIDATION_ERROR, 400);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      return jsonError(FEEDBACK_VALIDATION_ERROR, 400);
    }

    const validation = validateFeedbackSubmission(parsed);
    if (!validation.ok) {
      return jsonError(validation.error, 400);
    }

    const result = await submitUserFeedback({
      profileId: profileWithRelations.profile.id,
      clerkUserId: profileWithRelations.profile.clerk_user_id,
      submission: validation.data,
    });

    return NextResponse.json({ success: true, feedback: result.feedback }, { status: 201 });
  } catch (error: unknown) {
    if (isFeedbackServiceError(error)) {
      return jsonError(error.message, error.status);
    }

    if (isAuthError(error) || isWriteFrozenError(error)) {
      return authErrorResponse(error);
    }

    return jsonError("We couldn't save your feedback right now. Please try again.", 500);
  }
}
