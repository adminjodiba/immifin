"use client";

import type { ReactNode } from "react";
import { LockedDashboardPreview } from "@/components/dashboard/LockedDashboardPreview";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { canAccessPersonalDashboard } from "@/lib/subscription/capabilities";

type DashboardAccessGateProps = {
  children: ReactNode;
};

/**
 * Gates full dashboard content by capability.
 *
 * - No enrolled tier → Free → locked Pro preview.
 * - Development may override tier via DEV ONLY controls.
 * - Production never applies dev overrides.
 *
 * TODO(S4-billing): Pass stored subscription tier into useEffectiveSubscriptionTier
 * when billing/storage exists.
 */
export function DashboardAccessGate({ children }: DashboardAccessGateProps) {
  const { tier } = useEffectiveSubscriptionTier();

  if (!canAccessPersonalDashboard(tier)) {
    return <LockedDashboardPreview />;
  }

  return <>{children}</>;
}
