"use client";

import { useEffect, useState } from "react";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

type DevSubscriptionActivationDialogProps = {
  plan: SubscriptionTier;
  open: boolean;
  isSubmitting: boolean;
  onActivate: () => void;
  onCancel: () => void;
};

const PLAN_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  pro: "Pro",
  power: "Power",
};

export function DevSubscriptionActivationDialog({
  plan,
  open,
  isSubmitting,
  onActivate,
  onCancel,
}: DevSubscriptionActivationDialogProps) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dev-subscription-title"
    >
      <div className="card-static w-full max-w-md shadow-xl">
        <h2 id="dev-subscription-title" className="heading-3 text-slate-900">
          Activate Development Subscription
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          This will activate the <span className="font-semibold">{PLAN_LABELS[plan]}</span> plan
          for testing. No payment will be collected.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={onActivate}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Activating…" : "Activate"}
          </button>
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
