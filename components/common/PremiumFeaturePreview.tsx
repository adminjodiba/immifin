"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buildSignInUrl } from "@/lib/auth/signInRedirect";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import type { SubscriptionTier } from "@/lib/subscription/tiers";

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  power: 2,
};

function meetsRequiredTier(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier,
): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}

export type PremiumFeatureInfoLink = {
  label: string;
  href: string;
};

export type PremiumFeatureInfoState = {
  title: string;
  message: string;
  proBenefits: readonly string[];
  freeToolsSectionTitle?: string;
  freeToolsLinks: readonly PremiumFeatureInfoLink[];
};

export type PremiumFeaturePreviewProps = {
  title?: string;
  description?: string;
  featureGroupTitle: string;
  featureList: string[];
  upgradeButtonText?: string;
  comparePlansButtonText?: string;
  requiredTier?: SubscriptionTier;
  icon?: ReactNode;
  /** Prevent scrolling the blurred page underneath. Defaults to true. */
  lockScroll?: boolean;
  /** Show a close button on the overlay. Requires infoState for dismissed UX. */
  showCloseButton?: boolean;
  /** Educational panel shown after the user dismisses the overlay. */
  infoState?: PremiumFeatureInfoState;
  /** Optional callback when the overlay is dismissed. */
  onClose?: () => void;
  children: ReactNode;
};

type PremiumFeatureInfoPanelProps = {
  infoState: PremiumFeatureInfoState;
  upgradeButtonText: string;
};

function PremiumFeatureInfoPanel({
  infoState,
  upgradeButtonText,
}: PremiumFeatureInfoPanelProps) {
  return (
    <section className="workspace-section">
      <div className="container-main">
        <div className="space-y-6">
          <header>
            <p className="text-sm font-medium text-brand-600">Pro Feature</p>
            <h2 className="heading-2 mt-2 text-slate-900">{infoState.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {infoState.message}
            </p>
          </header>

          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4 sm:p-5">
            <p className="text-sm font-semibold text-slate-900">With Pro you can:</p>
            <ul className="mt-3 space-y-2.5">
              {infoState.proBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/pricing" className="btn-primary inline-flex">
            {upgradeButtonText}
          </Link>

          <div className="border-t border-slate-200 pt-6">
            <p className="text-sm font-semibold text-slate-900">
              {infoState.freeToolsSectionTitle ?? "Continue with free tools"}
            </p>
            <ul className="mt-3 space-y-2">
              {infoState.freeToolsLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-arrow">
                    {link.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Renders the real premium page underneath with a blurred overlay for users
 * below the required tier. Pro/Power users see the page normally.
 *
 * When showCloseButton is enabled, Free users can dismiss the overlay to see
 * an educational info panel instead — without accessing the Pro feature.
 */
export function PremiumFeaturePreview({
  title = "Unlock Your Immigration Insights",
  description = "Discover premium immigration tools that automatically analyze your data, track your progress, and provide personalized insights.",
  featureGroupTitle,
  featureList,
  upgradeButtonText = "Upgrade to Pro",
  comparePlansButtonText = "Compare Plans",
  requiredTier = "pro",
  icon,
  lockScroll = true,
  showCloseButton = false,
  infoState,
  onClose,
  children,
}: PremiumFeaturePreviewProps) {
  const pathname = usePathname();
  const { tier } = useEffectiveSubscriptionTier();
  const hasAccess = meetsRequiredTier(tier, requiredTier);
  const [dismissed, setDismissed] = useState(false);

  const overlayVisible = !dismissed;
  const shouldLockScroll = !hasAccess && overlayVisible && lockScroll;

  useEffect(() => {
    if (!shouldLockScroll) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldLockScroll]);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (dismissed && infoState) {
    return (
      <PremiumFeatureInfoPanel infoState={infoState} upgradeButtonText={upgradeButtonText} />
    );
  }

  const signInHref = buildSignInUrl(pathname);

  function handleClose() {
    setDismissed(true);
    onClose?.();
  }

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none blur-[3px] brightness-[0.88] saturate-[0.65]"
        inert
      >
        {children}
      </div>

      <div
        className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-900/10 p-4 backdrop-blur-[1px] sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-preview-title"
      >
        <div className="card-static relative mx-auto w-full max-w-lg shadow-xl shadow-slate-900/10 ring-brand-200/60">
          {showCloseButton && infoState ? (
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              aria-label="Close premium preview"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ×
              </span>
            </button>
          ) : null}

          <header className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">
              {icon ?? <span aria-hidden="true">🔒</span>}
            </div>
            <h2 id="premium-preview-title" className="heading-3 mt-4 text-slate-900">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {description}
            </p>
          </header>

          <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50/50 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {featureGroupTitle}
            </p>
            <ul className="mt-3 space-y-2.5">
              {featureList.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm text-slate-700"
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/pricing" className="btn-primary flex-1">
              {upgradeButtonText}
            </Link>
            <Link href="/pricing#plans" className="btn-secondary flex-1">
              {comparePlansButtonText}
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Already have a Pro account?{" "}
            <Link href={signInHref} className="font-semibold text-brand-700 hover:text-brand-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
