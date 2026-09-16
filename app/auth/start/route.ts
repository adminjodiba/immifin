import { NextRequest, NextResponse } from "next/server";
import {
  POST_LOGIN_START_PATH,
  buildStartPageAccessContext,
  readStartPagePreference,
  resolveAuthorizedStartPageHref,
} from "@/lib/account/startPage";
import { requireUser } from "@/lib/auth/requireUser";
import { ONBOARDING_CONTACT_PATH } from "@/lib/onboarding/routes";
import { resolveSubscriptionEntitlement } from "@/lib/subscription/resolveSubscriptionEntitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectTo(request: NextRequest, path: string): NextResponse {
  const safePath = path === POST_LOGIN_START_PATH ? "/" : path;
  return NextResponse.redirect(new URL(safePath, request.url));
}

export async function GET(request: NextRequest) {
  try {
    const profileWithRelations = await requireUser();

    if (!profileWithRelations.profile.phone_number?.trim()) {
      return redirectTo(request, ONBOARDING_CONTACT_PATH);
    }

    const { tier } = resolveSubscriptionEntitlement({
      profile: profileWithRelations.profile,
      subscription: profileWithRelations.subscription,
      clerkUserId: profileWithRelations.profile.clerk_user_id,
    });
    const context = buildStartPageAccessContext({
      tier,
      role: profileWithRelations.profile.role,
    });
    const stored = readStartPagePreference(profileWithRelations.immigrationProfile?.preferences);

    return redirectTo(request, resolveAuthorizedStartPageHref(stored, context));
  } catch {
    return redirectTo(request, "/");
  }
}
