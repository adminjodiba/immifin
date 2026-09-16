export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  getAdminFeedbackYearCounts,
  isAdminFeedbackReviewError,
  parseAdminFeedbackView,
} from "@/lib/feedback/adminFeedbackReview";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const view = parseAdminFeedbackView(new URL(request.url).searchParams.get("view"));
    const years = await getAdminFeedbackYearCounts(view);
    return NextResponse.json({ success: true, view, years });
  } catch (error: unknown) {
    if (isAdminFeedbackReviewError(error)) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    return NextResponse.json({ success: false, error: "Unable to load year counts." }, { status: 500 });
  }
}
