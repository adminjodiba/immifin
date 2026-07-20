"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { PlanChangeConfirmationDialog } from "@/components/billing/PlanChangeConfirmationDialog";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import {
  BILLING_CENTER_PATH,
  describeScheduledChange,
  formatBillingDate,
  formatBillingIntervalLabel,
  formatPlanLabel,
  formatSubscriptionStatusLabel,
  getBillingCenterActions,
  type BillingCenterAction,
  type BillingSummary,
} from "@/lib/billing/billing-center";
import {
  buildPlanChangeReview,
  findBillingCenterActionForIntent,
  parsePlanChangeIntentFromSearchParams,
  type PlanChangeReview,
} from "@/lib/billing/plan-change-intent";
import { formatPricePerPeriod } from "@/lib/pricing/pricing-display-catalog";
import { checkoutIntervalFromBillingInterval } from "@/lib/pricing/checkout-plan-actions";
import { startStripeCheckout } from "@/lib/stripe/client-checkout";
import { requestPaidSubscriptionChange } from "@/lib/stripe/client-subscription-change";
import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

function formatCurrentSubscriptionAmount(
  tier: SubscriptionTier,
  billingInterval: BillingSummary["billingInterval"],
): string {
  if (tier === "free" || !billingInterval) {
    return formatPricePerPeriod("free", null);
  }

  return formatPricePerPeriod(tier, billingInterval);
}

type BillingApiResponse = {
  tier: SubscriptionTier;
  plan: string;
  billing: BillingSummary;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; tier: SubscriptionTier; billing: BillingSummary };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 sm:text-right">{value}</dd>
    </div>
  );
}

function PlaceholderPanel({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <section className="card-static">
      <h2 className="heading-3 text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>
      <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Coming soon
      </p>
    </section>
  );
}

function actionButtonClass(variant: BillingCenterAction["variant"]): string {
  if (variant === "primary") {
    return "btn-primary";
  }

  if (variant === "danger") {
    return "btn-danger";
  }

  return "btn-secondary";
}

function successMessageForResult(
  result: {
    status: string;
    changeType?: string;
    effectiveAt?: string;
  },
  currentTier: SubscriptionTier,
): string {
  if (result.changeType === "retain_paid_subscription") {
    return "Your paid subscription will continue. IMMIFIN will update after Stripe confirms.";
  }

  if (result.changeType === "cancel_at_period_end") {
    const effective = formatBillingDate(result.effectiveAt);
    const planName = formatPlanLabel(currentTier);
    if (effective === "—") {
      return `Downgrade scheduled. You will continue enjoying all ${planName} features until the end of your current billing period.`;
    }
    return `Downgrade scheduled. Your account will automatically transition to the Free plan on ${effective}. You will continue enjoying all ${planName} features until that date.`;
  }

  if (result.status === "pending_confirmation") {
    return "Change submitted. IMMIFIN will update automatically after Stripe confirms billing — usually within a minute.";
  }

  if (result.effectiveAt) {
    return `Change scheduled for ${formatBillingDate(result.effectiveAt)}. IMMIFIN will update after Stripe confirms.`;
  }

  return "Change scheduled. IMMIFIN will update automatically after Stripe confirms.";
}

