"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BillingManagement } from "@/components/billing/BillingManagement";
import { PlanChangeConfirmationDialog } from "@/components/billing/PlanChangeConfirmationDialog";
import { PlanCardEmblem } from "@/components/billing/PlanCardEmblem";
import { PlanIdentityCards } from "@/components/billing/PlanIdentityCards";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import {
  DEVELOPMENT_PLAN_OVERRIDE_LABEL,
  formatBillingDate,
  formatBillingIntervalLabel,
  formatCurrentSubscriptionAmount,
  formatPlanLabel,
  formatSubscriptionStatusLabel,
  getBillingCenterActions,
  isActiveSubscriptionStatus,
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

function formatAbsentBillingValue(value: string): string {
  return value === "—" ? "Not applicable" : value;
}

function presentRenewalField(
  currentPeriodEnd: string | null,
  cancelAtPeriodEnd: boolean,
): { label: string; value: string } {
  const formatted = formatBillingDate(currentPeriodEnd);

  if (formatted === "—") {
    return { label: "Renewal date", value: "Not applicable" };
  }

  const parsed = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { label: "Renewal date", value: "Not applicable" };
  }

  if (parsed.getTime() < Date.now()) {
    return { label: "Period end", value: formatted };
  }

  return {
    label: cancelAtPeriodEnd ? "Ends" : "Renewal date",
    value: formatted,
  };
}

function formatAutoRenewLabel(
  tier: SubscriptionTier,
  billing: Pick<BillingSummary, "hasPaidStripeSubscription" | "cancelAtPeriodEnd">,
): string {
  if (tier === "free" || !billing.hasPaidStripeSubscription) {
    return "Not applicable";
  }

  return billing.cancelAtPeriodEnd ? "Off" : "On";
}

function getPlanWelcomeCopy(tier: SubscriptionTier): { greeting: string; support: string } {
  if (tier === "power") {
    return {
      greeting: "Your Power plan is active.",
      support: "Power includes Pro automation plus intelligence tools.",
    };
  }

  if (tier === "pro") {
    return {
      greeting: "Your Pro plan is active.",
      support: "Pro adds automation for your immigration journey.",
    };
  }

  return {
    greeting: "Great to have you with us!",
    support: "You're on the Free plan with access to our core tools. Upgrade anytime for advanced features.",
  };
}

