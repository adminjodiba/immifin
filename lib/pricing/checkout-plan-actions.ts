import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { buildBillingChangeHandoffHref } from "@/lib/billing/plan-change-intent";
import type { CheckoutBillingInterval } from "@/lib/stripe/client-checkout";
import type { SubscriptionBillingInterval } from "@/lib/supabase/types";

export type CheckoutPlanButtonConfig = {
  label: string;
  disabled: boolean;
  className: string;
  isCurrentPlan: boolean;
  helperText?: string;
  /** When set, Pricing should navigate here instead of starting Checkout. */
  href?: string;
};

type PlanLike = {
  id: SubscriptionTier;
  cta: string;
  ctaStyle: "btn-primary" | "btn-secondary";
};

export type PricingPlanMatchInput = {
  planId: SubscriptionTier;
  currentTier: SubscriptionTier;
  isSignedIn: boolean;
  /** Trusted subscription interval from GET /api/account/subscription (`month` | `year`). */
  currentBillingInterval: SubscriptionBillingInterval | null;
  /** Interval currently selected on the Pricing toggle. */
  displayedBillingInterval: CheckoutBillingInterval;
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  power: 2,
};

const MANAGE_HELPER = "Manage plan changes in Subscription & Billing.";

function formatTierLabel(tier: SubscriptionTier): string {
  if (tier === "free") {
    return "Free";
  }

  if (tier === "pro") {
    return "Pro";
  }

  return "Power";
}

function formatDisplayedIntervalLabel(interval: CheckoutBillingInterval): string {
  return interval === "monthly" ? "Monthly" : "Annual";
}

export function checkoutIntervalFromBillingInterval(
  interval: SubscriptionBillingInterval | null | undefined,
): CheckoutBillingInterval | null {
  if (interval === "month") {
    return "monthly";
  }

  if (interval === "year") {
    return "annual";
  }

  return null;
}

function intervalsMatch(
  currentBillingInterval: SubscriptionBillingInterval | null,
  displayedBillingInterval: CheckoutBillingInterval,
): boolean {
  const currentAsCheckout = checkoutIntervalFromBillingInterval(currentBillingInterval);
  return currentAsCheckout !== null && currentAsCheckout === displayedBillingInterval;
}

function getCurrentPlanButtonClass(plan: PlanLike): string {
  const base = plan.ctaStyle === "btn-primary" ? "btn-primary" : "btn-secondary";
  const hoverReset =
    "hover:[background-color:var(--immifin-button-default-cyan)] hover:text-white hover:shadow-[0_10px_15px_-3px_color-mix(in_srgb,var(--immifin-button-default-cyan)_28%,transparent)]";

  return `${base} btn-no-sweep w-full cursor-not-allowed opacity-75 transition-none active:scale-100 ${hoverReset}`;
}

/**
 * A paid card is Current Plan only when tier AND billing interval both match.
 * Free has no billing interval — Free remains current on either toggle.
 */
export function isPricingCurrentPlanCard(input: PricingPlanMatchInput): boolean {
  if (!input.isSignedIn) {
    return false;
  }

  if (input.planId === "free") {
    return input.currentTier === "free";
  }

  if (input.currentTier !== input.planId) {
    return false;
  }

  return intervalsMatch(input.currentBillingInterval, input.displayedBillingInterval);
}

/**
 * Checkout-mode plan action for a pricing card.
 * Current Plan requires tier + interval match for paid plans.
 */
export function getCheckoutPlanButtonConfig(
  plan: PlanLike,
  currentTier: SubscriptionTier,
  isSignedIn: boolean,
  currentBillingInterval: SubscriptionBillingInterval | null = null,
  displayedBillingInterval: CheckoutBillingInterval = "monthly",
): CheckoutPlanButtonConfig {
  const isCurrentPlan = isPricingCurrentPlanCard({
    planId: plan.id,
    currentTier,
    isSignedIn,
    currentBillingInterval,
    displayedBillingInterval,
  });

  if (isCurrentPlan) {
    return {
      label: "Current Plan",
      disabled: true,
      className: getCurrentPlanButtonClass(plan),
      isCurrentPlan: true,
      helperText: "Your active subscription",
    };
  }

  if (plan.id === "free") {
    if (!isSignedIn) {
      return {
        label: plan.cta,
        disabled: false,
        className: `${plan.ctaStyle} w-full`,
        isCurrentPlan: false,
      };
    }

    return {
      label: "Downgrade to Free",
      disabled: false,
      className: `${plan.ctaStyle} w-full`,
      isCurrentPlan: false,
      helperText: MANAGE_HELPER,
      href: buildBillingChangeHandoffHref("free", null),
    };
  }

  if (isSignedIn && currentTier !== "free") {
    const tierLabel = formatTierLabel(plan.id);
    const sameTier = currentTier === plan.id;
    const intervalMatches = intervalsMatch(currentBillingInterval, displayedBillingInterval);

    if (sameTier && !intervalMatches) {
      return {
        label: `Switch to ${tierLabel} ${formatDisplayedIntervalLabel(displayedBillingInterval)}`,
        disabled: false,
        className: `${plan.ctaStyle} w-full`,
        isCurrentPlan: false,
        helperText: MANAGE_HELPER,
        href: buildBillingChangeHandoffHref(plan.id, displayedBillingInterval),
      };
    }

    const isUpgrade = TIER_RANK[plan.id] > TIER_RANK[currentTier];

    return {
      label: isUpgrade ? `Upgrade to ${tierLabel}` : `Downgrade to ${tierLabel}`,
      disabled: false,
      className: `${plan.ctaStyle} w-full`,
      isCurrentPlan: false,
      helperText: MANAGE_HELPER,
      href: buildBillingChangeHandoffHref(plan.id, displayedBillingInterval),
    };
  }

  return {
    label: plan.cta,
    disabled: false,
    className: `${plan.ctaStyle} w-full`,
    isCurrentPlan: false,
  };
}
