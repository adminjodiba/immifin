"use client";

import { useState } from "react";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { PremiumNavPreviewDialog } from "@/components/common/PremiumNavPreviewDialog";
import { BILLING_CENTER_PATH } from "@/lib/billing/billing-center";
import { canAccessPersonalDashboard } from "@/lib/subscription/capabilities";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import type { PremiumNavPreviewKey } from "@/lib/premium-nav-preview";

export type MyImmifinWorkspaceActive =
  | "dashboard"
  | "profile"
  | "billing"
  | "settings"
  | "help";

type WorkspaceNavItem = {
  id: MyImmifinWorkspaceActive;
  href: string;
  label: string;
  icon: "dashboard" | "profile" | "billing" | "settings" | "help";
  premiumPreview?: PremiumNavPreviewKey;
};

const NAV_ITEMS: WorkspaceNavItem[] = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: "dashboard", premiumPreview: "dashboard" },
  { id: "profile", href: "/user-profile", label: "My Profile", icon: "profile" },
  { id: "billing", href: BILLING_CENTER_PATH, label: "Plan & Billing", icon: "billing" },
  { id: "settings", href: "/account", label: "Account Settings", icon: "settings" },
  { id: "help", href: "/contact", label: "Help & Support", icon: "help" },
];

function NavIcon({ name }: { name: WorkspaceNavItem["icon"] }) {
  const common = "h-[18px] w-[18px] shrink-0";
  if (name === "dashboard") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.2" />
        <rect x="13" y="4" width="7" height="7" rx="1.2" />
        <rect x="4" y="13" width="7" height="7" rx="1.2" />
        <rect x="13" y="13" width="7" height="7" rx="1.2" />
      </svg>
    );
  }
  if (name === "profile") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 19c.6-3.1 3.1-5 6.5-5s5.9 1.9 6.5 5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "billing") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <rect x="3.5" y="6" width="17" height="12" rx="2" />
        <path d="M3.5 10h17" />
        <path d="M7 15h4" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.4 6.4l1.4 1.4M16.2 16.2l1.4 1.4M17.6 6.4l-1.4 1.4M7.8 16.2l-1.4 1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

function NavLink({
  item,
  active,
  onOpenPreview,
}: {
  item: WorkspaceNavItem;
  active: boolean;
  onOpenPreview: (key: PremiumNavPreviewKey) => void;
}) {
  const className = active
    ? "ds2-myimmifin-nav-link ds2-myimmifin-nav-link-active"
    : "ds2-myimmifin-nav-link";

  if (item.premiumPreview) {
    return (
      <button type="button" className={className} onClick={() => onOpenPreview(item.premiumPreview!)}>
        <NavIcon name={item.icon} />
        <span>{item.label}</span>
      </button>
    );
  }

  return (
    <ProtectedLink href={item.href} className={className} aria-current={active ? "page" : undefined}>
      <NavIcon name={item.icon} />
      <span>{item.label}</span>
    </ProtectedLink>
  );
}

export function Ds2MyImmifinWorkspaceNav({
  active,
}: {
  active: MyImmifinWorkspaceActive;
}) {
  const { tier } = useEffectiveSubscriptionTier();
  const [previewKey, setPreviewKey] = useState<PremiumNavPreviewKey | null>(null);

  const items = NAV_ITEMS.map((item) => {
    if (item.id !== "dashboard") {
      return item;
    }
    return canAccessPersonalDashboard(tier)
      ? { ...item, premiumPreview: undefined }
      : item;
  });

  return (
    <>
      <nav className="ds2-myimmifin-nav" aria-label="My Immifin">
        <div className="ds2-myimmifin-nav-brand">
          <p className="ds2-myimmifin-nav-title">My Immifin</p>
          <p className="ds2-myimmifin-nav-subtitle">Your profile, tools and settings</p>
        </div>
        <ul className="ds2-myimmifin-nav-list">
          {items.map((item) => (
            <li key={item.id}>
              <NavLink item={item} active={item.id === active} onOpenPreview={setPreviewKey} />
            </li>
          ))}
        </ul>
        <div className="ds2-myimmifin-nav-help">
          <span className="ds2-myimmifin-nav-help-icon" aria-hidden="true">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M5 14.5V11a7 7 0 0 1 14 0v3.5" strokeLinecap="round" />
              <path d="M4.5 14.5h3.2V19H6.2A1.7 1.7 0 0 1 4.5 17.3v-2.8Z" />
              <path d="M16.3 14.5H19.5V17.3A1.7 1.7 0 0 1 17.8 19h-1.5v-4.5Z" />
            </svg>
          </span>
          <p className="ds2-myimmifin-nav-help-title">Need help?</p>
          <p className="ds2-myimmifin-nav-help-copy">
            Visit our Help Center or contact our support team.
          </p>
          <ProtectedLink href="/contact#contact-form-heading" className="ds2-myimmifin-nav-help-cta">
            Contact Support <span aria-hidden="true">→</span>
          </ProtectedLink>
        </div>
      </nav>
      <PremiumNavPreviewDialog previewKey={previewKey} onClose={() => setPreviewKey(null)} />
    </>
  );
}
