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
  DEVELOPMENT_PLAN_OVERRIDE_LABEL,
  describeScheduledChange,
  formatBillingDate,
  formatBillingIntervalLabel,
  formatCurrentSubscriptionAmount,
  formatPlanLabel,
  formatSubscriptionStatusLabel,
  getBillingCenterActions,
  isEntitlementWithoutStripeBilling,
  type BillingCenterAction,
  type BillingSummary,
} from "@/lib/billing/billing-center";
import {
  buildPlanChangeReview,
  findBillingCenterActionForIntent,
  parsePlanChangeIntentFromSearchParams,
  type PlanChangeReview,
} from "@/lib/billing/plan-change-intent";
import {
  consumePendingUpgradeAfterPaymentMethod,
  storePendingUpgradeAfterPaymentMethod,
} from "@/lib/billing/pending-upgrade-after-payment-method";
import {
  actionRequiresInvoicePreview,
  isPreviewExpiredErrorMessage,
  UPGRADE_PREVIEW_EXPIRED_REFRESH_COPY,
  UPGRADE_PREVIEW_FAILURE_COPY,
  UPGRADE_SUBMITTED_PENDING_COPY,
} from "@/lib/billing/upgrade-confirmation-view";
import {
  actionRequiresScheduledDowngradeConfirm,
  formatScheduledFreeSuccessCopy,
  hasAuthoritativePeriodEnd,
  SCHEDULED_DOWNGRADE_SUCCESS_COPY,
  SCHEDULED_MISSING_EFFECTIVE_DATE_COPY,
  SCHEDULED_PLAN_CHANGE_SUCCESS_COPY,
} from "@/lib/billing/downgrade-confirmation-view";
import { checkoutIntervalFromBillingInterval } from "@/lib/pricing/checkout-plan-actions";
import { requestPaymentMethodPortalSession } from "@/lib/stripe/client-billing-portal";
import { startStripeCheckout } from "@/lib/stripe/client-checkout";
import {
  requestPaidSubscriptionChange,
  requestSubscriptionChangePreview,
  type SubscriptionChangeResponse,
} from "@/lib/stripe/client-subscription-change";
import type { SubscriptionChangePreviewResult } from "@/lib/stripe/subscription-change-preview.types";
import { useSubscriptionTierContext } from "@/lib/hooks/SubscriptionTierProvider";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import {
  BILLING_PORTAL_PAYMENT_METHOD_QUERY,
  BILLING_PORTAL_PAYMENT_METHOD_UPDATED_VALUE,
} from "@/lib/stripe/billing-portal-return-url.shared";

type BillingApiResponse = {
  tier: SubscriptionTier;
  plan: string;
  billing: BillingSummary;
  devSubscriptionMode?: boolean;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      tier: SubscriptionTier;
      billing: BillingSummary;
      devSubscriptionMode: boolean;
    };

function DetailRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className={emphasize ? "text-sm font-bold text-brand-700" : "text-sm font-medium text-slate-500"}>
        {label}
      </dt>
      <dd
        className={
          emphasize
            ? "text-sm font-bold text-brand-700 sm:text-right"
            : "text-sm font-semibold text-slate-900 sm:text-right"
        }
      >
        {value}
      </dd>
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
  result: SubscriptionChangeResponse,
  currentTier: SubscriptionTier,
): string {
  if (result.changeType === "retain_paid_subscription") {
    return "Your paid subscription will continue. IMMIFIN will update after Stripe confirms.";
  }

  if (result.changeType === "cancel_at_period_end") {
    return formatScheduledFreeSuccessCopy({
      effectiveAt: "effectiveAt" in result ? result.effectiveAt : undefined,
      currentTier,
    });
  }

  if (result.changeType === "scheduled_downgrade") {
    return SCHEDULED_DOWNGRADE_SUCCESS_COPY;
  }

  if (result.changeType === "scheduled_interval_change") {
    return SCHEDULED_PLAN_CHANGE_SUCCESS_COPY;
  }

  if (result.changeType === "immediate_upgrade") {
    if (result.status === "confirmed") {
      return UPGRADE_SUBMITTED_PENDING_COPY;
    }
    if (result.status === "requires_action") {
      return "Additional payment authentication is required to complete your upgrade.";
    }
    if (result.status === "failed") {
      return "Upgrade payment was not completed. Your current plan is unchanged.";
    }
  }

  if (result.status === "pending_confirmation") {
    return "Change submitted. IMMIFIN will update automatically after Stripe confirms billing — usually within a minute.";
  }

  if ("effectiveAt" in result && result.effectiveAt) {
    return `Change scheduled for ${formatBillingDate(result.effectiveAt)}. IMMIFIN will update after Stripe confirms.`;
  }

  return "Change scheduled. IMMIFIN will update automatically after Stripe confirms.";
}

