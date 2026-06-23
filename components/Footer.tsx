import Link from "next/link";
import { footerLinks, navLinks, siteConfig } from "@/lib/site";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container-main section-padding !py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-700 text-lg font-bold text-white">
                i
              </span>
              <span className="text-xl font-bold text-brand-900">Immifin</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Navigation
            </h3>
            <ul className="mt-4 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Stay Informed
            </h3>
            <p className="mt-4 text-sm text-slate-600">
              Get immigration and finance tips delivered to your inbox.
            </p>
            <Link href="/contact" className="btn-secondary mt-4 w-full sm:w-auto">
              Contact Us
            </Link>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8">
          <p className="text-center text-sm text-slate-500">
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
