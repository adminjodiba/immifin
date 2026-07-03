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
 * - Development Free override: shows locked Pro preview.
 * - Production without billing: resolveSubscriptionTier defaults to pro (access granted).
 *
 * TODO(S4-billing): Pass stored subscription tier into useEffectiveSubscriptionTier
 * when billing/storage exists. Do not rely on the pro default forever.
 */
export function DashboardAccessGate({ children }: DashboardAccessGateProps) {
  const { tier } = useEffectiveSubscriptionTier();

  if (!canAccessPersonalDashboard(tier)) {
    return <LockedDashboardPreview />;
  }

  return <>{children}</>;
}
