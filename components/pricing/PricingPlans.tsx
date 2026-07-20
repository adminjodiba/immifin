"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { DevSubscriptionActivationDialog } from "@/components/pricing/DevSubscriptionActivationDialog";
import { buildSignInUrl } from "@/lib/auth/signInRedirect";
import { useCanUseDevSubscriptionTools } from "@/lib/hooks/useCanUseDevSubscriptionTools";
import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import {
  getCheckoutPlanButtonConfig,
  isPricingCurrentPlanCard,
} from "@/lib/pricing/checkout-plan-actions";
import {
  formatCurrentSubscriptionPriceLine,
  formatPriceAmount,
  getPaidPlanPricePresentation,
} from "@/lib/pricing/pricing-display-catalog";
import {
  startStripeCheckout,
  type CheckoutBillingInterval,
} from "@/lib/stripe/client-checkout";
import { formatSubscriptionPlanLabel } from "@/lib/subscription/plan";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { formatBillingIntervalLabel, formatPlanLabel } from "@/lib/billing/billing-center";

type PlanConfig = {
  id: SubscriptionTier;
  name: string;
  description: string;
  features: readonly string[];
  cta: string;
  ctaStyle: "btn-primary" | "btn-secondary";
  highlighted: boolean;
};

const plans: readonly PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    description: "Check bulletins and use calculators manually.",
    features: [
      "Current Visa Bulletin Dashboard",
      "Manual calculators",
      "Manage profile data",
      "No automation",
      "No notifications",
      "No AI",
    ],
    cta: "Get Started",
    ctaStyle: "btn-secondary",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Automation for your immigration journey.",
    features: [
      "Personalized Dashboard",
      "Auto-populated calculators",
      "Visa Bulletin history",
      "Movement tracker",
      "Email alerts",
      "Notifications",
    ],
    cta: "Upgrade to Pro",
    ctaStyle: "btn-primary",
    highlighted: true,
  },
  {
    id: "power",
    name: "Power",
    description: "Full intelligence for life in America.",
    features: [
      "Everything in Pro",
      "AI Assistant",
      "Multiple profiles",
      "Advanced insights",
      "Priority support",
    ],
    cta: "Upgrade to Power",
    ctaStyle: "btn-secondary",
    highlighted: false,
  },
];

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  power: 2,
};

const SWITCH_LABELS: Record<SubscriptionTier, string> = {
  free: "Switch to Free",
  pro: "Switch to Pro",
  power: "Switch to Power",
};

type DevModeButtonConfig = {
  label: string;
  disabled: boolean;
  className: string;
  isCurrentPlan: boolean;
};

function getCurrentPlanButtonClass(plan: PlanConfig): string {
  const base = plan.ctaStyle === "btn-primary" ? "btn-primary" : "btn-secondary";
  const hoverReset =
    "hover:[background-color:var(--immifin-button-default-cyan)] hover:text-white hover:shadow-[0_10px_15px_-3px_color-mix(in_srgb,var(--immifin-button-default-cyan)_28%,transparent)]";

  return `${base} btn-no-sweep w-full cursor-not-allowed opacity-75 transition-none active:scale-100 ${hoverReset}`;
}

function getDevModeButtonConfig(plan: PlanConfig, currentTier: SubscriptionTier): DevModeButtonConfig {
  const isCurrentPlan = plan.id === currentTier;

  if (isCurrentPlan) {
    return {
      label: "Current Plan",
      disabled: true,
      className: getCurrentPlanButtonClass(plan),
      isCurrentPlan: true,
    };
  }

  if (TIER_RANK[plan.id] < TIER_RANK[currentTier]) {
    return {
      label: SWITCH_LABELS[plan.id],
      disabled: false,
      className: `${plan.ctaStyle} w-full`,
      isCurrentPlan: false,
    };
  }

  return {
    label: plan.cta,
    disabled: false,
    className: `${plan.ctaStyle} w-full`,
    isCurrentPlan: false,
  };
}

