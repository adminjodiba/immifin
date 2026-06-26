import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";

export const runtime = "nodejs";

export async function GET() {
  try {
    const profileWithRelations = await requireUser();

    return NextResponse.json({
      profile: profileWithRelations.profile,
      immigrationProfile: profileWithRelations.immigrationProfile,
      subscription: profileWithRelations.subscription,
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
