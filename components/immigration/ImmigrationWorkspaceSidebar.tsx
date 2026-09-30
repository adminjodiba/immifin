"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { ProBadge } from "@/components/common/ProBadge";
import { PremiumNavPreviewDialog } from "@/components/common/PremiumNavPreviewDialog";
import {
  landingV3ImmigrationSections,
  type LandingV3ImmigrationIcon,
} from "@/lib/landing-v3-nav";
import { getPremiumNavPreviewContent, type PremiumNavPreviewKey } from "@/lib/premium-nav-preview";
import { hasCapability } from "@/lib/subscription/capabilities";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import type { ImmigrationWorkspaceDestinations } from "@/components/immigration/ImmigrationWorkspaceDestinations";

function GroupIcon({ name }: { name: LandingV3ImmigrationIcon }) {
  const common = "h-[18px] w-[18px] shrink-0";
  if (name === "bulletin") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 19V11M10 19V7M15 19v-5M20 19V9" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "tools") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
        <path d="M7 8h10" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M4.2 12h15.6M12 3.8c2.4 2.4 3.6 5.1 3.6 8.2s-1.2 5.8-3.6 8.2M12 3.8C9.6 6.2 8.4 8.9 8.4 12s1.2 5.8 3.6 8.2" />
    </svg>
  );
}

const PRODUCTION_CURRENT_VISA_BULLETIN_HREF = "/immigration/visa-bulletin";
const PRODUCTION_VISA_BULLETIN_HISTORY_HREF = "/immigration/visa-bulletin-history";
const PRODUCTION_MOVEMENT_TRACKER_HREF = "/immigration/visa-bulletin-movement";
const PRODUCTION_GREEN_CARD_WAIT_HREF = "/calculators/green-card-wait-time";
const PRODUCTION_CITIZENSHIP_HREF = "/calculators/citizenship-eligibility";
const PRODUCTION_H1B_WAGE_HREF = "/immigration/h1b-wage-level-estimator";
const PRODUCTION_H1B_LOTTERY_HREF = "/immigration/h1b-lottery-odds-calculator";
const PRODUCTION_VISA_STAMPING_HREF = "/immigration/visa-stamping-wait-map";
const PRODUCTION_AI_ADVISOR_HREF = "/intelligence";

function workspaceHref(href: string, destinations: ImmigrationWorkspaceDestinations): string {
  if (href === PRODUCTION_CURRENT_VISA_BULLETIN_HREF) return destinations.currentVisaBulletin;
  if (href === PRODUCTION_VISA_BULLETIN_HISTORY_HREF) return destinations.visaBulletinHistory;
  if (href === PRODUCTION_MOVEMENT_TRACKER_HREF) return destinations.movementTracker;
  if (href === PRODUCTION_GREEN_CARD_WAIT_HREF) return destinations.greenCardWait;
  if (href === PRODUCTION_CITIZENSHIP_HREF) return destinations.citizenship;
  if (href === PRODUCTION_H1B_WAGE_HREF) return destinations.h1bWage;
  if (href === PRODUCTION_H1B_LOTTERY_HREF) return destinations.h1bLottery;
  if (href === PRODUCTION_VISA_STAMPING_HREF) return destinations.visaStamping;
  if (href === PRODUCTION_AI_ADVISOR_HREF) return destinations.aiAdvisor;
  return href;
}

