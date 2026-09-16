"use client";

import { useState } from "react";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { ProBadge } from "@/components/common/ProBadge";
import { PremiumNavPreviewDialog } from "@/components/common/PremiumNavPreviewDialog";
import { BILLING_CENTER_PATH } from "@/lib/billing/billing-center";
import { canAccessPersonalDashboard } from "@/lib/subscription/capabilities";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { useIsAdminRole } from "@/lib/hooks/useIsAdminRole";
import {
  ADMIN_DASHBOARD_NAV_LABEL,
  ADMIN_DASHBOARD_OVERVIEW_PATH,
  ADMIN_DASHBOARD_SECTIONS,
  type AdminDashboardSectionId,
} from "@/lib/admin/admin-dashboard-nav";
import type { PremiumNavPreviewKey } from "@/lib/premium-nav-preview";

export type MyImmifinWorkspaceActive =
  | "dashboard"
  | "profile"
  | "personalization"
  | "billing"
  | "settings"
  | "admin"
  | "help";

type WorkspaceNavIcon =
  | "dashboard"
  | "profile"
  | "personalization"
  | "billing"
  | "settings"
  | "admin"
  | "help";

type WorkspaceNavItem = {
  id: MyImmifinWorkspaceActive;
  href: string;
  label: string;
  icon: WorkspaceNavIcon;
  premiumPreview?: PremiumNavPreviewKey;
  premiumBadge?: boolean;
};

const NAV_ITEMS: WorkspaceNavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Immigration Dashboard",
    icon: "dashboard",
    premiumPreview: "dashboard",
  },
  { id: "profile", href: "/user-profile", label: "My Profile", icon: "profile" },
  {
    id: "personalization",
    href: "/user-profile/personalization",
    label: "Personalization",
    icon: "personalization",
    premiumBadge: true,
  },
  { id: "billing", href: BILLING_CENTER_PATH, label: "Plan & Billing", icon: "billing" },
  { id: "settings", href: "/account", label: "Account Settings", icon: "settings" },
  { id: "admin", href: ADMIN_DASHBOARD_OVERVIEW_PATH, label: ADMIN_DASHBOARD_NAV_LABEL, icon: "admin" },
  { id: "help", href: "/contact", label: "Help & Support", icon: "help" },
];

function NavIcon({ name }: { name: WorkspaceNavIcon }) {
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
  if (name === "personalization") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="8" cy="8" r="2" />
        <path d="M4 8h2M10 8h10" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2" />
        <path d="M4 16h10M18 16h2" strokeLinecap="round" />
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
  if (name === "admin") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M14.7 6.3a3.2 3.2 0 1 0-4.5 4.5L5 16l3 3 5.2-5.2a3.2 3.2 0 0 0 4.5-4.5l-2.2 2.2-1.8-1.8 2-2.1Z" strokeLinejoin="round" />
        <path d="M16.8 4.8 19 7" strokeLinecap="round" />
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
  const content = (
    <>
      <NavIcon name={item.icon} />
      <span className="ds2-myimmifin-nav-link-text">{item.label}</span>
      {item.premiumBadge ? <ProBadge className="ds2-myimmifin-nav-badge" /> : null}
    </>
  );

  if (item.premiumPreview) {
    return (
      <button type="button" className={className} onClick={() => onOpenPreview(item.premiumPreview!)}>
        {content}
      </button>
    );
  }

  return (
    <ProtectedLink href={item.href} className={className} aria-current={active ? "page" : undefined}>
      {content}
    </ProtectedLink>
  );
}

export function Ds2MyImmifinWorkspaceNav({
  active,
  adminSection,
}: {
  active: MyImmifinWorkspaceActive;
  adminSection?: AdminDashboardSectionId;
}) {
  const { tier } = useEffectiveSubscriptionTier();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdminRole();
  const [previewKey, setPreviewKey] = useState<PremiumNavPreviewKey | null>(null);
  const [adminExpanded, setAdminExpanded] = useState(true);
  const showAdminDashboard = !isAdminLoading && isAdmin;

  const items = NAV_ITEMS.filter((item) => item.id !== "admin" || showAdminDashboard).map((item) => {
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
          {items.map((item) => {
            if (item.id === "admin") {
              return (
                <li key={item.id} className="ds2-myimmifin-nav-group">
                  <div className="ds2-myimmifin-nav-admin-row">
                    <ProtectedLink
                      href={item.href}
                      className={
                        active === "admin" && !adminSection
                          ? "ds2-myimmifin-nav-link ds2-myimmifin-nav-link-active"
                          : "ds2-myimmifin-nav-link"
                      }
                    >
                      <NavIcon name={item.icon} />
                      <span className="ds2-myimmifin-nav-link-text">{item.label}</span>
                    </ProtectedLink>
                    <button
                      type="button"
                      className="ds2-myimmifin-nav-group-toggle"
                      aria-expanded={adminExpanded}
                      aria-controls="admin-dashboard-submenu"
                      onClick={() => setAdminExpanded((open) => !open)}
                    >
                      <span className="sr-only">
                        {adminExpanded ? "Collapse Admin Dashboard" : "Expand Admin Dashboard"}
                      </span>
                      <svg
                        className={`ds2-myimmifin-nav-group-chevron ${adminExpanded ? "ds2-myimmifin-nav-group-chevron-open" : ""}`}
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
                  {adminExpanded ? (
                    <ul id="admin-dashboard-submenu" className="ds2-myimmifin-nav-sublist">
                      {ADMIN_DASHBOARD_SECTIONS.map((section) => (
                        <li key={section.id}>
                          <ProtectedLink
                            href={section.href}
                            className={
                              adminSection === section.id
                                ? "ds2-myimmifin-nav-sublink ds2-myimmifin-nav-sublink-active"
                                : "ds2-myimmifin-nav-sublink"
                            }
                            aria-current={adminSection === section.id ? "page" : undefined}
                          >
                            {section.label}
                          </ProtectedLink>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            }

            return (
              <li key={item.id}>
                <NavLink item={item} active={item.id === active} onOpenPreview={setPreviewKey} />
              </li>
            );
          })}
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
