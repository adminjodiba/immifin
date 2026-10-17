export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { isAuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getMonthlyUpdateCampaignDeliveryDetails } from "@/lib/notifications/monthly-update-campaign-delivery-details";
import {
  parseDeliveryDetailsPagination,
  parseDeliveryDetailsStatusFilter,
} from "@/lib/notifications/monthly-update-campaign-delivery-details-model";

type RouteContext = { params: Promise<{ campaignId: string }> };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { campaignId } = await context.params;
    if (
      typeof campaignId !== "string" ||
      !UUID_PATTERN.test(campaignId.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_INVALID_INPUT",
          errorMessage: "Campaign ID must be a valid UUID.",
        },
        { status: 400 },
      );
    }
    const url = new URL(request.url);
    const pagination = parseDeliveryDetailsPagination({
      page: url.searchParams.get("page"),
      pageSize: url.searchParams.get("pageSize"),
    });
    if (!pagination) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_INVALID_INPUT",
          errorMessage:
            "page must be a positive integer and pageSize must be between 1 and 100.",
        },
        { status: 400 },
      );
    }
    const statusFilter = parseDeliveryDetailsStatusFilter(url.searchParams.get("status"));
    if (statusFilter === undefined) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_INVALID_INPUT",
          errorMessage:
            "status must be provider_accepted, failed, skipped, submission_unknown, or omitted.",
        },
        { status: 400 },
      );
    }
    const details = await getMonthlyUpdateCampaignDeliveryDetails({
      campaignId: campaignId.trim(),
      pagination,
      statusFilter,
    });
    if (!details) {
      return NextResponse.json(
        {
          success: false,
          errorCode: "NOTIFICATION_CAMPAIGN_NOT_FOUND",
          errorMessage: "Campaign not found.",
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, details });
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }
    console.error(
      "[admin] monthly-immigration-update delivery details failed:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        errorCode: "MONTHLY_UPDATE_DELIVERY_DETAILS_FAILED",
        errorMessage:
          "Failed to load Monthly Immigration Update delivery details.",
      },
      { status: 500 },
    );
  }
}
