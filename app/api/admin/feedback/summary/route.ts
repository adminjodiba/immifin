export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getAdminFeedbackStatusCounts,
  isAdminFeedbackReviewError,
} from "@/lib/feedback/adminFeedbackReview";

export async function GET() {
  try {
    await requireAdmin();
    const counts = await getAdminFeedbackStatusCounts();
    return NextResponse.json({ success: true, counts });
  } catch (error: unknown) {
    if (isAdminFeedbackReviewError(error)) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    return NextResponse.json({ success: false, error: "Unable to load feedback counts." }, { status: 500 });
  }
}
