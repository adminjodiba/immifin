"use client";

import type { ReactNode } from "react";
import { ProFeatureLockedState } from "@/components/subscription/ProFeatureLockedState";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import {
  hasCapability,
  type SubscriptionCapability,
} from "@/lib/subscription/capabilities";

type ProFeatureGateProps = {
  capability: SubscriptionCapability;
  children: ReactNode;
  title?: string;
  continueHref?: string;
  continueLabel?: string;
  /** Compact layout for Manage Profile tabs. */
  embedded?: boolean;
};

/**
 * Renders children when the effective tier has the required capability.
 * Otherwise shows the shared Pro locked state.
 */
export function ProFeatureGate({
  capability,
  children,
  title,
  continueHref,
  continueLabel,
  embedded = false,
}: ProFeatureGateProps) {
  const { tier } = useEffectiveSubscriptionTier();

  if (!hasCapability(tier, capability)) {
    if (embedded) {
      return (
        <ProFeatureLockedState
          title={title}
          continueHref={continueHref}
          continueLabel={continueLabel}
          embedded
        />
      );
    }

    return (
      <section className="section-padding !pt-10 sm:!pt-16">
        <div className="container-main">
          <ProFeatureLockedState
            title={title}
            continueHref={continueHref}
            continueLabel={continueLabel}
          />
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
