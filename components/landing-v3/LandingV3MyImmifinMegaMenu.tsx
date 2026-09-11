"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { ProBadge } from "@/components/common/ProBadge";
import {
  landingV3MyImmifinSections,
  type LandingV3MyImmifinIcon,
  type LandingV3MyImmifinLeafIcon,
} from "@/lib/landing-v3-nav";
import { getPremiumNavPreviewContent, type PremiumNavPreviewKey } from "@/lib/premium-nav-preview";
import { hasCapability } from "@/lib/subscription/capabilities";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";

const navLinkClassName =
  "nav-menu-trigger whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

const leafClassName =
  "nav-menu-item relative z-[1] flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

function ColumnIcon({ name }: { name: LandingV3MyImmifinIcon }) {
  const common = "h-[18px] w-[18px]";
  if (name === "journey") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 19c.6-3.1 3.1-5 6.5-5s5.9 1.9 6.5 5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "billing") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 4l2.1 4.1 4.6.7-3.3 3.2.8 4.5L12 14.8 7.8 16.5l.8-4.5-3.3-3.2 4.6-.7L12 4Z" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 10.5V9a6 6 0 0 1 12 0v1.5" strokeLinecap="round" />
      <path d="M5 10.5h14v7.2c0 .7-.6 1.3-1.3 1.3H6.3c-.7 0-1.3-.6-1.3-1.3v-7.2Z" />
      <path d="M12 14.2v1.4" strokeLinecap="round" />
    </svg>
  );
}

function LeafIcon({ name }: { name: LandingV3MyImmifinLeafIcon }) {
  const common = "h-4 w-4 shrink-0";
  if (name === "dashboard") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.2" />
        <rect x="13" y="4" width="7" height="7" rx="1.2" />
        <rect x="4" y="13" width="7" height="7" rx="1.2" />
        <rect x="13" y="13" width="7" height="7" rx="1.2" />
      </svg>
    );
  }
  if (name === "profile") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="6" y="3.5" width="12" height="17" rx="1.6" />
        <path d="M9 8h6M9 12h6M9 16h3.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "card") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="M3.5 10h17" />
        <path d="M7 15h4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "upgrade") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4.5 17.5l5-6 3.5 3.5 6.5-8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 7h4.5V11.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M4 7.5l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CapabilityHeader({
  icon,
  label,
  description,
}: {
  icon: LandingV3MyImmifinIcon;
  label: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span className="text-[var(--immifin-ds2-blue)]" aria-hidden="true">
          <ColumnIcon name={icon} />
        </span>
        <p className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-[var(--immifin-ds2-text-primary)]">{label}</p>
      </div>
      <span className="mt-1.5 block h-[3px] w-10 rounded-full bg-[var(--immifin-ds2-blue)]" aria-hidden="true" />
      <p className="mt-2 text-[12px] leading-snug text-slate-500">{description}</p>
    </div>
  );
}

function PromoFooterIcon({ name }: { name: "secure" | "insights" | "tomorrow" }) {
  const common = "h-3.5 w-3.5 shrink-0";
  if (name === "secure") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 3.5l7 3v5.4c0 4.5-2.9 7.7-7 8.6-4.1-.9-7-4.1-7-8.6V6.5l7-3Z" strokeLinejoin="round" />
        <path d="M9.2 12.1l1.9 1.9 3.8-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "insights") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 19V11M10 19V7M15 19v-5M20 19v-8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="2.2" />
      <circle cx="15.4" cy="8.4" r="1.9" />
      <path d="M4.8 17.8c.4-2.3 2.2-3.6 4.2-3.6s3.8 1.3 4.2 3.6M13.2 17.8c.3-1.6 1.4-2.6 2.8-2.6 1.4 0 2.5 1 2.9 2.6" strokeLinecap="round" />
    </svg>
  );
}

