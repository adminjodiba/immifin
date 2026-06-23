import Link from "next/link";
import { navLinks } from "@/lib/site";
import { Logo } from "./Logo";

type HeaderProps = {
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
};

export function Header({ mobileMenuOpen, onToggleMenu }: HeaderProps) {
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="justify-self-end">
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
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-full rounded-xl px-4 py-3 text-center text-base font-medium text-slate-700 transition-colors hover:bg-white hover:text-brand-700"
                  onClick={onToggleMenu}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