/**
 * Immediate upgrades (and month→year) require a full Stripe invoice preview (UX-006).
 */
async function loadUpgradePreviewForAction(
  action: Exclude<BillingCenterAction, { kind: "checkout" }>,
): Promise<
  | { status: "skipped" }
  | { status: "ready"; preview: SubscriptionChangePreviewResult }
  | { status: "error"; message: string }
> {
  if (!actionRequiresInvoicePreview(action) || action.targetInterval == null) {
    return { status: "skipped" };
  }

  try {
    const preview = await requestSubscriptionChangePreview({
      targetTier: action.targetTier,
      targetInterval: action.targetInterval,
    });
    return { status: "ready", preview };
  } catch {
    return { status: "error", message: UPGRADE_PREVIEW_FAILURE_COPY };
  }
}

function applyPreviewToReview(
  current: PlanChangeReview,
  result: Awaited<ReturnType<typeof loadUpgradePreviewForAction>>,
  infoBanner: string | null = null,
): PlanChangeReview {
  if (result.status === "skipped") {
    return {
      ...current,
      upgradePreviewStatus: "none",
      upgradePreview: null,
      upgradePreviewError: null,
      previewInfoBanner: infoBanner,
    };
  }

  if (result.status === "error") {
    return {
      ...current,
      upgradePreviewStatus: "error",
      upgradePreview: null,
      upgradePreviewError: result.message,
      previewAuthorization: null,
      paymentMethodDisplay: null,
      paymentMethodStatus: null,
      previewInfoBanner: infoBanner,
    };
  }

  return {
    ...current,
    upgradePreviewStatus: "ready",
    upgradePreview: result.preview,
    upgradePreviewError: null,
    previewAuthorization: result.preview.previewAuthorization,
    paymentMethodDisplay: result.preview.paymentMethod?.displayLabel ?? null,
    paymentMethodStatus: result.preview.paymentMethodStatus,
    previewInfoBanner: infoBanner,
  };
}

