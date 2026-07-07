import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";
import { canUseDevSubscriptionTools } from "@/lib/subscription/devSubscriptionAccess";
import { subscriptionTierToAppPlan } from "@/lib/subscription/plan";
import { getStoredSubscriptionTier } from "@/lib/subscription/service";
import { isSubscriptionTier, type SubscriptionTier } from "@/lib/subscription/tiers";
import { updateSubscriptionPlan } from "@/lib/supabase/profiles";

export const runtime = "nodejs";

type PatchBody = {
  plan?: unknown;
};

export async function GET() {
  try {
    const profileWithRelations = await requireUser();
    const tier = getStoredSubscriptionTier({
      profile: profileWithRelations.profile,
      subscription: profileWithRelations.subscription,
    });

    return NextResponse.json({
      tier,
      plan: profileWithRelations.subscription?.plan ?? profileWithRelations.profile.plan,
      devSubscriptionMode: canUseDevSubscriptionTools(profileWithRelations.profile.role),
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const profileWithRelations = await requireUser();

    if (!canUseDevSubscriptionTools(profileWithRelations.profile.role)) {
      throw new AuthError("Development subscription mode is not enabled.", 403);
    }
    const body = (await request.json()) as PatchBody;

    if (typeof body.plan !== "string") {
      throw new AuthError("Invalid plan. Use free, pro, or power.", 400);
    }

    const normalized = body.plan.trim().toLowerCase();

    if (!isSubscriptionTier(normalized)) {
      throw new AuthError("Invalid plan. Use free, pro, or power.", 400);
    }

    const appPlan = subscriptionTierToAppPlan(normalized as SubscriptionTier);
    const { profile, subscription } = await updateSubscriptionPlan(
      profileWithRelations.profile.id,
      appPlan,
    );

    const tier = getStoredSubscriptionTier({ profile, subscription });

    return NextResponse.json({
      tier,
      plan: subscription.plan,
      profile,
      subscription,
      devSubscriptionMode: canUseDevSubscriptionTools(profile.role),
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
