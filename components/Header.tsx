"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { useLoginRequired } from "@/components/auth/LoginRequiredProvider";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { PremiumNavPreviewDialog } from "@/components/common/PremiumNavPreviewDialog";
import { ProBadge } from "@/components/common/ProBadge";
import {
  FavoritesMobileSection,
  FavoritesNavDropdown,
} from "@/components/favorites/FavoritesNavDropdown";
import { navLinks } from "@/lib/site";
import { aboutMenuSections } from "@/lib/about-menu";
import { calculatorMenuSections } from "@/lib/calculator-menu";
import { immigrationMenuSections } from "@/lib/immigration-menu";
import {
  landingV3ImmigrationSections,
  landingV3NavLinks,
} from "@/lib/landing-v3-nav";
import { LandingV3AiBuddyLed } from "@/components/landing-v3/LandingV3AiBuddyLed";
import { LandingV3ImmigrationMegaMenu } from "@/components/landing-v3/LandingV3ImmigrationMegaMenu";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import {
  getMyImmifinPremiumPreview,
  getVisibleMyImmifinMenuItems,
  MY_IMMIFIN_NAV_LABEL,
} from "@/lib/my-immifin-menu";
import {
  getPremiumNavPreviewContent,
  type PremiumNavPreviewKey,
} from "@/lib/premium-nav-preview";
import { hasCapability } from "@/lib/subscription/capabilities";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { landingV3ContainerClass } from "@/components/landing-v3/landingV3Layout";
import { Logo } from "./Logo";
import { clerkAppearance } from "@/lib/clerk/appearance";

const headerUserButtonAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    rootBox: "flex justify-center",
    userButtonBox: "flex justify-center",
    userButtonTrigger: "p-0 shadow-none hover:shadow-none focus:shadow-none",
    userButtonTriggerIcon: "hidden",
    avatarBox: "h-11 w-11 rounded-xl border border-slate-200 overflow-hidden",
    avatarImage: "h-11 w-11 rounded-xl",
    userButtonAvatarBox: "h-11 w-11 rounded-xl border border-slate-200 overflow-hidden",
    userButtonAvatarImage: "h-11 w-11 rounded-xl",
    userButtonPopoverActionButton__manageAccount: "hidden",
  },
};

type HeaderProps = {
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
  /**
   * `v3Preview` — Landing V3: bright blue solid sweep; Log In + Get Started Free.
   * `v4Preview` — same structure with gold/amber solid sweep for comparison.
   * `v5Preview` — same structure with navy (#0B1B3A) solid sweep for comparison.
   * `v6Preview` — approved V6 chrome now served at `/landing-v2`.
   * `v3Ds` — V6 chrome + Design System 2.0 navigation on `/landing-v3` only.
   * `ds2` — same DS2 nav architecture as `v3Ds`, for opted-in product routes. Home is `/`.
   * Default leaves `/` unchanged.
   */
  variant?: "default" | "v3Preview" | "v4Preview" | "v5Preview" | "v6Preview" | "v3Ds" | "ds2";
};

const v3AuthCtaClassName =
  "landing-v3-btn-primary inline-flex items-center justify-center rounded-full bg-[#0B1B3A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";

const v3AuthLoginClassName =
  "landing-v3-btn-secondary inline-flex items-center justify-center rounded-full border-2 border-[#0B1B3A] bg-white px-5 py-2 text-sm font-semibold text-[#0B1B3A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";

const v4AuthCtaClassName =
  "landing-v4-btn-primary inline-flex items-center justify-center rounded-full bg-[#0B1B3A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";

const v4AuthLoginClassName =
  "landing-v4-btn-secondary inline-flex items-center justify-center rounded-full border-2 border-[#0B1B3A] bg-white px-5 py-2 text-sm font-semibold text-[#0B1B3A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";

const v5AuthCtaClassName =
  "landing-v5-btn-primary inline-flex items-center justify-center rounded-full bg-[#E3B636] px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";

const v5AuthLoginClassName =
  "landing-v5-btn-secondary inline-flex items-center justify-center rounded-full border-2 border-[#0B1B3A] bg-white px-5 py-2 text-sm font-semibold text-[#0B1B3A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";

