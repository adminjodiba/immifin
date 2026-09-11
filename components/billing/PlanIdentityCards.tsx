"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FocusEvent } from "react";
import { PlanCardEmblem } from "@/components/billing/PlanCardEmblem";
import { PlanIdentityPreview } from "@/components/billing/PlanIdentityPreview";
import { formatPlanLabel } from "@/lib/billing/billing-center";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

const PLAN_ORDER: readonly SubscriptionTier[] = ["free", "pro", "power"];
const FLOATING_QUERY = "(hover: hover) and (pointer: fine) and (min-width: 768px)";
const CLOSE_DELAY_MS = 180;

function previewIdFor(plan: SubscriptionTier): string {
  return `ds2-billing-plan-preview-${plan}`;
}

function identityCardClass(plan: SubscriptionTier): string {
  if (plan === "power") {
    return "ds2-billing-identity-card ds2-billing-identity-card-trigger ds2-billing-plan-card-power";
  }

  if (plan === "pro") {
    return "ds2-billing-identity-card ds2-billing-identity-card-trigger ds2-billing-plan-card-pro";
  }

  return "ds2-billing-identity-card ds2-billing-identity-card-trigger ds2-billing-plan-card-free";
}

function PlanIdentityMiniCard({
  plan,
  isCurrent,
  expanded,
  previewId,
  onFocusPlan,
  onActivatePlan,
}: {
  plan: SubscriptionTier;
  isCurrent: boolean;
  expanded: boolean;
  previewId: string;
  onFocusPlan: () => void;
  onActivatePlan: () => void;
}) {
  return (
    <button
      type="button"
      className={identityCardClass(plan)}
      aria-current={isCurrent ? "true" : undefined}
      aria-expanded={expanded}
      aria-controls={previewId}
      onFocus={onFocusPlan}
      onClick={onActivatePlan}
    >
      {isCurrent ? (
        <span className="ds2-billing-identity-badge">Current Plan</span>
      ) : (
        <span className="ds2-billing-identity-brand">IMMIFIN</span>
      )}
      <p className="ds2-billing-identity-name">{formatPlanLabel(plan)}</p>
      <PlanCardEmblem tier={plan} />
    </button>
  );
}

export function PlanIdentityCards({ currentTier }: { currentTier: SubscriptionTier }) {
  const [activePlan, setActivePlan] = useState<SubscriptionTier | null>(null);
  const [usesFloatingPreview, setUsesFloatingPreview] = useState(
    () => typeof window !== "undefined" && window.matchMedia(FLOATING_QUERY).matches,
  );
  const [previewShiftPx, setPreviewShiftPx] = useState(0);
  const [previewBelow, setPreviewBelow] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const floatRef = useRef<HTMLDivElement | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openPlan = useCallback(
    (plan: SubscriptionTier) => {
      clearCloseTimer();
      setActivePlan(plan);
    },
    [clearCloseTimer],
  );

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setActivePlan(null);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const closeNow = useCallback(() => {
    clearCloseTimer();
    setActivePlan(null);
  }, [clearCloseTimer]);

  useEffect(() => {
    const media = window.matchMedia(FLOATING_QUERY);
    const sync = () => {
      setUsesFloatingPreview(media.matches);
    };

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!activePlan) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNow();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activePlan, closeNow]);

  useLayoutEffect(() => {
    if (!usesFloatingPreview || !activePlan || !floatRef.current) {
      setPreviewShiftPx(0);
      setPreviewBelow(false);
      return;
    }

    const node = floatRef.current;
    node.classList.remove("ds2-billing-plan-preview-anchor-below");
    const clipParent = node.closest(".ds2-billing-workspace-main");
    const bounds = clipParent?.getBoundingClientRect();
    const padding = 12;
    const minLeft = (bounds?.left ?? 0) + padding;
    const maxRight = (bounds?.right ?? window.innerWidth) - padding;

    let rect = node.getBoundingClientRect();
    let shift = 0;

    if (rect.left < minLeft) {
      shift = minLeft - rect.left;
    } else if (rect.right > maxRight) {
      shift = maxRight - rect.right;
    }

    const placeBelow = rect.top < padding;
    if (placeBelow) {
      node.classList.add("ds2-billing-plan-preview-anchor-below");
    }

    setPreviewBelow(placeBelow);
    setPreviewShiftPx(shift);
  }, [activePlan, usesFloatingPreview]);

  const handleItemBlur = (plan: SubscriptionTier, event: FocusEvent<HTMLLIElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }

    if (usesFloatingPreview && activePlan === plan) {
      scheduleClose();
    }
  };

  return (
    <section className="ds2-billing-identity" aria-labelledby="plan-identity-heading">
      <h2 id="plan-identity-heading" className="ds2-billing-section-title">
        Your IMMIFIN plan, your experience
      </h2>
      <p className="ds2-billing-section-copy">Each plan comes with its own digital membership identity.</p>
      <ul className="ds2-billing-identity-grid">
        {PLAN_ORDER.map((plan) => {
          const isCurrent = currentTier === plan;
          const expanded = activePlan === plan;
          const previewId = previewIdFor(plan);

          return (
            <li
              key={plan}
              className="ds2-billing-identity-item"
              onMouseEnter={() => {
                if (usesFloatingPreview) {
                  openPlan(plan);
                }
              }}
              onMouseLeave={() => {
                if (usesFloatingPreview) {
                  scheduleClose();
                }
              }}
              onBlur={(event) => handleItemBlur(plan, event)}
            >
              <PlanIdentityMiniCard
                plan={plan}
                isCurrent={isCurrent}
                expanded={expanded}
                previewId={previewId}
                onFocusPlan={() => openPlan(plan)}
                onActivatePlan={() => {
                  if (usesFloatingPreview) {
                    openPlan(plan);
                    return;
                  }

                  setActivePlan((current) => (current === plan ? null : plan));
                }}
              />
              {usesFloatingPreview && expanded ? (
                <div
                  ref={floatRef}
                  className={
                    previewBelow
                      ? "ds2-billing-plan-preview-anchor ds2-billing-plan-preview-anchor-below"
                      : "ds2-billing-plan-preview-anchor"
                  }
                  style={{ ["--preview-shift" as string]: `${previewShiftPx}px` }}
                >
                  <PlanIdentityPreview
                    plan={plan}
                    isCurrent={isCurrent}
                    variant="floating"
                    previewId={previewId}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {!usesFloatingPreview && activePlan ? (
        <PlanIdentityPreview
          plan={activePlan}
          isCurrent={currentTier === activePlan}
          variant="inline"
          previewId={previewIdFor(activePlan)}
        />
      ) : null}
    </section>
  );
}
