"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { ProBadge } from "@/components/common/ProBadge";
import { LandingV3AiBuddyLed } from "@/components/landing-v3/LandingV3AiBuddyLed";
import {
  landingV3ImmigrationSections,
  type LandingV3ImmigrationIcon,
} from "@/lib/landing-v3-nav";
import { getPremiumNavPreviewContent, type PremiumNavPreviewKey } from "@/lib/premium-nav-preview";
import { hasCapability } from "@/lib/subscription/capabilities";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";

const PROMO_IMAGE = "/images/immifin-immigration-capitol-promo.png";
const PROMO_WIDTH = 1536;
const PROMO_HEIGHT = 1024;

const navLinkClassName =
  "nav-menu-trigger whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

const leafClassName =
  "nav-menu-item relative z-[1] flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

function ColumnIcon({ name }: { name: LandingV3ImmigrationIcon }) {
  const common = "h-[18px] w-[18px]";
  if (name === "bulletin") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 19V11M10 19V7M15 19v-5M20 19V9" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "tools") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
        <path d="M7 8h10" strokeLinecap="round" />
        <circle cx="8.2" cy="12.2" r="0.7" fill="currentColor" />
        <circle cx="12" cy="12.2" r="0.7" fill="currentColor" />
        <circle cx="15.8" cy="12.2" r="0.7" fill="currentColor" />
        <circle cx="8.2" cy="16" r="0.7" fill="currentColor" />
        <circle cx="12" cy="16" r="0.7" fill="currentColor" />
        <circle cx="15.8" cy="16" r="0.7" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M4.2 12h15.6M12 3.8c2.4 2.4 3.6 5.1 3.6 8.2s-1.2 5.8-3.6 8.2M12 3.8C9.6 6.2 8.4 8.9 8.4 12s1.2 5.8 3.6 8.2" />
    </svg>
  );
}

