import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";
import { getEffectivePlan } from "@/lib/account/plan";
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
    const subscription = profileWithRelations.subscription;
    const tier = getStoredSubscriptionTier({
      profile: profileWithRelations.profile,
      subscription,
    });

    const effectivePlan = getEffectivePlan(
      profileWithRelations.profile,
      subscription,
    );

    return NextResponse.json({
      tier,
      plan: effectivePlan,
      devSubscriptionMode: canUseDevSubscriptionTools(),
      billing: {
        status: subscription?.status ?? "inactive",
        stripeStatus: subscription?.stripe_status ?? null,
        billingInterval: subscription?.billing_interval ?? null,
        currentPeriodStart: subscription?.current_period_start ?? null,
        currentPeriodEnd: subscription?.current_period_end ?? null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
        canceledAt: subscription?.canceled_at ?? null,
        lastSynchronizedAt: subscription?.last_synchronized_at ?? null,
        hasPaidStripeSubscription: Boolean(subscription?.stripe_subscription_id?.trim()),
      },
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const profileWithRelations = await requireUser();

    if (!canUseDevSubscriptionTools()) {
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
      devSubscriptionMode: canUseDevSubscriptionTools(),
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