/** V6 baseline matches V5 CTA styling; own class names for future divergence. */
const v6AuthCtaClassName =
  "landing-v6-btn-primary inline-flex items-center justify-center rounded-full bg-[#E3B636] px-5 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";

const v6AuthLoginClassName =
  "landing-v6-btn-secondary inline-flex items-center justify-center rounded-full border-2 border-[#0B1B3A] bg-white px-5 py-2 text-sm font-semibold text-[#0B1B3A] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3A]";

type MyImmifinNavItem = {
  href: string;
  label: string;
  description: string;
  premiumPreview: PremiumNavPreviewKey | null;
};

type NavMenuItem = {
  href: string;
  label: string;
  description: string;
  premiumPreview?: PremiumNavPreviewKey | null;
  tierBadge?: "Pro" | "Power";
  accentClass?: string;
};

type NavMenuSection = {
  id: string;
  label: string;
  items: NavMenuItem[];
};

const navLinkClassName =
  "nav-menu-trigger whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

const navMenuItemClassName =
  "nav-menu-item block w-full rounded-xl px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

const navMenuItemMobileClassName =
  "nav-menu-item flex w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-center text-sm text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

const navMenuItemMobilePremiumClassName =
  "nav-menu-item w-full rounded-lg px-4 py-2.5 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700";

const dropdownPanelClassName =
  "invisible absolute left-1/2 top-full z-50 w-max min-w-[16rem] max-w-[min(26rem,calc(100vw-1.5rem))] -translate-x-1/2 pt-3 opacity-0 transition-[opacity,visibility] duration-200 group-hover:visible group-hover:opacity-100";

const dropdownMenuSurfaceClassName =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur-lg";

const menuItemLabelClassName =
  "relative z-[1] flex items-center whitespace-nowrap text-sm font-semibold text-slate-900";

const menuItemDescriptionClassName =
  "relative z-[1] mt-0.5 block text-xs leading-snug text-slate-500";

const menuSectionHeadingClassName =
  "nav-submenu-group px-4 pb-1 pt-2 first:pt-1";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function getGreetingLine(
  firstName: string | null | undefined,
  fullName: string | null | undefined,
  username: string | null | undefined,
): string {
  const name = firstName || fullName || username;
  const timeGreeting = getTimeGreeting();
  return name ? `${timeGreeting} ${name}` : timeGreeting;
}

function PremiumMenuButton({
  label,
  description,
  previewKey,
  onOpenPreview,
  className,
  align = "left",
  tierBadge = "Pro",
  accentClass,
}: {
  label: string;
  description: string;
  previewKey: PremiumNavPreviewKey;
  onOpenPreview: (key: PremiumNavPreviewKey) => void;
  className?: string;
  align?: "left" | "center";
  tierBadge?: "Pro" | "Power";
  accentClass?: string;
}) {
  return (
    <button
      type="button"
      className={`${className ?? navMenuItemClassName}${accentClass ? ` ${accentClass}` : ""}`}
      onClick={() => onOpenPreview(previewKey)}
    >
      <span
        className={`${menuItemLabelClassName} ${
          align === "center" ? "justify-center" : ""
        }`}
      >
        {accentClass ? (
          <LandingV3AiBuddyLed>
            {label}
            <ProBadge label={tierBadge} className="landing-v3-ai-buddy-badge" />
          </LandingV3AiBuddyLed>
        ) : (
          <>
            {label}
            <ProBadge label={tierBadge} />
          </>
        )}
      </span>
      <span className={menuItemDescriptionClassName}>{description}</span>
    </button>
  );
}

function resolvePremiumPreview(
  previewKey: PremiumNavPreviewKey | undefined,
  tier: SubscriptionTier,
): PremiumNavPreviewKey | null {
  if (!previewKey) {
    return null;
  }

  return hasCapability(tier, getPremiumNavPreviewContent(previewKey).capability)
    ? null
    : previewKey;
}