function LeafIcon({ href }: { href: string }) {
  const common = "h-4 w-4 shrink-0";
  if (href.includes("green-card-wait")) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="7.5" />
        <path d="M12 8v4.2l2.4 1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (href.includes("citizenship")) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="6" y="3.5" width="12" height="17" rx="1.6" />
        <path d="M9 8h6M9 12h6M9 16h3.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (href.includes("wage-level") || href.includes("h1b-salary")) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="7.2" />
        <path d="M12 7.4v9.2M9.4 9.2c.6-.8 1.5-1.2 2.6-1.2 1.5 0 2.6.8 2.6 2 0 2.6-5.2 1.4-5.2 4 0 1.2 1.1 2.1 2.7 2.1 1.1 0 2-.4 2.6-1.1" strokeLinecap="round" />
      </svg>
    );
  }
  if (href.includes("lottery")) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 19V11M10 19V7M15 19v-5M20 19V9" strokeLinecap="round" />
      </svg>
    );
  }
  if (href.includes("stamping")) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="5" y="4" width="14" height="16" rx="2" />
        <circle cx="12" cy="10" r="2.1" />
        <path d="M8.2 16.2c.6-1.4 1.9-2.2 3.8-2.2s3.2.8 3.8 2.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CapabilityHeader({
  icon,
  label,
  description,
}: {
  icon: LandingV3ImmigrationIcon;
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

function VisaBulletinKpiPreview() {
  return (
    <aside
      className="mb-3 rounded-lg bg-[var(--immifin-ds2-blue-soft)] px-3 py-2.5"
      aria-label="Visual preview of Visa Bulletin priority-date movement. Illustrative only, not live figures."
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-[var(--immifin-ds2-text-primary)]">Priority-date movement</p>
        <p className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          Preview
        </p>
      </div>
      <div className="mt-2 flex h-10 items-end gap-1" aria-hidden="true">
        {[30, 38, 44, 56, 68, 82].map((height, index) => (
          <span
            key={index}
            className="flex-1 rounded-sm bg-[var(--immifin-ds2-blue)]"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-slate-500">
        Illustrative movement trend
      </p>
    </aside>
  );
}

function PromoFooterIcon({ name }: { name: "info" | "insights" | "tomorrow" }) {
  const common = "h-3.5 w-3.5 shrink-0";
  if (name === "info") {
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
        <circle cx="9" cy="8" r="2.2" />
        <circle cx="15.4" cy="8.4" r="1.9" />
        <path d="M4.8 17.8c.4-2.3 2.2-3.6 4.2-3.6s3.8 1.3 4.2 3.6M13.2 17.8c.3-1.6 1.4-2.6 2.8-2.6 1.4 0 2.5 1 2.9 2.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 19V9M10 19V5M15 19v-7M20 19v-4" strokeLinecap="round" />
    </svg>
  );
}

export function LandingV3ImmigrationMegaMenu({
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
        const trigger = rootRef.current?.querySelector<HTMLElement>("a[href='/immigration']");
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
          href="/immigration"
          className={`${navLinkClassName} inline-flex items-center gap-1`}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={menuId}
        >
          Immigration
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
        {open ? <span className="landing-v3-immigration-mega-pointer" aria-hidden="true" /> : null}
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
            {landingV3ImmigrationSections.map((section, index) => (
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
                {section.id === "visa-bulletin" ? <VisaBulletinKpiPreview /> : null}
                <div className="flex flex-col gap-0.5">
                  {section.items.map((item) => {
                    const previewKey = item.premiumPreview
                      ? hasCapability(tier, getPremiumNavPreviewContent(item.premiumPreview).capability)
                        ? null
                        : item.premiumPreview
                      : null;

                    const tierLabel = item.tierLabel ?? "Pro";
                    const isAiBuddy = item.href === "/intelligence";
                    const showLeafIcon = section.id !== "visa-bulletin" && !isAiBuddy;
                    const itemClassName = isAiBuddy
                      ? `${leafClassName} landing-v3-ai-buddy`
                      : leafClassName;
                    const badgeClassName = "landing-v3-tier-badge";

                    const leafBody = (
                      <span className="relative z-[1] flex w-full items-start gap-2.5">
                        {showLeafIcon ? (
                          <span className="landing-v3-leaf-icon mt-0.5 text-[var(--immifin-ds2-blue)]" aria-hidden="true">
                            <LeafIcon href={item.href} />
                          </span>
                        ) : null}
                        <span className="flex min-w-0 flex-col items-start">
                          <span className="inline-flex items-center whitespace-nowrap">
                            {isAiBuddy ? (
                              <LandingV3AiBuddyLed>
                                {item.label}
                                {item.premiumPreview ? (
                                  <ProBadge label={tierLabel} className={badgeClassName} />
                                ) : null}
                              </LandingV3AiBuddyLed>
                            ) : (
                              <>
                                {item.label}
                                {item.premiumPreview ? (
                                  <ProBadge label={tierLabel} className={badgeClassName} />
                                ) : null}
                              </>
                            )}
                          </span>
                          {item.description ? (
                            <span className="mt-0.5 text-[12px] font-normal leading-snug text-slate-500">
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    );

                    if (previewKey && isSignedIn) {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          className={itemClassName}
                          onClick={() => onOpenPreview(previewKey)}
                        >
                          {leafBody}
                        </button>
                      );
                    }

                    return (
                      <ProtectedLink key={item.href} href={item.href} className={itemClassName}>
                        {leafBody}
                      </ProtectedLink>
                    );
                  })}
                </div>
              </div>
            ))}

            <aside className="relative ml-5 min-h-[20rem] overflow-hidden rounded-lg">
              <Image
                src={PROMO_IMAGE}
                alt=""
                width={PROMO_WIDTH}
                height={PROMO_HEIGHT}
                className="absolute inset-0 h-full w-full object-cover object-right"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/20 to-transparent" />
              <div className="relative z-[1] flex h-full flex-col justify-between p-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--immifin-ds2-text-primary)]">
                    Immigration
                  </p>
                  <p className="mt-1.5 text-[1.35rem] font-extrabold leading-tight text-[var(--immifin-ds2-text-primary)]">
                    Plan Smarter. Go Further.
                  </p>
                  <p className="mt-1.5 text-[12px] leading-snug text-slate-700">
                    Trusted tools and insights for your immigration journey.
                  </p>
                  <ProtectedLink
                    href="/immigration"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[var(--immifin-ds2-blue)] px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm"
                  >
                    Explore Immigration
                    <span aria-hidden="true">→</span>
                  </ProtectedLink>
                </div>
                <div className="flex items-center justify-between gap-1.5 rounded-md bg-sky-100/85 px-2 py-2 text-[8px] font-medium leading-tight text-slate-700 backdrop-blur-md">
                  <span className="inline-flex items-center gap-1">
                    <PromoFooterIcon name="info" />
                    Accurate Information
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <PromoFooterIcon name="insights" />
                    Data-Driven Insights
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