export function BillingCenter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subscriptionContext = useSubscriptionTierContext();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [pendingReview, setPendingReview] = useState<PlanChangeReview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const intentHandledKeyRef = useRef<string | null>(null);

  const clearIntentQuery = useCallback(() => {
    if (!searchParams.get("targetTier") && !searchParams.get("targetInterval")) {
      return;
    }

    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const loadBilling = useCallback(async () => {
    setLoadState({ status: "loading" });
    setActionError(null);

    try {
      const response = await fetch("/api/account/subscription", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load subscription details.");
      }

      const body = await readJsonResponseBody<BillingApiResponse>(response);

      if (!body.ok || !body.data.billing) {
        throw new Error(body.ok ? "Billing details are unavailable." : body.error);
      }

      setLoadState({
        status: "ready",
        tier: body.data.tier,
        billing: body.data.billing,
      });
    } catch (error: unknown) {
      setLoadState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to load billing details.",
      });
    }
  }, []);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    if (loadState.status !== "ready") {
      return;
    }

    const hasIntentParams =
      searchParams.has("targetTier") || searchParams.has("targetInterval");

    if (!hasIntentParams) {
      intentHandledKeyRef.current = null;
      return;
    }

    const intentKey = `${searchParams.get("targetTier") ?? ""}|${searchParams.get("targetInterval") ?? ""}`;
    if (intentHandledKeyRef.current === intentKey) {
      return;
    }

    intentHandledKeyRef.current = intentKey;

    const intent = parsePlanChangeIntentFromSearchParams(searchParams);

    if (!intent) {
      setActionError("That plan-change link is invalid and was ignored.");
      clearIntentQuery();
      return;
    }

    const action = findBillingCenterActionForIntent({
      tier: loadState.tier,
      billing: loadState.billing,
      intent,
    });

    if (!action) {
      setActionError(
        "That plan change is not available from your current subscription. Choose an available action below.",
      );
      clearIntentQuery();
      return;
    }

    setActionError(null);
    setConfirmError(null);
    setPendingReview(
      buildPlanChangeReview({
        tier: loadState.tier,
        billing: loadState.billing,
        action,
      }),
    );
  }, [clearIntentQuery, loadState, searchParams]);

  function openReviewForAction(action: Exclude<BillingCenterAction, { kind: "checkout" }>) {
    if (loadState.status !== "ready") {
      return;
    }

    setActionError(null);
    setConfirmError(null);
    setActionMessage(null);
    setPendingReview(
      buildPlanChangeReview({
        tier: loadState.tier,
        billing: loadState.billing,
        action,
      }),
    );
  }

  function handleCancelConfirmation() {
    setPendingReview(null);
    setConfirmError(null);
    setIsSubmitting(false);
    clearIntentQuery();
  }

  async function handleConfirmChange() {
    if (!pendingReview || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setConfirmError(null);
    setActionError(null);

    try {
      const result = await requestPaidSubscriptionChange({
        targetTier: pendingReview.action.targetTier,
        targetInterval: pendingReview.action.targetInterval,
      });

      setActionMessage(successMessageForResult(result, loadState.status === "ready" ? loadState.tier : "pro"));
      setPendingReview(null);
      clearIntentQuery();
      await subscriptionContext?.refreshStoredTier();
      await loadBilling();
    } catch (error: unknown) {
      setConfirmError(
        error instanceof Error ? error.message : "Unable to update subscription. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAction(action: BillingCenterAction) {
    setActionError(null);
    setActionMessage(null);

    if (action.kind === "checkout") {
      setIsSubmitting(true);
      try {
        const { url } = await startStripeCheckout({
          tier: action.targetTier,
          interval: action.targetInterval,
        });
        window.location.assign(url);
      } catch (error: unknown) {
        setActionError(
          error instanceof Error ? error.message : "Unable to start checkout. Please try again.",
        );
        setIsSubmitting(false);
      }
      return;
    }

    openReviewForAction(action);
  }

  async function handleKeepMySubscription() {
    if (loadState.status !== "ready" || isSubmitting) {
      return;
    }

    const { tier, billing } = loadState;
    const targetInterval = checkoutIntervalFromBillingInterval(billing.billingInterval);

    if (tier !== "pro" && tier !== "power") {
      return;
    }

    if (!targetInterval) {
      setActionError("Unable to keep your subscription because the billing interval is missing.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const result = await requestPaidSubscriptionChange({
        targetTier: tier,
        targetInterval,
      });

      setActionMessage(successMessageForResult(result, tier));
      await subscriptionContext?.refreshStoredTier();
      await loadBilling();
    } catch (error: unknown) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to keep your subscription. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadState.status === "loading") {
    return (
      <div className="card-static">
        <p className="text-sm text-slate-600">Loading subscription details…</p>
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="card-static">
        <h2 className="heading-3 text-slate-900">Unable to load billing</h2>
        <p className="mt-2 text-sm text-slate-600">{loadState.message}</p>
        <button type="button" className="btn-secondary mt-4" onClick={() => void loadBilling()}>
          Try again
        </button>
      </div>
    );
  }

  const { tier, billing } = loadState;
  const actions = getBillingCenterActions({ tier, billing });
  const planLabel = formatPlanLabel(tier);
  const intervalLabel = formatBillingIntervalLabel(billing.billingInterval);
  const amountLabel = formatCurrentSubscriptionAmount(tier, billing.billingInterval);
  const renewalLabel = formatBillingDate(billing.currentPeriodEnd);
  const scheduledChange = describeScheduledChange(billing);
  const actionBusy = isSubmitting || pendingReview !== null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-2">
            <h1 className="heading-2 text-slate-900">Subscription &amp; Billing</h1>
            <FavoriteStar pageLabel="Subscription & Billing" pageHref={BILLING_CENTER_PATH} />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Manage your IMMIFIN plan, renewals, and supported subscription changes.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link href="/pricing" className="btn-secondary">
            View plans
          </Link>
          <DashboardCloseAction href="/" />
        </div>
      </header>

      <section className="card-static">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Current subscription
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {planLabel}
              {intervalLabel !== "—" ? (
                <span className="text-lg font-semibold text-slate-500"> · {intervalLabel}</span>
              ) : null}
            </h2>
            <p className="mt-1 text-lg font-semibold text-slate-800">{amountLabel}</p>
            {renewalLabel !== "—" ? (
              <p className="mt-1 text-sm text-slate-600">
                {billing.cancelAtPeriodEnd ? "Ends" : "Renews"} {renewalLabel}
              </p>
            ) : null}
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
            {formatSubscriptionStatusLabel(billing.stripeStatus ?? billing.status)}
          </span>
        </div>

        <dl className="mt-1">
          <DetailRow label="Current plan" value={planLabel} />
          <DetailRow label="Billing interval" value={intervalLabel} />
          <DetailRow label="Current subscription amount" value={amountLabel} />
          <DetailRow
            label="Subscription status"
            value={formatSubscriptionStatusLabel(billing.status)}
          />
          <DetailRow
            label="Current period start"
            value={formatBillingDate(billing.currentPeriodStart)}
          />
          <DetailRow
            label="Current period end"
            value={formatBillingDate(billing.currentPeriodEnd)}
          />
          <DetailRow label="Renewal date" value={renewalLabel} />
          <DetailRow
            label="Downgrade to Free scheduled"
            value={billing.cancelAtPeriodEnd ? "Yes" : "No"}
          />
          <DetailRow label="Scheduled plan change" value={scheduledChange} />
        </dl>
      </section>

      {billing.cancelAtPeriodEnd ? (
        <section className="card-static border-amber-200 bg-amber-50/40">
          <h2 className="heading-3 text-slate-900">Downgrade Scheduled</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Your account will automatically transition to the Free plan
            {renewalLabel !== "—" ? (
              <>
                {" "}
                on <span className="font-semibold text-slate-900">{renewalLabel}</span>
              </>
            ) : (
              <> at the end of your current billing period</>
            )}
            .
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            You will continue enjoying all {planLabel} features until that date.
          </p>
          <button
            type="button"
            className="btn-primary mt-5"
            disabled={actionBusy}
            onClick={() => void handleKeepMySubscription()}
          >
            {isSubmitting ? "Working…" : "Keep My Subscription"}
          </button>
        </section>
      ) : null}

      <section className="card-static">
        <h2 className="heading-3 text-slate-900">Available actions</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Only changes supported by IMMIFIN billing policy and Stripe are available here.
          Listed amounts are destination list prices, not invoice previews.
        </p>

        {actionMessage ? (
          <p className="mt-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
            {actionMessage}
          </p>
        ) : null}

        {actionError ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {actionError}
          </p>
        ) : null}

        {billing.cancelAtPeriodEnd ? (
          <p className="mt-4 text-sm text-slate-600">
            Other plan changes are unavailable while a Downgrade to Free is scheduled. Use Keep My
            Subscription above if you want to continue on {planLabel}.
          </p>
        ) : null}

        {actions.length === 0 && !billing.cancelAtPeriodEnd ? (
          <p className="mt-4 text-sm text-slate-600">
            No plan changes are available for this subscription state.
          </p>
        ) : null}

        {!billing.cancelAtPeriodEnd ? (
          <ul className="mt-5 space-y-3">
            {actions.map((action) => (
              <li
                key={action.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                  {action.listPriceLabel ? (
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {action.listPriceLabel}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-slate-600">{action.description}</p>
                  {action.timingNote ? (
                    <p className="mt-1 text-xs text-slate-500">{action.timingNote}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={`${actionButtonClass(action.variant)} shrink-0`}
                  disabled={actionBusy}
                  onClick={() => void handleAction(action)}
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PlaceholderPanel
          title="Payment method"
          message="Payment method management will connect to Stripe Customer Portal in a later task. No payment details are available yet."
        />
        <PlaceholderPanel
          title="Recent billing activity"
          message="Invoice history and receipts will appear here after Customer Portal / invoice sync is implemented. No billing activity data is invented."
        />
      </div>

      {pendingReview ? (
        <PlanChangeConfirmationDialog
          review={pendingReview}
          isSubmitting={isSubmitting}
          errorMessage={confirmError}
          onConfirm={() => void handleConfirmChange()}
          onCancel={handleCancelConfirmation}
        />
      ) : null}
    </div>
  );
}
