import "server-only";

import type Stripe from "stripe";
import type { ScheduledPlanChange } from "@/lib/billing/scheduled-plan-change";
import {
  mapScheduleToCustomerSafePlanChange,
  type SubscriptionScheduleSnapshot,
} from "@/lib/billing/scheduled-plan-change";
import { assertApprovedStripePriceId } from "@/lib/stripe/catalog";
import { getStripeClient } from "@/lib/stripe/server";
import { extractStripeId } from "@/lib/stripe/stripe-ids";

function extractPhasePriceId(phase: Stripe.SubscriptionSchedule.Phase): string | null {
  const item = phase.items?.[0];
  if (!item) {
    return null;
  }

  return extractStripeId(item.price as string | { id: string } | null | undefined);
}

function toScheduleSnapshot(
  schedule: Stripe.SubscriptionSchedule,
): SubscriptionScheduleSnapshot {
  return {
    status: schedule.status,
    currentPhase: schedule.current_phase
      ? {
          startDateUnix: schedule.current_phase.start_date ?? null,
          endDateUnix: schedule.current_phase.end_date ?? null,
        }
      : null,
    phases: (schedule.phases ?? []).map((phase) => ({
      startDateUnix: phase.start_date ?? null,
      priceId: extractPhasePriceId(phase),
    })),
  };
}

function lookupApprovedCatalogPrice(priceId: string) {
  try {
    const entry = assertApprovedStripePriceId(priceId);
    return { tier: entry.tier, interval: entry.interval };
  } catch {
    return null;
  }
}

function extractCurrentPriceId(subscription: Stripe.Subscription): string | null {
  const price = subscription.items?.data?.[0]?.price;
  return extractStripeId(price as string | { id: string } | null | undefined);
}

export type LiveScheduledBillingState = {
  scheduledPlanChange: ScheduledPlanChange | null;
  /** Live Stripe `cancel_at_period_end`; null when retrieve failed (use DB). */
  stripeCancelAtPeriodEnd: boolean | null;
};

/**
 * Read-only: resolve a customer-safe scheduled paid-plan change from Stripe.
 * Never creates, updates, cancels, or releases schedules.
 * Retrieve/list failures and unapproved prices return null (do not fail Billing GET).
 */
export async function resolveScheduledPlanChangeFromStripe(
  stripeSubscriptionId: string | null | undefined,
): Promise<ScheduledPlanChange | null> {
  const live = await resolveLiveScheduledBillingStateFromStripe(stripeSubscriptionId);
  return live.scheduledPlanChange;
}

/**
 * Read-only live Stripe billing flags for Billing Center GET.
 * One subscription retrieve; schedule retrieve only when attached.
 */
export async function resolveLiveScheduledBillingStateFromStripe(
  stripeSubscriptionId: string | null | undefined,
): Promise<LiveScheduledBillingState> {
  const subscriptionId = stripeSubscriptionId?.trim() || "";
  if (!subscriptionId) {
    return { scheduledPlanChange: null, stripeCancelAtPeriodEnd: null };
  }

  try {
    const stripe = getStripeClient();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const stripeCancelAtPeriodEnd = subscription.cancel_at_period_end ?? false;
    const scheduleId = extractStripeId(subscription.schedule);

    if (!scheduleId) {
      return { scheduledPlanChange: null, stripeCancelAtPeriodEnd };
    }

    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);

    return {
      scheduledPlanChange: mapScheduleToCustomerSafePlanChange({
        schedule: toScheduleSnapshot(schedule),
        currentPriceId: extractCurrentPriceId(subscription),
        lookupCatalogPrice: lookupApprovedCatalogPrice,
      }),
      stripeCancelAtPeriodEnd,
    };
  } catch (error: unknown) {
    console.error(
      "[stripe-schedule-read] unable to resolve scheduled plan change:",
      error instanceof Error ? error.message : "unknown error",
    );
    return { scheduledPlanChange: null, stripeCancelAtPeriodEnd: null };
  }
}
