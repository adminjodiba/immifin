/**
 * Customer-safe scheduled paid-plan change (Stripe Subscription Schedule destination).
 * Pure — no Stripe SDK / no network. Safe for Billing Center + verification.
 *
 * Free-at-period-end remains `cancelAtPeriodEnd` on BillingSummary.
 */

import type { SubscriptionBillingInterval } from "@/lib/supabase/types";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

export type ScheduledPlanChange = {
  targetTier: "pro" | "power";
  targetInterval: SubscriptionBillingInterval;
  effectiveAt: string;
};

export type CatalogPriceLookupResult = {
  tier: "pro" | "power";
  interval: SubscriptionBillingInterval;
};

export type SchedulePhaseSnapshot = {
  startDateUnix: number | null;
  priceId: string | null;
};

export type SubscriptionScheduleSnapshot = {
  status: string;
  currentPhase: {
    startDateUnix: number | null;
    endDateUnix: number | null;
  } | null;
  phases: SchedulePhaseSnapshot[];
};

const ACTIVE_SCHEDULE_STATUSES = new Set(["active", "not_started"]);

function isPositiveUnix(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function unixToIso(value: number | null | undefined): string | null {
  if (!isPositiveUnix(value)) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}

function findNextPhase(
  schedule: SubscriptionScheduleSnapshot,
): SchedulePhaseSnapshot | null {
  const phases = schedule.phases.filter((phase) => isPositiveUnix(phase.startDateUnix));

  if (phases.length === 0) {
    return null;
  }

  const sorted = [...phases].sort(
    (a, b) => (a.startDateUnix as number) - (b.startDateUnix as number),
  );

  const currentStart = schedule.currentPhase?.startDateUnix;
  const currentEnd = schedule.currentPhase?.endDateUnix;

  if (isPositiveUnix(currentEnd)) {
    const matchingEnd = sorted.find((phase) => phase.startDateUnix === currentEnd);
    if (matchingEnd) {
      return matchingEnd;
    }

    const afterEnd = sorted.find(
      (phase) => (phase.startDateUnix as number) > currentEnd,
    );
    if (afterEnd) {
      return afterEnd;
    }
  }

  if (isPositiveUnix(currentStart)) {
    const afterCurrent = sorted.find(
      (phase) => (phase.startDateUnix as number) > currentStart,
    );
    if (afterCurrent) {
      return afterCurrent;
    }
  }

  return sorted.length >= 2 ? sorted[1] : null;
}

/**
 * Maps a Stripe Subscription Schedule snapshot to a customer-safe destination.
 * Unknown/unapproved prices, terminal schedules, and same-price next phases → null.
 */
export function mapScheduleToCustomerSafePlanChange(input: {
  schedule: SubscriptionScheduleSnapshot | null;
  currentPriceId: string | null;
  lookupCatalogPrice: (priceId: string) => CatalogPriceLookupResult | null;
}): ScheduledPlanChange | null {
  const schedule = input.schedule;

  if (!schedule) {
    return null;
  }

  if (!ACTIVE_SCHEDULE_STATUSES.has(schedule.status)) {
    return null;
  }

  const nextPhase = findNextPhase(schedule);
  const nextPriceId = nextPhase?.priceId?.trim() || null;

  if (!nextPriceId) {
    return null;
  }

  const currentPriceId = input.currentPriceId?.trim() || null;
  if (currentPriceId && nextPriceId === currentPriceId) {
    return null;
  }

  const catalog = input.lookupCatalogPrice(nextPriceId);
  if (!catalog) {
    return null;
  }

  const effectiveAt = unixToIso(nextPhase?.startDateUnix);
  if (!effectiveAt) {
    return null;
  }

  return {
    targetTier: catalog.tier,
    targetInterval: catalog.interval,
    effectiveAt,
  };
}

export function checkoutIntervalToBillingInterval(
  interval: "monthly" | "annual" | null | undefined,
): SubscriptionBillingInterval | null {
  if (interval === "monthly") {
    return "month";
  }

  if (interval === "annual") {
    return "year";
  }

  return null;
}

export function scheduledPlanChangeMatchesAction(input: {
  scheduled: ScheduledPlanChange | null | undefined;
  targetTier: SubscriptionTier;
  targetInterval: "monthly" | "annual" | null;
}): boolean {
  const scheduled = input.scheduled;
  if (!scheduled) {
    return false;
  }

  if (input.targetTier !== scheduled.targetTier) {
    return false;
  }

  const interval = checkoutIntervalToBillingInterval(input.targetInterval);
  return interval === scheduled.targetInterval;
}
