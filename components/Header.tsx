"use client";

import Link from "next/link";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useId, useRef, useState } from "react";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { navLinks } from "@/lib/site";
import { calculatorMenuLinks } from "@/lib/calculator-menu";
import { immigrationMenuLinks } from "@/lib/immigration-menu";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import {
  DASHBOARD_PRO_LOCK_MESSAGE,
  getVisibleMyImmifinMenuItems,
  isMyImmifinItemLocked,
  MY_IMMIFIN_NAV_LABEL,
} from "@/lib/my-immifin-menu";
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
    // Manage Profile lives under My Immifin — hide avatar account-profile entry.
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
  locked: boolean;
};

const navLinkClassName =
  "rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700";

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

function ProBadge() {
  return (
    <span className="ml-1.5 inline-flex items-center rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
      Pro
    </span>
  );
}

function LockedMenuItem({
  label,
  description,
  className,
}: {
  label: string;
  description: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={
        className ??
        "block w-full rounded-xl px-4 py-3 text-left opacity-60 transition-colors hover:bg-slate-50"
      }
      onClick={() => {
        window.alert(DASHBOARD_PRO_LOCK_MESSAGE);
      }}
    >
      <span className="flex items-center text-sm font-semibold text-slate-500">
        {label}
        <ProBadge />
      </span>
      <span className="mt-0.5 block text-xs text-slate-400">{description}</span>
    </button>
  );
}

function NavDropdown({
  href,
  label,
  items,
}: {
  href: string;
  label: string;
  items: readonly { href: string; label: string; description: string; locked?: boolean }[];
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

      <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur-lg">
          {items.map((item) =>
            item.locked ? (
              <LockedMenuItem
                key={item.label}
                label={item.label}
                description={item.description}
              />
            ) : (
              <ProtectedLink
                key={item.href}
                href={item.href}
                className="block rounded-xl px-4 py-3 transition-colors hover:bg-brand-50"
              >
                <span className="flex items-center text-sm font-semibold text-slate-900">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
              </ProtectedLink>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function ImmigrationDropdown() {
  return <NavDropdown href="/immigration" label="Immigration" items={immigrationMenuLinks} />;
}

function CalculatorDropdown() {
  return <NavDropdown href="/calculators" label="Calculator" items={calculatorMenuLinks} />;
}

function buildMyImmifinItems(tier: SubscriptionTier): MyImmifinNavItem[] {
  return getVisibleMyImmifinMenuItems(tier).map((item) => ({
    href: item.href,
    label: item.label,
    description: item.description,
    locked: isMyImmifinItemLocked(item, tier),
  }));
}

/**
 * Pure navigation menu trigger — opens dropdown only, never navigates.
 */
function MyImmifinDropdown() {
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
        <div id={menuId} role="menu" className="absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur-lg">
            {items.map((item) =>
              item.locked ? (
                <LockedMenuItem
                  key={item.label}
                  label={item.label}
                  description={item.description}
                />
              ) : (
                <ProtectedLink
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className="block rounded-xl px-4 py-3 transition-colors hover:bg-brand-50"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="flex items-center text-sm font-semibold text-slate-900">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
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
  const showSignedOutAuth = isLoaded && !isSignedIn;
  const showSignedInAuth = isLoaded && isSignedIn;
  const greetingLine = user
    ? getGreetingLine(user.firstName, user.fullName, user.username)
    : getTimeGreeting();

  const myImmifinItems = buildMyImmifinItems(tier);

  return (
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
                  return <MyImmifinDropdown key={link.href} />;
                }
                if (link.href === "/immigration") {
                  return <ImmigrationDropdown key={link.href} />;
                }
                if (link.href === "/calculators") {
                  return <CalculatorDropdown key={link.href} />;
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
                    {/* Account-level actions only. Dashboard and Manage Profile live under My Immifin. */}
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
                            item.locked ? (
                              <LockedMenuItem
                                key={item.label}
                                label={item.label}
                                description={item.description}
                                className="w-full rounded-lg px-4 py-2.5 text-center opacity-60"
                              />
                            ) : (
                              <ProtectedLink
                                key={item.href}
                                href={item.href}
                                className="flex w-full items-center justify-center gap-1 rounded-lg px-4 py-2.5 text-center text-sm text-slate-600 transition-colors hover:bg-white hover:text-brand-700"
                                onClick={onToggleMenu}
                              >
                                {item.label}
                              </ProtectedLink>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  }

                  const submenu =
                    link.href === "/calculators" ? calculatorMenuLinks : immigrationMenuLinks;

                  return (
                    <div key={link.href} className="w-full">
                      <ProtectedLink
                        href={link.href}
                        className="flex w-full items-center justify-center gap-1 rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 transition-colors hover:bg-white hover:text-brand-700"
                        onClick={onToggleMenu}
                      >
                        {link.label}
                      </ProtectedLink>
                      <div className="mt-1 space-y-0.5 border-t border-slate-200/80 pt-1">
                        {submenu.map((item) => (
                          <ProtectedLink
                            key={item.href}
                            href={item.href}
                            className="flex w-full items-center justify-center gap-1 rounded-lg px-4 py-2.5 text-center text-sm text-slate-600 transition-colors hover:bg-white hover:text-brand-700"
                            onClick={onToggleMenu}
                          >
                            {item.label}
                          </ProtectedLink>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <ProtectedLink
                    key={link.href}
                    href={link.href}
                    className="w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 transition-colors hover:bg-white hover:text-brand-700"
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
                    className="block w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 transition-colors hover:bg-white hover:text-brand-700"
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
  );
}