function DetailIcon({
  name,
}: {
  name: "calendar" | "amount" | "status" | "period" | "renewal" | "autorenew";
}) {
  const common = "h-4 w-4";
  if (name === "amount") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="5" y="5.5" width="14" height="13" rx="1.6" />
        <path d="M8 4.5v3M16 4.5v3M5 10h14" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "status") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="7.5" />
        <path d="M12 8v4.2M12 15.6h.01" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "renewal") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="7.5" />
        <path d="M12 8.2V12l2.6 1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "autorenew") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M6.2 10.2A6.2 6.2 0 1 1 7.4 7.1" strokeLinecap="round" />
        <path d="M6 6.2v4h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="5" y="5.5" width="14" height="13" rx="1.6" />
      <path d="M8 4.5v3M16 4.5v3M5 10h14" strokeLinecap="round" />
    </svg>
  );
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
      <div className="ds2-card-static">
        <p className="text-sm text-[var(--immifin-ds2-text-muted)]">Loading subscription details…</p>
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="ds2-card-static">
        <h2 className="ds2-workspace-heading">Unable to load billing</h2>
        <p className="mt-2 text-sm text-[var(--immifin-ds2-text-muted)]">{loadState.message}</p>
        <button type="button" className="btn-secondary mt-4" onClick={() => void loadBilling()}>
          Try again
        </button>
      </div>
    );
  }

  const { tier, billing, devSubscriptionMode } = loadState;
  const planLabel = formatPlanLabel(tier);
  const intervalLabel = formatAbsentBillingValue(
    formatBillingIntervalLabel(billing.billingInterval),
  );
  const amountLabel = formatCurrentSubscriptionAmount(tier, billing);
  const renewalField = presentRenewalField(billing.currentPeriodEnd, billing.cancelAtPeriodEnd);
  const actionBusy = isSubmitting || isOpeningPaymentMethod || pendingReview !== null;
  const simulatedPaidEntitlement = isEntitlementWithoutStripeBilling(tier, billing);
  const showDevelopmentOverride =
    devSubscriptionMode && simulatedPaidEntitlement;
  const welcomeCopy = getPlanWelcomeCopy(tier);
  const statusLabel = formatSubscriptionStatusLabel(billing.status);
  const statusIsActive = isActiveSubscriptionStatus(billing.status);
  const availableActions = getBillingCenterActions({ tier, billing });

  const detailRows = [
    { icon: "amount" as const, label: "Current amount", value: amountLabel },
    { icon: "status" as const, label: "Subscription status", value: statusLabel, pill: true },
    {
      icon: "period" as const,
      label: "Current period",
      value: formatAbsentBillingValue(formatBillingDate(billing.currentPeriodStart)),
    },
    { icon: "renewal" as const, label: renewalField.label, value: renewalField.value },
    { icon: "autorenew" as const, label: "Auto-renew", value: formatAutoRenewLabel(tier, billing) },
  ];

  return (
    <div className="ds2-billing-stack">
      <div className="ds2-billing-summary">
        <section
          className={
            tier === "power"
              ? "ds2-billing-plan-card ds2-billing-plan-card-power"
              : tier === "pro"
                ? "ds2-billing-plan-card ds2-billing-plan-card-pro"
                : "ds2-billing-plan-card ds2-billing-plan-card-free"
          }
          aria-labelledby="current-plan-heading"
        >
          <div className="ds2-billing-plan-card-glow" aria-hidden="true" />
          <div className="ds2-billing-plan-card-waves" aria-hidden="true">
            <svg
              className="ds2-billing-plan-card-wave ds2-billing-plan-card-wave-c"
              viewBox="0 0 2400 160"
              preserveAspectRatio="none"
            >
              <path d="M0 58C100 18 200 98 400 58C500 18 600 98 800 58C900 18 1000 98 1200 58C1300 18 1400 98 1600 58C1700 18 1800 98 2000 58C2100 18 2200 98 2400 58V160H0Z" />
            </svg>
            <svg
              className="ds2-billing-plan-card-wave ds2-billing-plan-card-wave-b"
              viewBox="0 0 2400 160"
              preserveAspectRatio="none"
            >
              <path d="M0 82C100 118 200 46 400 82C500 118 600 46 800 82C900 118 1000 46 1200 82C1300 118 1400 46 1600 82C1700 118 1800 46 2000 82C2100 118 2200 46 2400 82V160H0Z" />
            </svg>
            <svg
              className="ds2-billing-plan-card-wave ds2-billing-plan-card-wave-a"
              viewBox="0 0 2400 160"
              preserveAspectRatio="none"
            >
              <path d="M0 108C100 88 200 128 400 108C500 88 600 128 800 108C900 88 1000 128 1200 108C1300 88 1400 128 1600 108C1700 88 1800 128 2000 108C2100 88 2200 128 2400 108V160H0Z" />
            </svg>
          </div>
          <PlanCardEmblem tier={tier} />
          <div className="ds2-billing-plan-card-content">
            <p className="ds2-billing-plan-card-kicker">Current Plan</p>
            <h2 id="current-plan-heading" className="ds2-billing-plan-card-name">
              {planLabel}
            </h2>
            <p className="ds2-billing-plan-card-greeting">{welcomeCopy.greeting}</p>
            <p className="ds2-billing-plan-card-copy">{welcomeCopy.support}</p>
            {showDevelopmentOverride ? (
              <p className="ds2-billing-dev-badge">{DEVELOPMENT_PLAN_OVERRIDE_LABEL}</p>
            ) : null}
            <p className="ds2-billing-plan-card-wordmark">
              <span>IMMIFIN</span>
              <span>Know where you stand.</span>
            </p>
          </div>
        </section>

        <section className="ds2-billing-details-card" aria-labelledby="billing-details-heading">
          <header className="ds2-billing-details-header">
            <div className="ds2-billing-details-title-row">
              <span className="ds2-billing-details-title-icon" aria-hidden="true">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="5" y="5.5" width="14" height="13" rx="1.6" />
                  <path d="M8 4.5v3M16 4.5v3M5 10h14" strokeLinecap="round" />
                </svg>
              </span>
              <h2 id="billing-details-heading" className="ds2-billing-details-title">
                Billing Details
              </h2>
            </div>
            <span className="ds2-billing-interval-badge">{intervalLabel}</span>
          </header>
          <dl className="ds2-billing-details-list">
            {detailRows.map((row) => (
              <div key={row.label} className="ds2-billing-details-row">
                <span className="ds2-billing-details-row-icon" aria-hidden="true">
                  <DetailIcon name={row.icon} />
                </span>
                <dt>{row.label}</dt>
                <dd>
                  {row.pill ? (
                    <span
                      className={
                        statusIsActive
                          ? "ds2-billing-status-pill ds2-billing-status-active"
                          : "ds2-billing-status-pill ds2-billing-status-inactive"
                      }
                    >
                      <span className="ds2-billing-status-led" aria-hidden="true" />
                      {row.value}
                    </span>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {actionMessage ? (
        <p className="ds2-billing-status-ok">{actionMessage}</p>
      ) : null}
      {actionError ? <p className="ds2-billing-status-error">{actionError}</p> : null}

      <BillingManagement
        tier={tier}
        billing={billing}
        actions={availableActions}
        actionBusy={actionBusy}
        isSubmitting={isSubmitting}
        onSelectAction={(action) => void handleAction(action)}
        onKeepSubscription={() => void handleKeepMySubscription()}
      />

      <PlanIdentityCards currentTier={tier} />

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
