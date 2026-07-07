"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { DevSubscriptionActivationDialog } from "@/components/pricing/DevSubscriptionActivationDialog";
import { buildSignInUrl } from "@/lib/auth/signInRedirect";
import { useCanUseDevSubscriptionTools } from "@/lib/hooks/useCanUseDevSubscriptionTools";
import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { isDevSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";
import { formatSubscriptionPlanLabel } from "@/lib/subscription/plan";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

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
    plan.ctaStyle === "btn-primary"
      ? "hover:bg-brand-700 hover:shadow-brand-700/20"
      : "hover:border-slate-200 hover:bg-white hover:shadow-sm";

  return `${base} w-full cursor-not-allowed opacity-75 transition-none active:scale-100 ${hoverReset}`;
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

export function PricingPlans() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { canUse: devMode } = useCanUseDevSubscriptionTools();
  const subscriptionContext = useSubscriptionTierContext();
  const { tier: currentTier } = useEffectiveSubscriptionTier();
  const [pendingPlan, setPendingPlan] = useState<SubscriptionTier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  return (
    <>
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
              {isDevSubscriptionModeEnabled()
                ? "Development Subscription Mode is active. Select a plan to test Free, Pro, or Power — no payment is collected."
                : "Admin testing mode is active. Select a plan to test Free, Pro, or Power — no payment is collected."}
            </p>
          ) : null}

          <div className="grid w-full gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan = devMode && isSignedIn && currentTier === plan.id;
              const devButton =
                devMode && isSignedIn ? getDevModeButtonConfig(plan, currentTier) : null;

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

                  {isCurrentPlan ? (
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
                    ) : plan.id === "free" ? (
                      <Link href="/signup" className={`${plan.ctaStyle} w-full`}>
                        {plan.cta}
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`${plan.ctaStyle} w-full cursor-not-allowed opacity-80`}
                          disabled
                        >
                          Coming Soon
                        </button>
                        <p className="mt-2 text-center text-xs text-slate-500">
                          Billing is not enabled yet. Join the waitlist when payments launch.
                        </p>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500">
            Free users can enter profile data anytime. Pro unlocks automation — dashboard, alerts,
            and tracking. Power adds AI and advanced intelligence. Stripe checkout will connect
            here later.
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
