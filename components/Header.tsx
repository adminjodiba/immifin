"use client";

import Link from "next/link";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { navLinks } from "@/lib/site";
import { calculatorMenuLinks } from "@/lib/calculator-menu";
import { immigrationMenuLinks } from "@/lib/immigration-menu";
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
  },
};

type HeaderProps = {
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
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

function NavDropdown({
  href,
  label,
  items,
}: {
  href: string;
  label: string;
  items: readonly { href: string; label: string; description: string }[];
}) {
  return (
    <div className="group relative">
      <Link href={href} className={`${navLinkClassName} inline-flex items-center gap-1`}>
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
      </Link>

      <div className="invisible absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur-lg">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-4 py-3 transition-colors hover:bg-brand-50"
            >
              <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
              <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalculatorsDropdown() {
  return <NavDropdown href="/calculators" label="Calculators" items={calculatorMenuLinks} />;
}

function ImmigrationDropdown() {
  return <NavDropdown href="/immigration" label="Immigration" items={immigrationMenuLinks} />;
}

function ManageProfileIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.75}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 0115 0"
      />
    </svg>
  );
}

export function Header({ mobileMenuOpen, onToggleMenu }: HeaderProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const showSignedOutAuth = isLoaded && !isSignedIn;
  const showSignedInAuth = isLoaded && isSignedIn;
  const greetingLine = user
    ? getGreetingLine(user.firstName, user.fullName, user.username)
    : getTimeGreeting();

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
                if (link.href === "/immigration") {
                  return <ImmigrationDropdown key={link.href} />;
                }
                return <CalculatorsDropdown key={link.href} />;
              }

              return (
                <Link key={link.href} href={link.href} className={navLinkClassName}>
                  {link.label}
                </Link>
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
                    <UserButton.Link
                      label="Manage Profile"
                      labelIcon={<ManageProfileIcon />}
                      href="/user-profile"
                    />
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
                  const submenu =
                    link.href === "/immigration" ? immigrationMenuLinks : calculatorMenuLinks;

                  return (
                    <div key={link.href} className="w-full">
                      <Link
                        href={link.href}
                        className="block w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 transition-colors hover:bg-white hover:text-brand-700"
                        onClick={onToggleMenu}
                      >
                        {link.label}
                      </Link>
                      <div className="mt-1 space-y-0.5 border-t border-slate-200/80 pt-1">
                        {submenu.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block w-full rounded-lg px-4 py-2.5 text-center text-sm text-slate-600 transition-colors hover:bg-white hover:text-brand-700"
                            onClick={onToggleMenu}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 transition-colors hover:bg-white hover:text-brand-700"
                    onClick={onToggleMenu}
                  >
                    {link.label}
                  </Link>
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
