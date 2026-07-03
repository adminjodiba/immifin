"use client";

import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from "@/lib/subscription/tiers";

/**
 * DEV ONLY control for testing Free / Pro / Power UI states.
 * Renders nothing in production builds.
 */
export function DevTierSwitcher() {
  const { tier, setDevTier, isDevTesting } = useEffectiveSubscriptionTier();

  if (!isDevTesting) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[100] rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 shadow-lg shadow-slate-200/60">
      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
        DEV ONLY - TIER
      </p>
      <div className="mt-1.5 flex gap-1">
        {SUBSCRIPTION_TIERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDevTier(option)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-colors ${
              tier === option
                ? "bg-amber-700 text-white"
                : "bg-white text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[10px] text-amber-700">
        Or use <code className="font-mono">?devTier=free</code>
      </p>
    </div>
  );
}

export type { SubscriptionTier };