export function LandingV3MyImmifinMegaMenu({
  onOpenPreview,
  isSignedIn,
}: {
  onOpenPreview: (key: PremiumNavPreviewKey) => void;
  isSignedIn: boolean;
}) {
  const { tier } = useEffectiveSubscriptionTier();
  const menuId = useId();
  const closeTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(0);

  const syncPosition = useCallback(() => {
    const header = document.querySelector("header.landing-v6-nav");
    if (header instanceof HTMLElement) {
      setPanelTop(header.getBoundingClientRect().bottom - 2);
    }
  }, []);

  const openMenu = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    syncPosition();
    setOpen(true);
  }, [syncPosition]);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
    }
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 160);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onViewportChange = () => syncPosition();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        const trigger = rootRef.current?.querySelector<HTMLElement>("a[href='/dashboard']");
        trigger?.focus();
      }
    };

    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, syncPosition]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  function handleBlur(event: React.FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    scheduleClose();
  }

  return (
    <div ref={rootRef} className="relative" onFocus={openMenu} onBlur={handleBlur}>
      <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
        <ProtectedLink
          href="/dashboard"
          className={`${navLinkClassName} inline-flex items-center gap-1`}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={menuId}
        >
          My Immifin
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </ProtectedLink>
        {open ? <span className="landing-v3-mega-pointer" aria-hidden="true" /> : null}
      </div>

      <div
        id={menuId}
        hidden={!open}
        className="landing-v3-immigration-mega-panel fixed left-1/2 z-50 w-[min(76rem,calc(100vw-2.5rem))] -translate-x-1/2 pt-3"
        style={{ top: panelTop }}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <div className="landing-v3-immigration-mega rounded-xl border border-slate-200/80 bg-white px-6 py-6 shadow-[0_18px_50px_-20px_rgba(11,27,58,0.35)] ring-1 ring-slate-200/70">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)_minmax(14.5rem,0.92fr)_18.25rem] items-stretch gap-0">
            {landingV3MyImmifinSections.map((section, index) => (
              <div
                key={section.id}
                className={`min-w-0 px-5 ${index > 0 ? "border-l border-slate-200/80" : "pl-1"}`}
                role="group"
                aria-label={section.label}
              >
                <CapabilityHeader
                  icon={section.icon}
                  label={section.label}
                  description={section.description}
                />
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const previewKey = item.premiumPreview
                      ? hasCapability(tier, getPremiumNavPreviewContent(item.premiumPreview).capability)
                        ? null
                        : item.premiumPreview
                      : null;
                    const tierLabel = item.tierLabel ?? "Pro";

                    const leafBody = (
                      <span className="relative z-[1] flex w-full items-start gap-2.5">
                        <span className="landing-v3-leaf-icon mt-0.5 text-[var(--immifin-ds2-blue)]" aria-hidden="true">
                          <LeafIcon name={item.icon} />
                        </span>
                        <span className="flex min-w-0 flex-col items-start">
                          <span className="inline-flex items-center whitespace-nowrap">
                            {item.label}
                            {item.premiumPreview ? (
                              <ProBadge label={tierLabel} className="landing-v3-tier-badge" />
                            ) : null}
                          </span>
                          <span className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">
                            {item.description}
                          </span>
                        </span>
                      </span>
                    );

                    if (previewKey && isSignedIn) {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className={leafClassName}
                          onClick={() => onOpenPreview(previewKey)}
                        >
                          {leafBody}
                        </button>
                      );
                    }

                    return (
                      <ProtectedLink key={item.href} href={item.href} className={leafClassName}>
                        {leafBody}
                      </ProtectedLink>
                    );
                  })}
                </div>
              </div>
            ))}

            <aside className="relative ml-5 min-h-[20rem] overflow-hidden rounded-lg bg-gradient-to-br from-sky-100 via-sky-50 to-blue-50">
              <div className="relative z-[1] flex h-full flex-col justify-between p-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--immifin-ds2-text-primary)]">
                    My Immifin
                  </p>
                  <p className="mt-1.5 text-[1.35rem] font-extrabold leading-tight text-[var(--immifin-ds2-text-primary)]">
                    Your Journey.
                    <br />
                    All in One Place.
                  </p>
                  <p className="mt-1.5 text-[12px] leading-snug text-slate-700">
                    Track your immigration journey, manage your plan, and stay informed with IMMIFIN.
                  </p>
                  <ProtectedLink
                    href="/dashboard"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[var(--immifin-ds2-blue)] px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm"
                  >
                    Go to My Immifin
                    <span aria-hidden="true">→</span>
                  </ProtectedLink>
                </div>
                <div className="flex items-center justify-between gap-1.5 rounded-md bg-sky-100/85 px-2 py-2 text-[8px] font-medium leading-tight text-slate-700 backdrop-blur-md">
                  <span className="inline-flex items-center gap-1">
                    <PromoFooterIcon name="secure" />
                    Your Data Stays Secure
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <PromoFooterIcon name="insights" />
                    Personalized Insights
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <PromoFooterIcon name="tomorrow" />
                    A Brighter Tomorrow
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