export function ImmigrationWorkspaceSidebar({ destinations }: { destinations: ImmigrationWorkspaceDestinations }) {
  const pathname = usePathname();
  const { isSignedIn } = useUser();
  const { tier } = useEffectiveSubscriptionTier();
  const isHome = pathname === destinations.home;
  const isCurrentVisaBulletin = pathname === destinations.currentVisaBulletin;
  const isVisaBulletinHistory = pathname === destinations.visaBulletinHistory;
  const isMovementTracker = pathname === destinations.movementTracker;
  const isGreenCardWait = pathname === destinations.greenCardWait;
  const isCitizenship = pathname === destinations.citizenship;
  const isH1bWage = pathname === destinations.h1bWage;
  const isH1bLottery = pathname === destinations.h1bLottery;
  const isVisaStamping = pathname === destinations.visaStamping;
  const isAiAdvisor = pathname === destinations.aiAdvisor;
  const [previewKey, setPreviewKey] = useState<PremiumNavPreviewKey | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "visa-bulletin": true,
    tools: true,
    "visa-services": true,
  });

  return (
    <>
      <nav className="ds2-myimmifin-nav ds2-imm-sidebar" aria-label="Immigration">
        <div className="ds2-myimmifin-nav-brand">
          <p className="ds2-myimmifin-nav-title">Immigration</p>
          <p className="ds2-myimmifin-nav-subtitle">Visa Bulletin, tools and visa services</p>
        </div>
        <ul className="ds2-myimmifin-nav-list">
          <li>
            <Link
              href={destinations.home}
              className="ds2-myimmifin-nav-link ds2-imm-v4-home-link"
              aria-current={isHome ? "page" : undefined}
            >
              <svg
                className="h-[18px] w-[18px] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 11.2 12 5l7.5 6.2V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.2h-3.6V20.5H6A1.5 1.5 0 0 1 4.5 19z"
                />
              </svg>
              <span className="ds2-myimmifin-nav-link-text">Home</span>
            </Link>
          </li>
          {landingV3ImmigrationSections.map((section) => {
            const isOpen = expanded[section.id] ?? true;
            const submenuId = `immigration-v4-${section.id}`;
            return (
              <li key={section.id} className="ds2-myimmifin-nav-group">
                <div className="ds2-myimmifin-nav-admin-row">
                  <button
                    type="button"
                    className="ds2-myimmifin-nav-link"
                    aria-expanded={isOpen}
                    aria-controls={submenuId}
                    onClick={() =>
                      setExpanded((current) => ({ ...current, [section.id]: !isOpen }))
                    }
                  >
                    <GroupIcon name={section.icon} />
                    <span className="ds2-myimmifin-nav-link-text">{section.label}</span>
                    <svg
                      className={`ds2-myimmifin-nav-group-chevron ${isOpen ? "ds2-myimmifin-nav-group-chevron-open" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
                {isOpen ? (
                  <ul id={submenuId} className="ds2-myimmifin-nav-sublist">
                    {section.items.map((item) => {
                      const href = workspaceHref(item.href, destinations);
                      const isWorkspaceItem =
                        href === destinations.currentVisaBulletin ||
                        href === destinations.visaBulletinHistory ||
                        href === destinations.movementTracker ||
                        href === destinations.greenCardWait ||
                        href === destinations.citizenship ||
                        href === destinations.h1bWage ||
                        href === destinations.h1bLottery ||
                        href === destinations.visaStamping ||
                        href === destinations.aiAdvisor;
                      const isActive =
                        (href === destinations.currentVisaBulletin && isCurrentVisaBulletin) ||
                        (href === destinations.visaBulletinHistory && isVisaBulletinHistory) ||
                        (href === destinations.movementTracker && isMovementTracker) ||
                        (href === destinations.greenCardWait && isGreenCardWait) ||
                        (href === destinations.citizenship && isCitizenship) ||
                        (href === destinations.h1bWage && isH1bWage) ||
                        (href === destinations.h1bLottery && isH1bLottery) ||
                        (href === destinations.visaStamping && isVisaStamping) ||
                        (href === destinations.aiAdvisor && isAiAdvisor);
                      const preview =
                        item.premiumPreview &&
                        !hasCapability(tier, getPremiumNavPreviewContent(item.premiumPreview).capability)
                          ? item.premiumPreview
                          : null;
                      const className = isActive
                        ? "ds2-myimmifin-nav-sublink ds2-imm-v4-sublink-active"
                        : "ds2-myimmifin-nav-sublink";
                      const label = (
                        <>
                          {item.label}
                          {item.premiumPreview ? (
                            <ProBadge label={item.tierLabel ?? "Pro"} className="ds2-myimmifin-nav-badge" />
                          ) : null}
                        </>
                      );

                      return (
                        <li key={item.href}>
                          {preview && isSignedIn && !isWorkspaceItem ? (
                            <button
                              type="button"
                              className={className}
                              onClick={() => setPreviewKey(preview)}
                            >
                              {label}
                            </button>
                          ) : isWorkspaceItem ? (
                            <Link href={href} className={className} aria-current={isActive ? "page" : undefined}>
                              {label}
                            </Link>
                          ) : (
                            <ProtectedLink href={href} className={className}>
                              {label}
                            </ProtectedLink>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </nav>
      <PremiumNavPreviewDialog previewKey={previewKey} onClose={() => setPreviewKey(null)} />
    </>
  );
}
