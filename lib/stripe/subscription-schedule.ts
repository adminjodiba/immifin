import "server-only";

import type Stripe from "stripe";
import { StripeSubscriptionChangeError } from "@/lib/stripe/errors";
import { getStripeClient } from "@/lib/stripe/server";
import { extractStripeId } from "@/lib/stripe/stripe-ids";
import { getSubscriptionPeriodBounds } from "@/lib/stripe/subscription-period";

const ACTIVE_SCHEDULE_STATUSES = new Set(["active", "not_started"]);

function getUnixPeriodEnd(subscription: Stripe.Subscription): number {
  const { currentPeriodEnd } = getSubscriptionPeriodBounds(subscription);

  if (!currentPeriodEnd) {
    throw new StripeSubscriptionChangeError(
      "Stripe subscription is missing a current billing period end.",
      502,
    );
  }

  return Math.floor(new Date(currentPeriodEnd).getTime() / 1000);
}

function getExistingScheduleId(subscription: Stripe.Subscription): string | null {
  return extractStripeId(subscription.schedule);
}

async function retrieveSchedule(scheduleId: string): Promise<Stripe.SubscriptionSchedule> {
  const stripe = getStripeClient();

  try {
    return await stripe.subscriptionSchedules.retrieve(scheduleId);
  } catch {
    throw new StripeSubscriptionChangeError(
      "Unable to retrieve the existing subscription schedule.",
      502,
    );
  }
}

function assertScheduleIsSafeToUpdate(schedule: Stripe.SubscriptionSchedule): void {
  if (schedule.status === "canceled" || schedule.status === "completed") {
    return;
  }

  if (!ACTIVE_SCHEDULE_STATUSES.has(schedule.status)) {
    throw new StripeSubscriptionChangeError(
      "Existing subscription schedule is in an unsupported state.",
      409,
    );
  }
}

function buildScheduledPhases(input: {
  currentPriceId: string;
  targetPriceId: string;
  periodStart: number;
  periodEnd: number;
}): Stripe.SubscriptionScheduleUpdateParams.Phase[] {
  return [
    {
      items: [{ price: input.currentPriceId, quantity: 1 }],
      start_date: input.periodStart,
      end_date: input.periodEnd,
      proration_behavior: "none",
    },
    {
      items: [{ price: input.targetPriceId, quantity: 1 }],
      proration_behavior: "none",
    },
  ];
}

/**
 * Schedules a target price for the next billing period using Stripe subscription schedules.
 * Reuses an existing active schedule when present.
 */
export async function scheduleSubscriptionPriceChangeAtPeriodEnd(input: {
  subscription: Stripe.Subscription;
  currentPriceId: string;
  targetPriceId: string;
}): Promise<void> {
  const stripe = getStripeClient();
  const periodEnd = getUnixPeriodEnd(input.subscription);
  const { currentPeriodStart } = getSubscriptionPeriodBounds(input.subscription);
  const periodStart = currentPeriodStart
    ? Math.floor(new Date(currentPeriodStart).getTime() / 1000)
    : input.subscription.start_date;

  if (!periodStart) {
    throw new StripeSubscriptionChangeError(
      "Stripe subscription is missing a current billing period start.",
      502,
    );
  }

  const existingScheduleId = getExistingScheduleId(input.subscription);

  if (existingScheduleId) {
    const schedule = await retrieveSchedule(existingScheduleId);
    assertScheduleIsSafeToUpdate(schedule);

    await stripe.subscriptionSchedules.update(existingScheduleId, {
      end_behavior: "release",
      proration_behavior: "none",
      phases: buildScheduledPhases({
        currentPriceId: input.currentPriceId,
        targetPriceId: input.targetPriceId,
        periodStart,
        periodEnd,
      }),
    });

    return;
  }

  const createdSchedule = await stripe.subscriptionSchedules.create({
    from_subscription: input.subscription.id,
  });

  const firstPhase = createdSchedule.phases[0];

  if (!firstPhase) {
    throw new StripeSubscriptionChangeError(
      "Stripe did not return a current subscription schedule phase.",
      502,
    );
  }

  await stripe.subscriptionSchedules.update(createdSchedule.id, {
    end_behavior: "release",
    proration_behavior: "none",
    phases: buildScheduledPhases({
      currentPriceId: input.currentPriceId,
      targetPriceId: input.targetPriceId,
      periodStart: firstPhase.start_date,
      periodEnd,
    }),
  });
}

export function assertNoConflictingScheduleForImmediateChange(
  subscription: Stripe.Subscription,
): void {
  const scheduleId = getExistingScheduleId(subscription);

  if (!scheduleId) {
    return;
  }

  throw new StripeSubscriptionChangeError(
    "An existing subscription schedule must be resolved before this change can be applied.",
    409,
  );
}

export function getSubscriptionEffectiveAtIso(subscription: Stripe.Subscription): string {
  const { currentPeriodEnd } = getSubscriptionPeriodBounds(subscription);

  if (!currentPeriodEnd) {
    throw new StripeSubscriptionChangeError(
      "Stripe subscription is missing a current billing period end.",
      502,
    );
  }

  return currentPeriodEnd;
}
