"use client";

import { useState } from "react";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import { isDevSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";
import { formatSubscriptionPlanLabel } from "@/lib/subscription/plan";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscription/tiers";

export function DevelopmentSubscriptionPanel() {
  const devMode = isDevSubscriptionModeEnabled();
  const subscriptionContext = useSubscriptionTierContext();
  const { tier } = useEffectiveSubscriptionTier();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!devMode || !subscriptionContext?.isSignedIn) {
    return null;
  }

  async function handleSwitch(nextTier: SubscriptionTier) {
    if (!subscriptionContext || nextTier === tier) {
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const activatedTier = await subscriptionContext.updateSubscriptionPlan(nextTier);
      setMessage(`${formatSubscriptionPlanLabel(activatedTier)} plan activated for testing.`);
    } catch (switchError: unknown) {
      setError(
        switchError instanceof Error
          ? switchError.message
          : "Failed to update subscription plan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="card-static mb-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
        Development Subscription Mode
      </p>
      <h2 className="heading-3 mt-2 text-slate-900">Subscription</h2>
      <p className="mt-2 text-sm text-slate-600">
        Beta testing controls for Free, Pro, and Power. No payment is collected.
      </p>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-500">Current Plan</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {formatSubscriptionPlanLabel(tier)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Development Mode</dt>
          <dd className="mt-1 text-base font-semibold text-brand-700">Active</dd>
        </div>
      </dl>

      {message ? (
        <p className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {SUBSCRIPTION_TIERS.map((option) => (
          <button
            key={option}
            type="button"
            disabled={isSubmitting || tier === option}
            onClick={() => void handleSwitch(option)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              tier === option
                ? "bg-brand-700 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Switch to {formatSubscriptionPlanLabel(option)}
          </button>
        ))}
      </div>
    </section>
  );
}
