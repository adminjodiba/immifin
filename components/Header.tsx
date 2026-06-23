import Link from "next/link";
import { navLinks } from "@/lib/site";

type HeaderProps = {
  mobileMenuOpen: boolean;
  onToggleMenu: () => void;
};

export function Header({ mobileMenuOpen, onToggleMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="container-main">
        <div className="flex h-16 items-center justify-between lg:h-18">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-lg font-bold text-white">
              i
            </span>
            <span className="text-xl font-bold text-brand-900">Immifin</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link href="/calculators" className="btn-primary">
              Explore Calculators
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={onToggleMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-slate-200 py-4 md:hidden" aria-label="Mobile navigation">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-3 text-base font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                  onClick={onToggleMenu}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/calculators"
                className="btn-primary mt-2 text-center"
                onClick={onToggleMenu}
              >
                Explore Calculators
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
