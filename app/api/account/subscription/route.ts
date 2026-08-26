import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";
import { canUseDevSubscriptionTools } from "@/lib/subscription/devSubscriptionAccess";
import { subscriptionTierToAppPlan } from "@/lib/subscription/plan";
import { resolveSubscriptionEntitlement } from "@/lib/subscription/resolveSubscriptionEntitlement";
import { isSubscriptionTier, type SubscriptionTier } from "@/lib/subscription/tiers";
import { resolveLiveScheduledBillingStateFromStripe } from "@/lib/stripe/scheduled-plan-change-read";
import { updateSubscriptionPlan } from "@/lib/supabase/profiles";

export const runtime = "nodejs";

type PatchBody = {
  plan?: unknown;
};

export async function GET() {
  try {
    const profileWithRelations = await requireUser();
    const subscription = profileWithRelations.subscription;
    const clerkUserId = profileWithRelations.profile.clerk_user_id;

    const entitlement = resolveSubscriptionEntitlement({
      profile: profileWithRelations.profile,
      subscription,
      clerkUserId,
    });

    const hasPaidStripeSubscription = entitlement.developmentSimulationActive
      ? false
      : Boolean(subscription?.stripe_subscription_id?.trim());

    const liveScheduled = hasPaidStripeSubscription
      ? await resolveLiveScheduledBillingStateFromStripe(subscription?.stripe_subscription_id)
      : { scheduledPlanChange: null, stripeCancelAtPeriodEnd: null };
    const scheduledPlanChange = liveScheduled.scheduledPlanChange;
    const cancelAtPeriodEnd =
      liveScheduled.stripeCancelAtPeriodEnd ?? subscription?.cancel_at_period_end ?? false;

    // S7-BILLING-UX-008A: entitlement must not be served from a stale HTTP cache during
    // post-Checkout activation polling (narrow — this route only).
    return NextResponse.json(
      {
        tier: entitlement.tier,
        plan: entitlement.plan,
        // Boolean eligibility only — never expose configured test-user ID or reason.
        devSubscriptionMode: canUseDevSubscriptionTools(clerkUserId),
        billing: {
          status: subscription?.status ?? "inactive",
          stripeStatus: subscription?.stripe_status ?? null,
          billingInterval: subscription?.billing_interval ?? null,
          currentPeriodStart: subscription?.current_period_start ?? null,
          currentPeriodEnd: subscription?.current_period_end ?? null,
          cancelAtPeriodEnd,
          canceledAt: subscription?.canceled_at ?? null,
          lastSynchronizedAt: subscription?.last_synchronized_at ?? null,
          hasPaidStripeSubscription,
          scheduledPlanChange,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      },
    );
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const profileWithRelations = await requireUser();
    const clerkUserId = profileWithRelations.profile.clerk_user_id;

    // Server authority: authenticated Clerk ID only — never trust body/query identity.
    if (!canUseDevSubscriptionTools(clerkUserId)) {
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

    const entitlement = resolveSubscriptionEntitlement({
      profile,
      subscription,
      clerkUserId,
    });

    return NextResponse.json({
      tier: entitlement.tier,
      plan: entitlement.plan,
      profile,
      subscription,
      devSubscriptionMode: canUseDevSubscriptionTools(clerkUserId),
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
