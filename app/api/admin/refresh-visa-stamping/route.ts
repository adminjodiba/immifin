export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { refreshVisaStampingData } from "@/lib/data/refreshVisaStampingData";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const result = await refreshVisaStampingData({
      trigger: "admin",
      actor: {
        profileId: actor.profile.id,
        clerkUserId: actor.profile.clerk_user_id,
        email: actor.profile.email,
      },
      request,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to refresh visa stamping wait times";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
