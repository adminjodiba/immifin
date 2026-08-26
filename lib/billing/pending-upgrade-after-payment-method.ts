/**
 * Client-only handoff while the customer is on Stripe-hosted payment method UI.
 * S7-BILLING-UX-005 — stores only plan intent fields; never Stripe IDs or signed preview tokens.
 */

export const PENDING_UPGRADE_AFTER_PM_STORAGE_KEY = "immifin.pendingUpgradeAfterPaymentMethod";

export type PendingUpgradeAfterPaymentMethod = {
  targetTier: "pro" | "power";
  targetInterval: "monthly" | "annual";
  actionId: string;
};

export function storePendingUpgradeAfterPaymentMethod(
  value: PendingUpgradeAfterPaymentMethod,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(PENDING_UPGRADE_AFTER_PM_STORAGE_KEY, JSON.stringify(value));
}

export function consumePendingUpgradeAfterPaymentMethod(): PendingUpgradeAfterPaymentMethod | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(PENDING_UPGRADE_AFTER_PM_STORAGE_KEY);
  window.sessionStorage.removeItem(PENDING_UPGRADE_AFTER_PM_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PendingUpgradeAfterPaymentMethod;
    if (
      (parsed.targetTier !== "pro" && parsed.targetTier !== "power") ||
      (parsed.targetInterval !== "monthly" && parsed.targetInterval !== "annual") ||
      typeof parsed.actionId !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
