"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { DevSubscriptionActivationDialog } from "@/components/pricing/DevSubscriptionActivationDialog";
import { buildSignInUrl } from "@/lib/auth/signInRedirect";
import { useCanUseDevSubscriptionTools } from "@/lib/hooks/useCanUseDevSubscriptionTools";
import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import {
  ACTIVATING_COPY,
  CANCELLED_COPY,
  CHECKOUT_ACTIVATION_POLL_MS,
  CHECKOUT_ACTIVATION_SUCCESS_DISMISS_MS,
  CHECKOUT_ACTIVATION_TIMEOUT_MS,
  TIMEOUT_COPY,
  activationSuccessCopy,
  canStartCheckoutActivationPolling,
  checkoutExperienceFromQuery,
  decideCheckoutActivationPoll,
  INITIAL_CHECKOUT_EXPERIENCE,
  type CheckoutExperienceState,
} from "@/lib/pricing/checkout-activation";
import {
  BILLING_NOT_BILLED_LABEL,
  DEVELOPMENT_PLAN_OVERRIDE_LABEL,
  formatBillingIntervalLabel,
  formatPlanLabel,
} from "@/lib/billing/billing-center";
import {
  getCheckoutPlanButtonConfig,
  isPricingCurrentPlanCard,
  isSimulatedPaidEntitlement,
} from "@/lib/pricing/checkout-plan-actions";
import { getPlanDisplay } from "@/lib/pricing/plan-display";
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
    ...getPlanDisplay("free"),
    cta: "Create Free Account",
    ctaStyle: "btn-secondary",
    highlighted: false,
  },
  {
    ...getPlanDisplay("pro"),
    cta: "Upgrade to Pro",
    ctaStyle: "btn-primary",
    highlighted: true,
  },
  {
    ...getPlanDisplay("power"),
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
      <div role="group" aria-label="Billing interval" className="ds2-pricing-toggle">
        {(["monthly", "annual"] as const).map((interval) => {
          const selected = value === interval;
          return (
            <button
              key={interval}
              type="button"
              onClick={() => onChange(interval)}
              className="ds2-pricing-toggle-option"
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
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { canUse: contextDevMode, isLoading: subscriptionLoading } = useCanUseDevSubscriptionTools();
  const devMode = isSignedIn
    ? contextDevMode && !subscriptionLoading
    : developmentSubscriptionModeEnabled;
  const subscriptionContext = useSubscriptionTierContext();
  const { tier: currentTier } = useEffectiveSubscriptionTier();
  const currentBillingInterval = subscriptionContext?.billingInterval ?? null;
  const hasPaidStripeSubscription = subscriptionContext?.hasPaidStripeSubscription ?? false;
  const simulatedPaidEntitlement = isSimulatedPaidEntitlement(
    currentTier,
    hasPaidStripeSubscription,
  );
  // Dev override UX only when server authorized this user (dedicated test account).
  const developmentSubscriptionOverrideActive = Boolean(devMode && simulatedPaidEntitlement);
  const [billingInterval, setBillingInterval] = useState<CheckoutBillingInterval>("monthly");
  const [pendingPlan, setPendingPlan] = useState<SubscriptionTier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutLoadingTier, setCheckoutLoadingTier] = useState<SubscriptionTier | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutExperience, setCheckoutExperience] =
    useState<CheckoutExperienceState>(INITIAL_CHECKOUT_EXPERIENCE);

  const currentPlanCardRef = useRef<HTMLElement | null>(null);
  const pollInFlightRef = useRef(false);
  const activationHandledQueryRef = useRef<string | null>(null);

  const resetCheckoutExperience = useCallback(() => {
    setCheckoutExperience(INITIAL_CHECKOUT_EXPERIENCE);
  }, []);

  const markActivated = useCallback((tier: "pro" | "power") => {
    setCheckoutExperience({ phase: "activated", activatedTier: tier });
    setSuccessMessage(null);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    const checkoutState = searchParams.get("checkout");
    if (!checkoutState) {
      return;
    }

    const queryKey = `${checkoutState}|${searchParams.get("session_id") ?? ""}`;
    if (activationHandledQueryRef.current === queryKey) {
      return;
    }

    const next = checkoutExperienceFromQuery(checkoutState);
    if (!next) {
      return;
    }

    activationHandledQueryRef.current = queryKey;
    setCheckoutExperience(next);
    setSuccessMessage(null);
    setErrorMessage(null);
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (checkoutExperience.phase !== "activating") {
      return;
    }

    // S7-BILLING-UX-008A: do not start the bounded timeout until Clerk reports a
    // signed-in session — otherwise refreshStoredTier returns null without a
    // network read and activation can time out after sync already wrote Pro.
    if (
      !canStartCheckoutActivationPolling({
        isLoaded: isAuthLoaded,
        isSignedIn,
      })
    ) {
      return;
    }

    const refresh = subscriptionContext?.refreshStoredTier;
    if (!refresh) {
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const stopTimers = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const pollOnce = async () => {
      if (cancelled || pollInFlightRef.current) {
        return;
      }

      pollInFlightRef.current = true;
      try {
        const tier = await refresh();
        if (cancelled) {
          return;
        }
        const decision = decideCheckoutActivationPoll(tier);
        if (decision.action === "activated") {
          stopTimers();
          markActivated(decision.tier);
        }
      } catch {
        // Keep polling until timeout; transient errors should not alarm.
      } finally {
        pollInFlightRef.current = false;
      }
    };

    void pollOnce();
    intervalId = setInterval(() => {
      void pollOnce();
    }, CHECKOUT_ACTIVATION_POLL_MS);

    timeoutId = setTimeout(() => {
      if (cancelled) {
        return;
      }
      stopTimers();
      setCheckoutExperience((current) =>
        current.phase === "activating"
          ? { phase: "timeout", activatedTier: null }
          : current,
      );
    }, CHECKOUT_ACTIVATION_TIMEOUT_MS);

    return () => {
      cancelled = true;
      stopTimers();
      pollInFlightRef.current = false;
    };
  }, [
    checkoutExperience.phase,
    isAuthLoaded,
    isSignedIn,
    markActivated,
    subscriptionContext?.refreshStoredTier,
  ]);

  useEffect(() => {
    if (checkoutExperience.phase !== "activated" || !checkoutExperience.activatedTier) {
      return;
    }

    const scrollId = window.setTimeout(() => {
      currentPlanCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    const dismissId = window.setTimeout(() => {
      setCheckoutExperience(INITIAL_CHECKOUT_EXPERIENCE);
    }, CHECKOUT_ACTIVATION_SUCCESS_DISMISS_MS);

    return () => {
      window.clearTimeout(scrollId);
      window.clearTimeout(dismissId);
    };
  }, [checkoutExperience.phase, checkoutExperience.activatedTier]);

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
    resetCheckoutExperience();

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
    resetCheckoutExperience();

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

  const activatedCopy =
    checkoutExperience.phase === "activated" && checkoutExperience.activatedTier
      ? activationSuccessCopy(checkoutExperience.activatedTier)
      : null;

  return (
    <>
      {checkoutExperience.phase === "activating" ? (
        <div className="mb-6" role="status" aria-live="polite">
          <div className="ds2-card-static flex items-start gap-3 px-4 py-3 text-sm text-[var(--immifin-ds2-text-primary)]">
            <span
              className="mt-0.5 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--immifin-ds2-border)] border-t-[var(--immifin-ds2-navy)]"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">{ACTIVATING_COPY.title}</p>
              <p className="mt-1 text-[var(--immifin-ds2-text-muted)]">{ACTIVATING_COPY.message}</p>
            </div>
          </div>
        </div>
      ) : null}

      {checkoutExperience.phase === "activated" && activatedCopy ? (
        <div className="mb-6" role="status" aria-live="polite">
          <div className="ds2-card-static border-[color-mix(in_srgb,var(--immifin-ds2-blue)_28%,var(--immifin-ds2-border))] px-4 py-3 text-sm text-[var(--immifin-ds2-text-primary)]">
            <p className="font-semibold">{activatedCopy.title}</p>
            <p className="mt-1 text-[var(--immifin-ds2-text-muted)]">{activatedCopy.message}</p>
          </div>
        </div>
      ) : null}

      {checkoutExperience.phase === "timeout" ? (
        <div className="mb-6" role="status" aria-live="polite">
          <div className="ds2-card-static border-[color-mix(in_srgb,var(--immifin-ds2-gold)_40%,var(--immifin-ds2-border))] px-4 py-3 text-sm text-[var(--immifin-ds2-text-primary)]">
            <p className="font-semibold">{TIMEOUT_COPY.title}</p>
            <p className="mt-1 text-[var(--immifin-ds2-text-muted)]">{TIMEOUT_COPY.message}</p>
          </div>
        </div>
      ) : null}

      {checkoutExperience.phase === "cancelled" ? (
        <div className="mb-6" role="status" aria-live="polite">
          <div className="ds2-card-static px-4 py-3 text-sm text-[var(--immifin-ds2-text-primary)]">
            <p className="font-semibold">{CANCELLED_COPY.title}</p>
            <p className="mt-1 text-[var(--immifin-ds2-text-muted)]">{CANCELLED_COPY.message}</p>
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-6">
          <p className="ds2-card-static border-[color-mix(in_srgb,var(--immifin-ds2-blue)_28%,var(--immifin-ds2-border))] px-4 py-3 text-sm text-[var(--immifin-ds2-text-primary)]">
            {successMessage}
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-6">
          <p className="ds2-card-static border-red-200 px-4 py-3 text-sm text-[var(--immifin-ds2-text-primary)]">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <section id="plans" className="ds2-pricing-plans">
        <div>
          {devMode ? (
            <p className="ds2-card-static mx-auto mb-8 max-w-2xl px-4 py-3 text-center text-sm text-[var(--immifin-ds2-text-primary)]">
              Development Subscription Mode is active. Select a plan to test Free, Pro, or Power —
              no payment is collected.
            </p>
          ) : (
            <>
              <BillingIntervalToggle value={billingInterval} onChange={setBillingInterval} />
              {isSignedIn && developmentSubscriptionOverrideActive ? (
                <p className="mx-auto mb-8 -mt-4 max-w-2xl text-center text-sm text-[var(--immifin-ds2-text-muted)]">
                  Current entitlement:{" "}
                  <span className="font-semibold text-[var(--immifin-ds2-text-primary)]">
                    {formatPlanLabel(currentTier)}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--immifin-ds2-text-muted)]">
                    {DEVELOPMENT_PLAN_OVERRIDE_LABEL} · {BILLING_NOT_BILLED_LABEL}
                  </span>
                </p>
              ) : isSignedIn && currentTier !== "free" && currentBillingInterval ? (
                <p className="mx-auto mb-8 -mt-4 max-w-2xl text-center text-sm text-[var(--immifin-ds2-text-muted)]">
                  Current subscription:{" "}
                  <span className="font-semibold text-[var(--immifin-ds2-text-primary)]">
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
                hasPaidStripeSubscription,
                developmentSubscriptionOverrideActive,
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
                    hasPaidStripeSubscription,
                    developmentSubscriptionOverrideActive,
                  )
                : null;
              const isCheckoutLoading = checkoutLoadingTier === plan.id;

              return (
                <article
                  key={plan.id}
                  ref={isCurrentPlanCard ? currentPlanCardRef : undefined}
                  className={`ds2-card-static ds2-pricing-card ${
                    plan.highlighted ? "ds2-pricing-card-featured" : ""
                  }`}
                >
                  {plan.highlighted ? (
                    <p className="ds2-pricing-badge">Most popular</p>
                  ) : null}
                  <h2 className="ds2-workspace-heading mt-1">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--immifin-ds2-text-muted)]">
                    {plan.description}
                  </p>

                  {plan.id === "free" ? (
                    <div className="mt-5">
                      <p className="ds2-pricing-amount">{formatPriceAmount(0)}</p>
                      <p className="mt-3 text-sm font-medium text-[var(--immifin-ds2-text-primary)]">
                        Free login required
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-[var(--immifin-ds2-navy)]">
                        No credit card required
                      </p>
                    </div>
                  ) : plan.id === "pro" || plan.id === "power" ? (
                    (() => {
                      const price = getPaidPlanPricePresentation(plan.id, billingInterval);
                      return (
                        <div className="mt-5">
                          <p className="ds2-pricing-amount">{price.amountLabel}</p>
                          <p className="mt-1 text-sm font-medium text-[var(--immifin-ds2-text-muted)]">
                            {price.periodLabel}
                          </p>
                          <p className="mt-1 text-xs text-[var(--immifin-ds2-text-muted)]">
                            {price.billingLabel}
                          </p>
                          {price.equivalentMonthlyLabel ? (
                            <p className="mt-2 text-sm text-[var(--immifin-ds2-text-muted)]">
                              {price.equivalentMonthlyLabel}
                            </p>
                          ) : null}
                          {price.savingsLabel ? (
                            <p className="mt-1 text-sm font-medium text-[var(--immifin-ds2-navy)]">
                              {price.savingsLabel}
                            </p>
                          ) : null}
                        </div>
                      );
                    })()
                  ) : null}

                  {isCurrentPlanCard ? (
                    <div className="mt-3">
                      <p className="ds2-pricing-badge">Current plan</p>
                      {developmentSubscriptionOverrideActive && plan.id === currentTier ? (
                        <>
                          <p className="mt-0.5 text-xs text-[var(--immifin-ds2-text-muted)]">
                            {DEVELOPMENT_PLAN_OVERRIDE_LABEL}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--immifin-ds2-text-muted)]">
                            {BILLING_NOT_BILLED_LABEL}
                          </p>
                        </>
                      ) : (
                        <p className="mt-0.5 text-xs text-[var(--immifin-ds2-text-muted)]">
                          Your current plan
                        </p>
                      )}
                    </div>
                  ) : null}

                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-2 text-sm text-[var(--immifin-ds2-text-primary)]"
                      >
                        <span className="ds2-pricing-check" aria-hidden="true">
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
                          <p className="mt-2 text-center text-xs text-[var(--immifin-ds2-text-muted)]">
                            {developmentSubscriptionOverrideActive
                              ? `${DEVELOPMENT_PLAN_OVERRIDE_LABEL} — ${BILLING_NOT_BILLED_LABEL}`
                              : "Your active subscription"}
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
                          <p className="mt-2 text-center text-xs text-[var(--immifin-ds2-text-muted)]">
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
                          <p className="mt-2 text-center text-xs text-[var(--immifin-ds2-text-muted)]">
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

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-[var(--immifin-ds2-text-muted)]">
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