function renderNavMenuItem(
  item: NavMenuItem,
  onOpenPreview: (key: PremiumNavPreviewKey) => void,
  options?: { onNavigate?: () => void; mobile?: boolean; isSignedIn?: boolean },
) {
  // Guests always get login-required; Pro preview is for signed-in Free users only.
  if (item.premiumPreview && options?.isSignedIn) {
    return (
      <PremiumMenuButton
        key={`${item.href}-${item.label}`}
        label={item.label}
        description={item.description}
        previewKey={item.premiumPreview}
        onOpenPreview={onOpenPreview}
        align={options?.mobile ? "center" : "left"}
        className={options?.mobile ? navMenuItemMobilePremiumClassName : undefined}
        tierBadge={item.tierBadge}
        accentClass={item.accentClass}
      />
    );
  }

  if (options?.mobile) {
    return (
      <ProtectedLink
        key={`${item.href}-${item.label}`}
        href={item.href}
        className={`${navMenuItemMobileClassName}${item.accentClass ? ` ${item.accentClass}` : ""}`}
        onClick={options.onNavigate}
      >
        {item.accentClass ? <LandingV3AiBuddyLed>{item.label}</LandingV3AiBuddyLed> : item.label}
      </ProtectedLink>
    );
  }

  return (
    <ProtectedLink
      key={`${item.href}-${item.label}`}
      href={item.href}
      className={navMenuItemClassName}
    >
      <span className={menuItemLabelClassName}>{item.label}</span>
      <span className={menuItemDescriptionClassName}>{item.description}</span>
    </ProtectedLink>
  );
}

