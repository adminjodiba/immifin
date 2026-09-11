"use client";

import type { ReactNode } from "react";
import { IntelligenceLockedState } from "@/components/intelligence/IntelligenceLockedState";
import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { canAccessAI } from "@/lib/subscription/capabilities";

type IntelligenceAccessGateProps = {
  children: ReactNode;
};

/**
 * Client gate for Power `accessAI`.
 * Server API remains the authoritative enforcement boundary.
 * Controlled-beta eligibility is enforced by IntelligenceBetaServerGate + API.
 */
export function IntelligenceAccessGate({ children }: IntelligenceAccessGateProps) {
  const subscription = useSubscriptionTierContext();
  const { tier } = useEffectiveSubscriptionTier();

  if (subscription?.isLoading) {
    return (
      <div className="ds2-card-static px-4 py-8 text-sm text-[var(--immifin-ds2-text-muted)] sm:px-6">
        Loading your workspace…
      </div>
    );
  }

  if (!canAccessAI(tier)) {
    return <IntelligenceLockedState embedded />;
  }

  return <>{children}</>;
}
