export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  isAdminFeedbackReviewError,
  listAdminFeedback,
  parseAdminFeedbackPage,
  parseAdminFeedbackPageSize,
  parseAdminFeedbackRating,
  parseAdminFeedbackSort,
  parseAdminFeedbackView,
  parseAdminFeedbackYear,
} from "@/lib/feedback/adminFeedbackReview";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const result = await listAdminFeedback({
      view: parseAdminFeedbackView(params.get("view")),
      year: parseAdminFeedbackYear(params.get("year")),
      page: parseAdminFeedbackPage(params.get("page")),
      pageSize: parseAdminFeedbackPageSize(params.get("pageSize")),
      sort: parseAdminFeedbackSort(params.get("sort")),
      search: params.get("search")?.trim() || undefined,
      rating: parseAdminFeedbackRating(params.get("rating")),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    if (isAdminFeedbackReviewError(error)) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("[admin-feedback] list route failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load feedback." }, { status: 500 });
  }
}
