import { NextResponse } from "next/server";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";

export const runtime = "nodejs";

export async function GET() {
  try {
    const profileWithRelations = await requireUser();
    const phoneNumber = profileWithRelations.profile.phone_number?.trim() ?? "";

    return NextResponse.json({
      hasPhone: phoneNumber.length > 0,
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
