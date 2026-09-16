import { NextResponse } from "next/server";
import {
  buildStartPageAccessContext,
  canCustomizeStartPage,
  getAvailableStartPageDestinations,
  isStartPageDestinationId,
  readStartPagePreference,
  resolveAuthorizedStartPage,
  START_PAGE_PREFERENCE_KEY,
} from "@/lib/account/startPage";
import { AuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";
import { resolveSubscriptionEntitlement } from "@/lib/subscription/resolveSubscriptionEntitlement";
import { updateImmigrationProfilePreferences } from "@/lib/supabase/profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function startPagePayload(profileWithRelations: Awaited<ReturnType<typeof requireUser>>) {
  const { tier } = resolveSubscriptionEntitlement({
    profile: profileWithRelations.profile,
    subscription: profileWithRelations.subscription,
    clerkUserId: profileWithRelations.profile.clerk_user_id,
  });
  const context = buildStartPageAccessContext({
    tier,
    role: profileWithRelations.profile.role,
  });
  const destinations = getAvailableStartPageDestinations(context);
  const stored = readStartPagePreference(profileWithRelations.immigrationProfile?.preferences);
  const effective = resolveAuthorizedStartPage(stored, context);

  return {
    canCustomize: canCustomizeStartPage(tier),
    startPage: effective.id,
    destinations,
  };
}

export async function GET() {
  try {
    const profileWithRelations = await requireUser();
    return NextResponse.json(startPagePayload(profileWithRelations));
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const profileWithRelations = await requireUser();
    const { tier } = resolveSubscriptionEntitlement({
      profile: profileWithRelations.profile,
      subscription: profileWithRelations.subscription,
      clerkUserId: profileWithRelations.profile.clerk_user_id,
    });

    if (!canCustomizeStartPage(tier)) {
      throw new AuthError("Personalization is available with Pro and Power.", 403);
    }

    let body: { startPage?: unknown };
    try {
      body = (await request.json()) as { startPage?: unknown };
    } catch {
      throw new AuthError("Invalid request body.", 400);
    }
    if (!isStartPageDestinationId(body.startPage)) {
      throw new AuthError("Invalid start page.", 400);
    }

    const context = buildStartPageAccessContext({
      tier,
      role: profileWithRelations.profile.role,
    });
    const allowed = getAvailableStartPageDestinations(context);
    if (!allowed.some((destination) => destination.id === body.startPage)) {
      throw new AuthError("That start page is not available for this account.", 403);
    }

    const immigrationProfile = await updateImmigrationProfilePreferences(
      profileWithRelations.profile.id,
      { [START_PAGE_PREFERENCE_KEY]: body.startPage },
    );

    return NextResponse.json({
      ...startPagePayload({
        ...profileWithRelations,
        immigrationProfile,
      }),
      immigrationProfile,
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
