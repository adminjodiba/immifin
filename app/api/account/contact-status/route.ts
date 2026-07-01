import { NextResponse } from "next/server";
import { getProfilePhoneStatus } from "@/lib/account/hasProfilePhone";
import { authErrorResponse } from "@/lib/auth/http";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const hasPhone = await getProfilePhoneStatus(userId);

    if (hasPhone === null) {
      return NextResponse.json(
        { error: "Unable to load contact status." },
        { status: 503 },
      );
    }

    return NextResponse.json({ hasPhone });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
