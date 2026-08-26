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

const TERMINAL_SCHEDULE_STATUSES = new Set(["released", "canceled", "completed"]);

/**
 * S7-BILLING-UX-008C — replace an attached paid-plan schedule with Free at period end.
 *
 * Stripe does not treat `cancel_at_period_end` as a second destination alongside an
 * active Subscription Schedule. Updating the subscription while a schedule is attached
 * is typically rejected; `subscriptionSchedules.cancel()` cancels the subscription now.
 *
 * Sequence (not atomic — Stripe has no single replacement API for this pair):
 * 1. `subscriptionSchedules.release` — drops remaining phases (e.g. Pro), leaves
 *    current Power in place. Failure → original Power→Pro schedule unchanged.
 * 2. `subscriptions.update({ cancel_at_period_end: true })` — IMMIFIN's existing
 *    Free-at-period-end path. Failure after release → Power continues with no Pro
 *    destination and no Free yet; retry only needs step 2. Entitlement is not
 *    rewritten locally.
 */
export async function releaseAttachedScheduleThenCancelAtPeriodEnd(
  subscription: Stripe.Subscription,
): Promise<{ effectiveAt: string; releasedSchedule: boolean }> {
  const effectiveAt = getSubscriptionEffectiveAtIso(subscription);

  if (subscription.cancel_at_period_end) {
    return { effectiveAt, releasedSchedule: false };
  }

  const stripe = getStripeClient();
  const scheduleId = getExistingScheduleId(subscription);
  let releasedSchedule = false;

  if (scheduleId) {
    const schedule = await retrieveSchedule(scheduleId);

    if (ACTIVE_SCHEDULE_STATUSES.has(schedule.status)) {
      try {
        await stripe.subscriptionSchedules.release(scheduleId);
        releasedSchedule = true;
      } catch {
        throw new StripeSubscriptionChangeError(
          "Unable to replace the existing scheduled plan change. Your current plan is unchanged.",
          502,
        );
      }
    } else if (!TERMINAL_SCHEDULE_STATUSES.has(schedule.status)) {
      throw new StripeSubscriptionChangeError(
        "Existing subscription schedule is in an unsupported state.",
        409,
      );
    }
  }

  try {
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });
  } catch {
    throw new StripeSubscriptionChangeError(
      releasedSchedule
        ? "The previous scheduled paid plan was removed, but Free could not be scheduled. Please try Downgrade to Free again. Your current plan and access are unchanged."
        : "Unable to schedule a downgrade to Free. Your current plan is unchanged.",
      502,
    );
  }

  return { effectiveAt, releasedSchedule };
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