function NavDropdown({
  href,
  label,
  sections,
  onOpenPreview,
  isSignedIn,
}: {
  href: string;
  label: string;
  sections: readonly NavMenuSection[];
  onOpenPreview: (key: PremiumNavPreviewKey) => void;
  isSignedIn: boolean;
}) {
  return (
    <div className="group relative">
      <ProtectedLink href={href} className={`${navLinkClassName} inline-flex items-center gap-1`}>
        {label}
        <svg
          className="h-4 w-4 transition-transform group-hover:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </ProtectedLink>

      <div className={dropdownPanelClassName}>
        <div className={dropdownMenuSurfaceClassName}>
          {sections.map((section, sectionIndex) => (
            <div
              key={section.id}
              className={sectionIndex > 0 ? "mt-1 border-t border-slate-100 pt-1" : undefined}
              role="group"
              aria-label={section.label || label}
            >
              {section.label ? <p className={menuSectionHeadingClassName}>{section.label}</p> : null}
              {section.items.map((item) =>
                renderNavMenuItem(item, onOpenPreview, { isSignedIn }),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildImmigrationSections(tier: SubscriptionTier): NavMenuSection[] {
  return immigrationMenuSections.map((section) => ({
    id: section.id,
    label: section.label,
    items: section.items.map((item) => ({
      href: item.href,
      label: item.label,
      description: item.description,
      premiumPreview: resolvePremiumPreview(item.premiumPreview, tier),
    })),
  }));
}

function buildLandingV3ImmigrationSections(tier: SubscriptionTier): NavMenuSection[] {
  return landingV3ImmigrationSections.map((section) => ({
    id: section.id,
    label: section.label,
    items: section.items.map((item) => ({
      href: item.href,
      label: item.label,
      description: item.description ?? "",
      premiumPreview: resolvePremiumPreview(item.premiumPreview, tier),
      tierBadge: item.tierLabel,
      accentClass: item.href === "/intelligence" ? "landing-v3-ai-buddy" : undefined,
    })),
  }));
}

function buildCalculatorSections(): NavMenuSection[] {
  return calculatorMenuSections.map((section) => ({
    id: section.id,
    label: section.label,
    items: section.items.map((item) => ({
      href: item.href,
      label: item.label,
      description: item.description,
      premiumPreview: null,
    })),
  }));
}

function buildAboutSections(): NavMenuSection[] {
  return aboutMenuSections.map((section) => ({
    id: section.id,
    label: section.label,
    items: section.items.map((item) => ({
      href: item.href,
      label: item.label,
      description: item.description,
      premiumPreview: null,
    })),
  }));
}

function buildMyImmifinItems(tier: SubscriptionTier): MyImmifinNavItem[] {
  return getVisibleMyImmifinMenuItems(tier).map((item) => ({
    href: item.href,
    label: item.label,
    description: item.description,
    premiumPreview: getMyImmifinPremiumPreview(item, tier),
  }));
}

function MyImmifinDropdown({
  onOpenPreview,
}: {
  onOpenPreview: (key: PremiumNavPreviewKey) => void;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { showLoginRequired } = useLoginRequired();
  const { tier } = useEffectiveSubscriptionTier();
  const items = buildMyImmifinItems(tier);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function openPreview(key: PremiumNavPreviewKey) {
    setIsOpen(false);
    onOpenPreview(key);
  }

  function handleTriggerClick() {
    if (!isSignedIn) {
      setIsOpen(false);
      showLoginRequired("/dashboard");
      return;
    }

    if (!isLoaded) {
      return;
    }

    setIsOpen((open) => !open);
  }

  const menuItems = items.map((item) =>
    isSignedIn && item.premiumPreview ? (
      <PremiumMenuButton
        key={item.label}
        label={item.label}
        description={item.description}
        previewKey={item.premiumPreview}
        onOpenPreview={openPreview}
      />
    ) : (
      <ProtectedLink
        key={item.href}
        href={item.href}
        role="menuitem"
        className={navMenuItemClassName}
        onClick={() => setIsOpen(false)}
      >
        <span className={menuItemLabelClassName}>{item.label}</span>
        <span className={menuItemDescriptionClassName}>{item.description}</span>
      </ProtectedLink>
    ),
  );

  // Signed-out: CSS hover menu like Immigration/About/Join IMMIFIN so the
  // control is not dead. Child links stay ProtectedLink (Account Gate).
  if (!isSignedIn) {
    return (
      <div className="group relative">
        <button
          type="button"
          className={`${navLinkClassName} inline-flex items-center gap-1`}
          aria-haspopup="menu"
          onClick={handleTriggerClick}
        >
          {MY_IMMIFIN_NAV_LABEL}
          <svg
            className="h-4 w-4 transition-transform group-hover:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <div className={dropdownPanelClassName}>
          <div className={dropdownMenuSurfaceClassName} role="menu">
            {menuItems}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={`${navLinkClassName} inline-flex items-center gap-1`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={handleTriggerClick}
      >
        {MY_IMMIFIN_NAV_LABEL}
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute left-1/2 top-full z-50 w-max min-w-[16rem] max-w-[min(26rem,calc(100vw-1.5rem))] -translate-x-1/2 pt-3"
        >
          <div className={dropdownMenuSurfaceClassName}>{menuItems}</div>
        </div>
      ) : null}
    </div>
  );
}

const JOIN_IMMIFIN_NAV_LABEL = "Join IMMIFIN";

function JoinImmifinDropdown() {
  return (
    <div className="group relative">
      <Link
        href="/signup"
        className={`${navLinkClassName} inline-flex items-center gap-1`}
        aria-haspopup="menu"
      >
        {JOIN_IMMIFIN_NAV_LABEL}
        <svg
          className="h-4 w-4 transition-transform group-hover:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </Link>

      <div className={dropdownPanelClassName}>
        <div className={dropdownMenuSurfaceClassName} role="menu">
          <Link href="/signup" className={navMenuItemClassName} role="menuitem">
            <span className={menuItemLabelClassName}>Create Free Account</span>
            <span className={menuItemDescriptionClassName}>
              Free · $0 · No credit card required
            </span>
          </Link>
          <Link href="/login" className={navMenuItemClassName} role="menuitem">
            <span className={menuItemLabelClassName}>Sign In</span>
            <span className={menuItemDescriptionClassName}>Already have an IMMIFIN account?</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Header({ mobileMenuOpen, onToggleMenu, variant = "default" }: HeaderProps) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { showLoginRequired } = useLoginRequired();
  const { tier } = useEffectiveSubscriptionTier();
  const [previewKey, setPreviewKey] = useState<PremiumNavPreviewKey | null>(null);
  // Visitor account entry must render even if Clerk has not finished loading.
  // Waiting on isLoaded leaves the header empty on localhost when Clerk hangs.
  const showSignedOutAuth = !isSignedIn;
  const showSignedInAuth = Boolean(isLoaded && isSignedIn);
  const signedIn = Boolean(isSignedIn);
  const isV3Preview = variant === "v3Preview";
  const isV4Preview = variant === "v4Preview";
  const isV5Preview = variant === "v5Preview";
  const isV3Ds = variant === "v3Ds";
  const isDs2 = variant === "ds2" || isV3Ds;
  const isV6Preview = variant === "v6Preview" || isDs2;
  const isLandingPreview = isV3Preview || isV4Preview || isV5Preview || isV6Preview;
  const usesNavyLogo = isV5Preview || isV6Preview;
  const landingPreviewHomeHref = isV3Ds
    ? "/landing-v3"
    : variant === "ds2"
    ? "/"
    : isV6Preview
    ? pathname === "/landing-v3"
      ? "/landing-v3"
      : pathname === "/landing-v7"
        ? "/landing-v7"
        : "/landing-v2"
    : isV5Preview
      ? "/landing-v5"
      : isV4Preview
        ? "/landing-v4"
        : "/landing-v3";
  const menuLinks = isDs2
    ? variant === "ds2"
      ? landingV3NavLinks.map((link) => (link.label === "Home" ? { ...link, href: "/" } : link))
      : landingV3NavLinks
    : pathname === "/landing-v2" || pathname === "/landing-v7"
      ? navLinks.map((link) =>
          link.href === "/insurance" ? { ...link, href: "/life", label: "Life" } : link,
        )
      : navLinks;
  const landingAuthLoginClassName = isV6Preview
    ? v6AuthLoginClassName
    : isV5Preview
      ? v5AuthLoginClassName
      : isV4Preview
        ? v4AuthLoginClassName
        : v3AuthLoginClassName;
  const landingAuthCtaClassName = isV6Preview
    ? v6AuthCtaClassName
    : isV5Preview
      ? v5AuthCtaClassName
      : isV4Preview
        ? v4AuthCtaClassName
        : v3AuthCtaClassName;
  const greetingLine = user
    ? getGreetingLine(user.firstName, user.fullName, user.username)
    : getTimeGreeting();

  const myImmifinItems = buildMyImmifinItems(tier);
  const immigrationSections = isDs2
    ? buildLandingV3ImmigrationSections(tier)
    : buildImmigrationSections(tier);
  const calculatorSections = buildCalculatorSections();
  const aboutSections = buildAboutSections();

  const openPreview = useCallback((key: PremiumNavPreviewKey) => {
    setPreviewKey(key);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewKey(null);
  }, []);

  function openPreviewFromMobile(key: PremiumNavPreviewKey) {
    onToggleMenu();
    setPreviewKey(key);
  }

  function openLoginFromChrome() {
    if (mobileMenuOpen) {
      onToggleMenu();
    }
    showLoginRequired("/");
  }

  return (
    <>
      <header
        className={
          isV6Preview
            ? `landing-v6-nav${isDs2 ? " landing-v3-ds" : ""} sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70`
            : isV5Preview
              ? "landing-v5-nav sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70"
              : isV4Preview
                ? "landing-v4-nav sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70"
                : isV3Preview
                  ? "landing-v3-nav sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70"
                  : "sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70"
        }
      >
      <div className={isLandingPreview ? landingV3ContainerClass : "container-main"}>
        {/*
          V3/V4 desktop: three equal-zone grid so the main menu is genuinely
          centered (not flowing after the logo). Production `/` keeps flex.
        */}
        <div
          className={
            isLandingPreview
              ? "grid h-16 grid-cols-[1fr_auto_1fr] items-center sm:h-[4.5rem]"
              : "flex h-16 items-center gap-0.5 sm:h-[4.5rem]"
          }
        >
          <div className={isLandingPreview ? "justify-self-start shrink-0" : "shrink-0"}>
            <Logo
              href={isLandingPreview ? landingPreviewHomeHref : "/"}
              iconTone={usesNavyLogo ? "navy" : "default"}
            />
          </div>

          <nav
            className={
              isLandingPreview
                ? "hidden min-w-0 items-center gap-0.5 justify-self-center md:flex"
                : "hidden min-w-0 items-center gap-0.5 md:flex"
            }
            aria-label={isLandingPreview && variant !== "ds2" ? "Landing preview navigation" : "Main navigation"}
          >
            {menuLinks.map((link) => {
              if (isDs2 && "isMyImmifin" in link && link.isMyImmifin) {
                return (
                  <Fragment key={link.href}>
                    <ProtectedLink href={link.href} className={navLinkClassName}>
                      {link.label}
                    </ProtectedLink>
                    <FavoritesNavDropdown onOpenPreview={openPreview} />
                  </Fragment>
                );
              }
              if ("hasDropdown" in link && link.hasDropdown) {
                if ("isMyImmifin" in link && link.isMyImmifin) {
                  return (
                    <Fragment key={link.href}>
                      <MyImmifinDropdown onOpenPreview={openPreview} />
                      <FavoritesNavDropdown onOpenPreview={openPreview} />
                    </Fragment>
                  );
                }
                if (link.href === "/immigration") {
                  if (isDs2) {
                    return (
                      <LandingV3ImmigrationMegaMenu
                        key={link.href}
                        onOpenPreview={openPreview}
                        isSignedIn={signedIn}
                      />
                    );
                  }
                  return (
                    <NavDropdown
                      key={link.href}
                      href="/immigration"
                      label="Immigration"
                      sections={immigrationSections}
                      onOpenPreview={openPreview}
                      isSignedIn={signedIn}
                    />
                  );
                }
                if (link.href === "/calculators") {
                  return (
                    <NavDropdown
                      key={link.href}
                      href="/calculators"
                      label="Calculators"
                      sections={calculatorSections}
                      onOpenPreview={openPreview}
                      isSignedIn={signedIn}
                    />
                  );
                }
                if (link.href === "/about") {
                  return (
                    <NavDropdown
                      key={link.href}
                      href="/about"
                      label="About"
                      sections={aboutSections}
                      onOpenPreview={openPreview}
                      isSignedIn={signedIn}
                    />
                  );
                }
              }

              return (
                <ProtectedLink key={link.href} href={link.href} className={navLinkClassName}>
                  {link.label}
                </ProtectedLink>
              );
            })}
            {showSignedOutAuth && !isLandingPreview ? <JoinImmifinDropdown /> : null}
          </nav>

          <div
            className={
              isLandingPreview
                ? "flex shrink-0 items-center justify-end justify-self-end gap-2"
                : "ml-auto flex shrink-0 items-center justify-end gap-2"
            }
          >
            {isLandingPreview && showSignedOutAuth ? (
              <div className="hidden items-center gap-3 md:flex">
                <Link href="/login" className={landingAuthLoginClassName}>
                  Log In
                </Link>
                <Link href="/signup" className={landingAuthCtaClassName}>
                  Get Started Free
                </Link>
              </div>
            ) : null}
            {showSignedInAuth && (
              <div className="flex flex-col items-center justify-center">
                <UserButton appearance={headerUserButtonAppearance}>
                  <UserButton.MenuItems>
                    <UserButton.Action label="signOut" />
                  </UserButton.MenuItems>
                </UserButton>
                <p className="mt-1 whitespace-nowrap text-center text-xs font-medium text-slate-600">
                  {greetingLine}
                </p>
              </div>
            )}
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 md:hidden"
              onClick={onToggleMenu}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-slate-100 py-4 md:hidden" aria-label="Mobile navigation">
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-slate-50/80 p-2">
              {menuLinks.map((link) => {
                if (isDs2 && "isMyImmifin" in link && link.isMyImmifin) {
                  if (!signedIn) {
                    return (
                      <div key={link.href} className="w-full space-y-0.5">
                        <button
                          type="button"
                          className="nav-menu-item w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                          onClick={openLoginFromChrome}
                        >
                          {MY_IMMIFIN_NAV_LABEL}
                        </button>
                        <button
                          type="button"
                          className="nav-menu-item w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                          onClick={openLoginFromChrome}
                        >
                          Favorites
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={link.href} className="w-full">
                      <ProtectedLink
                        href={link.href}
                        className="nav-menu-item w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                        onClick={onToggleMenu}
                      >
                        {MY_IMMIFIN_NAV_LABEL}
                      </ProtectedLink>
                      <div className="mt-2 border-t border-slate-200/80 pt-2">
                        <FavoritesMobileSection
                          onNavigate={onToggleMenu}
                          onOpenPreview={openPreviewFromMobile}
                        />
                      </div>
                    </div>
                  );
                }

                if ("hasDropdown" in link && link.hasDropdown) {
                  const isMyImmifin = "isMyImmifin" in link && link.isMyImmifin;

                  if (isMyImmifin) {
                    if (!signedIn) {
                      return (
                        <div key={link.href} className="w-full space-y-0.5">
                          <button
                            type="button"
                            className="nav-menu-item w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                            onClick={openLoginFromChrome}
                          >
                            {MY_IMMIFIN_NAV_LABEL}
                          </button>
                          <button
                            type="button"
                            className="nav-menu-item w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                            onClick={openLoginFromChrome}
                          >
                            Favorites
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={link.href} className="w-full">
                        <div className="px-4 py-3 text-center text-base font-medium text-slate-700">
                          {MY_IMMIFIN_NAV_LABEL}
                        </div>
                        <div className="mt-1 space-y-0.5 border-t border-slate-200/80 pt-1">
                          {myImmifinItems.map((item) =>
                            item.premiumPreview ? (
                              <PremiumMenuButton
                                key={item.label}
                                label={item.label}
                                description={item.description}
                                previewKey={item.premiumPreview}
                                onOpenPreview={openPreviewFromMobile}
                                align="center"
                                className={navMenuItemMobilePremiumClassName}
                              />
                            ) : (
                              <ProtectedLink
                                key={item.href}
                                href={item.href}
                                className={navMenuItemMobileClassName}
                                onClick={onToggleMenu}
                              >
                                {item.label}
                              </ProtectedLink>
                            ),
                          )}
                        </div>
                        <div className="mt-2 border-t border-slate-200/80 pt-2">
                          <FavoritesMobileSection
                            onNavigate={onToggleMenu}
                            onOpenPreview={openPreviewFromMobile}
                          />
                        </div>
                      </div>
                    );
                  }

                  const submenuSections =
                    link.href === "/calculators"
                      ? calculatorSections
                      : link.href === "/about"
                        ? aboutSections
                        : immigrationSections;

                  return (
                    <div key={link.href} className="w-full">
                      <ProtectedLink
                        href={link.href}
                        className="nav-menu-trigger flex w-full items-center justify-center gap-1 rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                        onClick={onToggleMenu}
                      >
                        {link.label}
                      </ProtectedLink>
                      <div className="mt-1 space-y-2 border-t border-slate-200/80 pt-1">
                        {submenuSections.map((section) => (
                          <div key={section.id} role="group" aria-label={section.label || link.label}>
                            {section.label ? (
                              <p className="nav-submenu-group px-4 py-1 text-center">
                                {section.label}
                              </p>
                            ) : null}
                            <div className="space-y-0.5">
                              {section.items.map((item) =>
                                renderNavMenuItem(item, openPreviewFromMobile, {
                                  mobile: true,
                                  onNavigate: onToggleMenu,
                                  isSignedIn: signedIn,
                                }),
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <ProtectedLink
                    key={link.href}
                    href={link.href}
                    className="nav-menu-item w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    onClick={onToggleMenu}
                  >
                    {link.label}
                  </ProtectedLink>
                );
              })}
              {showSignedOutAuth && isLandingPreview ? (
                <div className="mt-2 w-full space-y-2 border-t border-slate-200/80 pt-3">
                  <Link href="/login" className={`${landingAuthLoginClassName} w-full`} onClick={onToggleMenu}>
                    Log In
                  </Link>
                  <Link href="/signup" className={`${landingAuthCtaClassName} w-full`} onClick={onToggleMenu}>
                    Get Started Free
                  </Link>
                </div>
              ) : null}
              {showSignedOutAuth && !isLandingPreview ? (
                <div className="mt-2 w-full space-y-1 border-t border-slate-200/80 pt-2">
                  <div className="px-4 py-3 text-center text-base font-medium text-slate-700">
                    {JOIN_IMMIFIN_NAV_LABEL}
                  </div>
                  <Link href="/signup" className="btn-primary w-full" onClick={onToggleMenu}>
                    Create Free Account
                  </Link>
                  <p className="px-4 pb-1 text-center text-xs text-slate-500">
                    Free · $0 · No credit card required
                  </p>
                  <Link
                    href="/login"
                    className="nav-menu-item block w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    onClick={onToggleMenu}
                  >
                    Sign In
                  </Link>
                  <p className="px-4 pb-1 text-center text-xs text-slate-500">
                    Already have an IMMIFIN account?
                  </p>
                </div>
              ) : null}
            </div>
          </nav>
        )}
      </div>
      </header>

      <PremiumNavPreviewDialog previewKey={previewKey} onClose={closePreview} />
    </>
  );
}
