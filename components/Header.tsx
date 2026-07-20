"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
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
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { useIsAdminRole } from "@/lib/hooks/useIsAdminRole";
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
};

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
}: {
  label: string;
  description: string;
  previewKey: PremiumNavPreviewKey;
  onOpenPreview: (key: PremiumNavPreviewKey) => void;
  className?: string;
  align?: "left" | "center";
}) {
  const textAlign = align === "center" ? "text-center" : "text-left";

  return (
    <button
      type="button"
      className={className ?? navMenuItemClassName}
      onClick={() => onOpenPreview(previewKey)}
    >
      <span
        className={`${menuItemLabelClassName} ${
          align === "center" ? "justify-center" : ""
        }`}
      >
        {label}
        <ProBadge />
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
  options?: { onNavigate?: () => void; mobile?: boolean },
) {
  if (item.premiumPreview) {
    return (
      <PremiumMenuButton
        key={`${item.href}-${item.label}`}
        label={item.label}
        description={item.description}
        previewKey={item.premiumPreview}
        onOpenPreview={onOpenPreview}
        align={options?.mobile ? "center" : "left"}
        className={options?.mobile ? navMenuItemMobilePremiumClassName : undefined}
      />
    );
  }

  if (options?.mobile) {
    return (
      <ProtectedLink
        key={`${item.href}-${item.label}`}
        href={item.href}
        className={navMenuItemMobileClassName}
        onClick={options.onNavigate}
      >
        {item.label}
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
}: {
  href: string;
  label: string;
  sections: readonly NavMenuSection[];
  onOpenPreview: (key: PremiumNavPreviewKey) => void;
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
              {section.items.map((item) => renderNavMenuItem(item, onOpenPreview))}
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

function buildMyImmifinItems(tier: SubscriptionTier, isAdmin: boolean): MyImmifinNavItem[] {
  return getVisibleMyImmifinMenuItems(tier, { isAdmin }).map((item) => ({
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
  const { tier } = useEffectiveSubscriptionTier();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdminRole();
  const items = buildMyImmifinItems(tier, !isAdminLoading && isAdmin);
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

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={`${navLinkClassName} inline-flex items-center gap-1`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
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
          <div className={dropdownMenuSurfaceClassName}>
            {items.map((item) =>
              item.premiumPreview ? (
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
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Header({ mobileMenuOpen, onToggleMenu }: HeaderProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { tier } = useEffectiveSubscriptionTier();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdminRole();
  const [previewKey, setPreviewKey] = useState<PremiumNavPreviewKey | null>(null);
  const showSignedOutAuth = isLoaded && !isSignedIn;
  const showSignedInAuth = isLoaded && isSignedIn;
  const greetingLine = user
    ? getGreetingLine(user.firstName, user.fullName, user.username)
    : getTimeGreeting();

  const myImmifinItems = buildMyImmifinItems(tier, !isAdminLoading && isAdmin);
  const immigrationSections = buildImmigrationSections(tier);
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

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70">
      <div className="container-main">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center sm:h-[4.5rem]">
          <div className="justify-self-start">
            <Logo />
          </div>

          <nav
            className="hidden items-center justify-center gap-0.5 md:flex"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
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
                  return (
                    <NavDropdown
                      key={link.href}
                      href="/immigration"
                      label="Immigration"
                      sections={immigrationSections}
                      onOpenPreview={openPreview}
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
          </nav>

          <div className="flex items-center justify-end gap-2 justify-self-end">
            {showSignedOutAuth && (
              <div className="hidden items-center gap-1 md:flex">
                <Link href="/login" className={navLinkClassName}>
                  Login
                </Link>
                <Link href="/signup" className="btn-primary px-4 py-2">
                  Sign Up
                </Link>
              </div>
            )}
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
              {navLinks.map((link) => {
                if ("hasDropdown" in link && link.hasDropdown) {
                  const isMyImmifin = "isMyImmifin" in link && link.isMyImmifin;

                  if (isMyImmifin) {
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
              {showSignedOutAuth && (
                <div className="mt-2 w-full space-y-1 border-t border-slate-200/80 pt-2">
                  <Link
                    href="/login"
                    className="nav-menu-item block w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                    onClick={onToggleMenu}
                  >
                    Login
                  </Link>
                  <Link href="/signup" className="btn-primary w-full" onClick={onToggleMenu}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
      </header>

      <PremiumNavPreviewDialog previewKey={previewKey} onClose={closePreview} />
    </>
  );
}