export function BillingCenter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const subscriptionContext = useSubscriptionTierContext();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [pendingReview, setPendingReview] = useState<PlanChangeReview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningPaymentMethod, setIsOpeningPaymentMethod] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const intentHandledKeyRef = useRef<string | null>(null);
  const paymentMethodReturnHandledRef = useRef(false);

  const clearBillingQuery = useCallback(() => {
    if (
      !searchParams.get("targetTier") &&
      !searchParams.get("targetInterval") &&
      !searchParams.get(BILLING_PORTAL_PAYMENT_METHOD_QUERY)
    ) {
      return;
    }

    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

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
      const response = await fetch(`/api/account/subscription?_ts=${Date.now()}`, {
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
        devSubscriptionMode: Boolean(body.data.devSubscriptionMode),
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
    const baseReview = buildPlanChangeReview({
      tier: loadState.tier,
      billing: loadState.billing,
      action,
    });

    if (actionRequiresInvoicePreview(action)) {
      setPendingReview({
        ...baseReview,
        upgradePreviewStatus: "loading",
        upgradePreview: null,
        upgradePreviewError: null,
        previewAuthorization: null,
        paymentMethodDisplay: null,
        paymentMethodStatus: null,
        previewInfoBanner: null,
      });

      void loadUpgradePreviewForAction(action).then((preview) => {
        setPendingReview((current) => {
          if (!current || current.action.id !== action.id) {
            return current;
          }
          return applyPreviewToReview(current, preview);
        });
      });
      return;
    }

    setPendingReview(baseReview);
  }, [clearIntentQuery, loadState, searchParams]);

  function openReviewForAction(action: Exclude<BillingCenterAction, { kind: "checkout" }>) {
    if (loadState.status !== "ready") {
      return;
    }

    setActionError(null);
    setConfirmError(null);
    const baseReview = buildPlanChangeReview({
      tier: loadState.tier,
      billing: loadState.billing,
      action,
    });

    if (actionRequiresInvoicePreview(action)) {
      setPendingReview({
        ...baseReview,
        upgradePreviewStatus: "loading",
        upgradePreview: null,
        upgradePreviewError: null,
        previewAuthorization: null,
        paymentMethodDisplay: null,
        paymentMethodStatus: null,
        previewInfoBanner: null,
      });

      void loadUpgradePreviewForAction(action).then((preview) => {
        setPendingReview((current) => {
          if (!current || current.action.id !== action.id) {
            return current;
          }
          return applyPreviewToReview(current, preview);
        });
      });
      return;
    }

    setPendingReview(baseReview);
  }

  function retryUpgradePreview() {
    if (!pendingReview || !actionRequiresInvoicePreview(pendingReview.action)) {
      return;
    }

    const action = pendingReview.action;
    setConfirmError(null);
    setPendingReview((current) =>
      current
        ? {
            ...current,
            upgradePreviewStatus: "loading",
            upgradePreview: null,
            upgradePreviewError: null,
            previewAuthorization: null,
            paymentMethodDisplay: null,
            paymentMethodStatus: null,
          }
        : current,
    );

    void loadUpgradePreviewForAction(action).then((preview) => {
      setPendingReview((current) => {
        if (!current || current.action.id !== action.id) {
          return current;
        }
        return applyPreviewToReview(current, preview);
      });
    });
  }

  // After Stripe-hosted payment method management: invalidate old preview and reopen fresh.
  useEffect(() => {
    if (loadState.status !== "ready") {
      return;
    }

    if (
      searchParams.get(BILLING_PORTAL_PAYMENT_METHOD_QUERY) !==
      BILLING_PORTAL_PAYMENT_METHOD_UPDATED_VALUE
    ) {
      return;
    }

    if (paymentMethodReturnHandledRef.current) {
      return;
    }

    paymentMethodReturnHandledRef.current = true;
    setActionMessage("Payment method settings refreshed.");
    setConfirmError(null);
    setPendingReview(null);
    clearBillingQuery();

    const pending = consumePendingUpgradeAfterPaymentMethod();
    if (!pending) {
      return;
    }

    const action = findBillingCenterActionForIntent({
      tier: loadState.tier,
      billing: loadState.billing,
      intent: {
        targetTier: pending.targetTier,
        targetInterval: pending.targetInterval,
      },
    });

    if (!action || action.id !== pending.actionId) {
      setActionError(
        "Your payment method settings were refreshed. Re-open the plan change to continue with a fresh preview.",
      );
      return;
    }

    openReviewForAction(action);
    // openReviewForAction closes over loadState; intentional one-shot after return.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- payment_method return handoff
  }, [clearBillingQuery, loadState, searchParams]);

  function handleCancelConfirmation() {
    setPendingReview(null);
    setConfirmError(null);
    setIsSubmitting(false);
    setIsOpeningPaymentMethod(false);
    clearIntentQuery();
  }

  async function handleManagePaymentMethod() {
    if (!pendingReview || isSubmitting || isOpeningPaymentMethod) {
      return;
    }

    const action = pendingReview.action;
    if (
      (action.targetTier !== "pro" && action.targetTier !== "power") ||
      (action.targetInterval !== "monthly" && action.targetInterval !== "annual")
    ) {
      setConfirmError("Payment method management is only available for paid plan upgrades.");
      return;
    }

    setIsOpeningPaymentMethod(true);
    setConfirmError(null);

    try {
      storePendingUpgradeAfterPaymentMethod({
        targetTier: action.targetTier,
        targetInterval: action.targetInterval,
        actionId: action.id,
      });

      const { url } = await requestPaymentMethodPortalSession();

      // Invalidate confirmation only once redirect is about to begin.
      setPendingReview(null);
      window.location.assign(url);
    } catch (error: unknown) {
      setConfirmError(
        error instanceof Error
          ? error.message
          : "Unable to open payment method settings. Please try again.",
      );
      setIsOpeningPaymentMethod(false);
    }
  }

  async function handleConfirmChange() {
    if (!pendingReview || isSubmitting || isOpeningPaymentMethod) {
      return;
    }

    if (actionRequiresInvoicePreview(pendingReview.action)) {
      if (
        pendingReview.upgradePreviewStatus !== "ready" ||
        !pendingReview.previewAuthorization ||
        !pendingReview.upgradePreview
      ) {
        setConfirmError(UPGRADE_PREVIEW_FAILURE_COPY);
        return;
      }
    }

    if (actionRequiresScheduledDowngradeConfirm(pendingReview.action)) {
      if (
        loadState.status !== "ready" ||
        !hasAuthoritativePeriodEnd(loadState.billing) ||
        pendingReview.scheduledDowngrade?.missingEffectiveDate
      ) {
        setConfirmError(SCHEDULED_MISSING_EFFECTIVE_DATE_COPY);
        return;
      }
    }

    setIsSubmitting(true);
    setConfirmError(null);
    setActionError(null);

    try {
      const previewAuthorization = pendingReview.previewAuthorization;

      const result = await requestPaidSubscriptionChange({
        targetTier: pendingReview.action.targetTier,
        targetInterval: pendingReview.action.targetInterval,
        ...(previewAuthorization ? { previewAuthorization } : {}),
      });

      if (
        result.changeType === "immediate_upgrade" &&
        result.status === "requires_action" &&
        "payment" in result
      ) {
        if (result.payment.hostedInvoiceUrl) {
          // Smallest SCA path without Stripe.js: Stripe-hosted invoice payment.
          window.location.assign(result.payment.hostedInvoiceUrl);
          return;
        }

        setConfirmError(
          "Additional payment authentication is required, but a hosted invoice URL was not available. Please try again or contact support.",
        );
        return;
      }

      if (result.changeType === "immediate_upgrade" && result.status === "failed") {
        setConfirmError("Upgrade payment was not completed. Your current plan is unchanged.");
        return;
      }

      setActionMessage(
        successMessageForResult(result, loadState.status === "ready" ? loadState.tier : "pro"),
      );
      setPendingReview(null);
      clearIntentQuery();
      await subscriptionContext?.refreshStoredTier();
      await loadBilling();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to update subscription. Please try again.";

      if (
        actionRequiresInvoicePreview(pendingReview.action) &&
        isPreviewExpiredErrorMessage(message)
      ) {
        const action = pendingReview.action;
        setConfirmError(null);
        setPendingReview((current) =>
          current
            ? {
                ...current,
                upgradePreviewStatus: "loading",
                upgradePreview: null,
                upgradePreviewError: null,
                previewAuthorization: null,
                paymentMethodDisplay: null,
                paymentMethodStatus: null,
                previewInfoBanner: UPGRADE_PREVIEW_EXPIRED_REFRESH_COPY,
              }
            : current,
        );

        const refreshed = await loadUpgradePreviewForAction(action);
        setPendingReview((current) => {
          if (!current || current.action.id !== action.id) {
            return current;
          }
          return applyPreviewToReview(current, refreshed, UPGRADE_PREVIEW_EXPIRED_REFRESH_COPY);
        });
        return;
      }

      setConfirmError(message);
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

  const { tier, billing, devSubscriptionMode } = loadState;
  const actions = getBillingCenterActions({ tier, billing });
  const planLabel = formatPlanLabel(tier);
  const intervalLabel = formatBillingIntervalLabel(billing.billingInterval);
  const amountLabel = formatCurrentSubscriptionAmount(tier, billing);
  const renewalLabel = formatBillingDate(billing.currentPeriodEnd);
  const scheduledChange = describeScheduledChange(billing);
  const actionBusy = isSubmitting || isOpeningPaymentMethod || pendingReview !== null;
  const simulatedPaidEntitlement = isEntitlementWithoutStripeBilling(tier, billing);
  const showDevelopmentOverride =
    devSubscriptionMode && simulatedPaidEntitlement;

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
            {showDevelopmentOverride ? (
              <p className="mt-2 inline-flex w-fit items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                {DEVELOPMENT_PLAN_OVERRIDE_LABEL}
              </p>
            ) : null}
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
          {showDevelopmentOverride ? (
            <DetailRow label="Environment" value={DEVELOPMENT_PLAN_OVERRIDE_LABEL} />
          ) : null}
          <DetailRow label="Billing interval" value={intervalLabel} />
          <DetailRow
            label={simulatedPaidEntitlement ? "Billing" : "Current subscription amount"}
            value={amountLabel}
          />
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
          <DetailRow
            label="Scheduled plan change"
            value={scheduledChange}
            emphasize={scheduledChange !== "None"}
          />
        </dl>
        {billing.scheduledPlanChange && !billing.cancelAtPeriodEnd ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {planLabel} access remains active until{" "}
            <span className="font-semibold text-slate-900">
              {formatBillingDate(billing.scheduledPlanChange.effectiveAt)}
            </span>
            .
          </p>
        ) : null}
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

        {billing.scheduledPlanChange && !billing.cancelAtPeriodEnd ? (
          <p className="mt-4 text-sm text-slate-600">
            A plan change to {formatPlanLabel(billing.scheduledPlanChange.targetTier)}{" "}
            {formatBillingIntervalLabel(billing.scheduledPlanChange.targetInterval)} is already
            scheduled. The same transition is not offered again.
          </p>
        ) : null}

        {actions.length === 0 && !billing.cancelAtPeriodEnd ? (
          <p className="mt-4 text-sm text-slate-600">
            {simulatedPaidEntitlement
              ? showDevelopmentOverride
                ? "This plan is a development entitlement override with no Stripe billing. Use Development Subscription Mode (Account / Pricing) to switch plans. Stripe Checkout and paid plan changes are unavailable until you start a real Free → paid subscription."
                : "This plan has no active Stripe billing subscription. Stripe Checkout and paid plan changes are unavailable for this state."
              : "No plan changes are available for this subscription state."}
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
          message="During paid upgrades, change or add a payment method through Stripe-hosted settings. Standalone Billing Center payment management remains deferred."
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
          isOpeningPaymentMethod={isOpeningPaymentMethod}
          errorMessage={confirmError}
          onConfirm={() => void handleConfirmChange()}
          onCancel={handleCancelConfirmation}
          onManagePaymentMethod={() => void handleManagePaymentMethod()}
          onRetryPreview={retryUpgradePreview}
        />
      ) : null}
    </div>
  );
}
