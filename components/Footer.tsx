import Link from "next/link";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { footerLinks, navLinks, siteConfig } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-sm">
      <div className="container-main section-padding !py-12 lg:!py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <ProtectedLink
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </ProtectedLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <ProtectedLink
                    href={link.href}
                    className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </ProtectedLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Stay Informed
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Get immigration and finance tips delivered to your inbox.
            </p>
            <ProtectedLink href="/contact" className="btn-secondary mt-4 w-full sm:w-auto">
              Contact Us
            </ProtectedLink>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200/80 pt-8">
          <p className="text-center text-sm text-slate-500">
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
