export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { refreshVisaBulletinData } from "@/lib/data/refreshVisaBulletinData";

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin();
    const result = await refreshVisaBulletinData({
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
      error instanceof Error ? error.message : "Failed to refresh Visa Bulletin sheets";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