function BillingIntervalToggle({
  value,
  onChange,
}: {
  value: CheckoutBillingInterval;
  onChange: (interval: CheckoutBillingInterval) => void;
}) {
  return (
    <div className="mx-auto mb-8 flex justify-center">
      <div
        role="group"
        aria-label="Billing interval"
        className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
      >
        {(["monthly", "annual"] as const).map((interval) => {
          const selected = value === interval;
          return (
            <button
              key={interval}
              type="button"
              onClick={() => onChange(interval)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                selected
                  ? "bg-brand-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              aria-pressed={selected}
            >
              {interval}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PricingPlans({
  developmentSubscriptionModeEnabled = false,
}: {
  developmentSubscriptionModeEnabled?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const { canUse: contextDevMode, isLoading: subscriptionLoading } = useCanUseDevSubscriptionTools();
  const devMode = isSignedIn
    ? contextDevMode && !subscriptionLoading
    : developmentSubscriptionModeEnabled;
  const subscriptionContext = useSubscriptionTierContext();
  const { tier: currentTier } = useEffectiveSubscriptionTier();
  const currentBillingInterval = subscriptionContext?.billingInterval ?? null;
  const [billingInterval, setBillingInterval] = useState<CheckoutBillingInterval>("monthly");
  const [pendingPlan, setPendingPlan] = useState<SubscriptionTier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutLoadingTier, setCheckoutLoadingTier] = useState<SubscriptionTier | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [returnMessage, setReturnMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkoutState = searchParams.get("checkout");

    if (checkoutState === "cancelled") {
      setReturnMessage("Checkout was canceled. You can try again whenever you are ready.");
      setSuccessMessage(null);
      setErrorMessage(null);
    } else if (checkoutState === "success") {
      setReturnMessage(
        "Payment received. Your subscription will activate after Stripe confirms billing — usually within a minute.",
      );
      setSuccessMessage(null);
      setErrorMessage(null);
    } else {
      return;
    }

    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  async function handleActivate() {
    if (!pendingPlan || !subscriptionContext) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const activatedTier = await subscriptionContext.updateSubscriptionPlan(pendingPlan);
      setSuccessMessage(
        `${formatSubscriptionPlanLabel(activatedTier)} plan activated for testing.`,
      );
      setPendingPlan(null);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to activate subscription plan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePlanClick(planId: SubscriptionTier) {
    setSuccessMessage(null);
    setErrorMessage(null);
    setReturnMessage(null);

    if (!devMode) {
      return;
    }

    if (!isSignedIn) {
      router.push(buildSignInUrl(pathname));
      return;
    }

    if (planId === currentTier) {
      return;
    }

    setPendingPlan(planId);
  }

  async function handleCheckoutClick(planId: SubscriptionTier) {
    setSuccessMessage(null);
    setErrorMessage(null);
    setReturnMessage(null);

    if (planId !== "pro" && planId !== "power") {
      return;
    }

    if (!isSignedIn) {
      router.push(buildSignInUrl(pathname));
      return;
    }

    if (currentTier !== "free") {
      return;
    }

    setCheckoutLoadingTier(planId);

    try {
      const { url } = await startStripeCheckout({
        tier: planId,
        interval: billingInterval,
      });
      window.location.assign(url);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start checkout. Please try again.",
      );
      setCheckoutLoadingTier(null);
    }
  }

  return (
    <>
      {returnMessage ? (
        <div className="container-main mb-6">
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
            {returnMessage}
          </p>
        </div>
      ) : null}

      {successMessage ? (
        <div className="container-main mb-6">
          <p className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
            {successMessage}
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="container-main mb-6">
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <section id="plans" className="workspace-section">
        <div className="container-main">
          {devMode ? (
            <p className="mx-auto mb-8 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
              Development Subscription Mode is active. Select a plan to test Free, Pro, or Power —
              no payment is collected.
            </p>
          ) : (
            <>
              <BillingIntervalToggle value={billingInterval} onChange={setBillingInterval} />
              {isSignedIn && currentTier !== "free" && currentBillingInterval ? (
                <p className="mx-auto mb-8 -mt-4 max-w-2xl text-center text-sm text-slate-600">
                  Current subscription:{" "}
                  <span className="font-semibold text-slate-900">
                    {formatPlanLabel(currentTier)}{" "}
                    {formatBillingIntervalLabel(currentBillingInterval)} —{" "}
                    {formatCurrentSubscriptionPriceLine(currentTier, currentBillingInterval)}
                  </span>
                </p>
              ) : null}
            </>
          )}

          <div className="grid w-full gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlanCard = isPricingCurrentPlanCard({
                planId: plan.id,
                currentTier,
                isSignedIn: Boolean(isSignedIn),
                currentBillingInterval,
                displayedBillingInterval: billingInterval,
              });
              const devButton =
                devMode && isSignedIn ? getDevModeButtonConfig(plan, currentTier) : null;
              const checkoutButton = !devMode
                ? getCheckoutPlanButtonConfig(
                    plan,
                    currentTier,
                    Boolean(isSignedIn),
                    currentBillingInterval,
                    billingInterval,
                  )
                : null;
              const isCheckoutLoading = checkoutLoadingTier === plan.id;

              return (
                <article
                  key={plan.id}
                  className={`card-static flex flex-col ${
                    plan.highlighted ? "border-brand-300 ring-2 ring-brand-100" : ""
                  }`}
                >
                  {plan.highlighted ? (
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                      Most popular
                    </p>
                  ) : null}
                  <h2 className="heading-3 mt-1 text-slate-900">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{plan.description}</p>

                  {plan.id === "free" ? (
                    <div className="mt-5">
                      <p className="text-3xl font-bold tracking-tight text-slate-900">
                        {formatPriceAmount(0)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-600">Free</p>
                    </div>
                  ) : plan.id === "pro" || plan.id === "power" ? (
                    (() => {
                      const price = getPaidPlanPricePresentation(plan.id, billingInterval);
                      return (
                        <div className="mt-5">
                          <p className="text-3xl font-bold tracking-tight text-slate-900">
                            {price.amountLabel}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-600">
                            {price.periodLabel}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{price.billingLabel}</p>
                          {price.equivalentMonthlyLabel ? (
                            <p className="mt-2 text-sm text-slate-600">
                              {price.equivalentMonthlyLabel}
                            </p>
                          ) : null}
                          {price.savingsLabel ? (
                            <p className="mt-1 text-sm font-medium text-brand-700">
                              {price.savingsLabel}
                            </p>
                          ) : null}
                        </div>
                      );
                    })()
                  ) : null}

                  {isCurrentPlanCard ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                        Current plan
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">Your current plan</p>
                    </div>
                  ) : null}

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm text-slate-700">
                        <span className="mt-0.5 text-brand-600" aria-hidden="true">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    {devMode ? (
                      <>
                        <button
                          type="button"
                          className={devButton?.className ?? `${plan.ctaStyle} w-full`}
                          onClick={() => handlePlanClick(plan.id)}
                          disabled={devButton?.disabled ?? false}
                          aria-disabled={devButton?.isCurrentPlan ?? false}
                        >
                          {devButton?.isCurrentPlan ? (
                            <>
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold"
                                aria-hidden="true"
                              >
                                ✓
                              </span>
                              Current Plan
                            </>
                          ) : (
                            (devButton?.label ?? plan.cta)
                          )}
                        </button>
                        {devButton?.isCurrentPlan ? (
                          <p className="mt-2 text-center text-xs text-slate-500">
                            Your active subscription
                          </p>
                        ) : null}
                      </>
                    ) : plan.id === "free" && !isSignedIn ? (
                      <Link href="/signup" className={`${plan.ctaStyle} w-full`}>
                        {plan.cta}
                      </Link>
                    ) : checkoutButton?.href ? (
                      <>
                        <Link href={checkoutButton.href} className={checkoutButton.className}>
                          {checkoutButton.label}
                        </Link>
                        {checkoutButton.helperText ? (
                          <p className="mt-2 text-center text-xs text-slate-500">
                            {checkoutButton.helperText}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={checkoutButton?.className ?? `${plan.ctaStyle} w-full`}
                          onClick={() => {
                            if (plan.id === "pro" || plan.id === "power") {
                              void handleCheckoutClick(plan.id);
                            }
                          }}
                          disabled={
                            checkoutButton?.disabled ||
                            isCheckoutLoading ||
                            (plan.id !== "pro" && plan.id !== "power")
                          }
                        >
                          {isCheckoutLoading ? "Redirecting..." : (checkoutButton?.label ?? plan.cta)}
                        </button>
                        {checkoutButton?.helperText ? (
                          <p className="mt-2 text-center text-xs text-slate-500">
                            {checkoutButton.helperText}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500">
            Free includes manual tools and profile entry. Pro adds automation — dashboard, alerts,
            and tracking. Power adds AI and advanced intelligence. Paid plans are billed through
            Stripe; your access updates after billing is confirmed.
          </p>
        </div>
      </section>

      <DevSubscriptionActivationDialog
        plan={pendingPlan ?? "free"}
        open={pendingPlan !== null}
        isSubmitting={isSubmitting}
        onActivate={() => void handleActivate()}
        onCancel={() => setPendingPlan(null)}
      />
    </>
  );
}
