import Link from "next/link";
import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";
import { footerLinks, navLinks, siteConfig } from "@/lib/site";
import { Logo } from "./Logo";

type FooterProps = {
  /** Landing V5 passes `navy` so header/footer logo tiles match. */
  logoIconTone?: "default" | "navy";
  /**
   * `ds2` — Design System 2.0 footer IA and Landing V3 width, opted-in routes only.
   * Default keeps production / V2 / V7 Footer unchanged.
   */
  variant?: "default" | "ds2";
};

const ds2FooterGroups = [
  {
    heading: "IMMIFIN",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    heading: "LEGAL",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
] as const;

const ds2FooterLinkClassName =
  "text-sm text-[color:var(--immifin-ds2-text-muted)] transition-colors hover:text-[color:var(--immifin-ds2-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--immifin-ds2-navy)]";

export function Footer({ logoIconTone = "default", variant = "default" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === "ds2") {
    return (
      <footer
        aria-label="Site footer"
        className="mt-auto border-t border-[color:var(--immifin-ds2-border)] bg-[var(--immifin-ds2-surface)]"
      >
        <div className={`${landingV3ContentGridClass} py-12 lg:py-14`}>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <Logo iconTone={logoIconTone} />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[color:var(--immifin-ds2-text-muted)]">
                {siteConfig.description}
              </p>
            </div>

            {ds2FooterGroups.map((group) => (
              <nav key={group.heading} aria-labelledby={`ds2-footer-${group.heading.toLowerCase()}`}>
                <h3
                  id={`ds2-footer-${group.heading.toLowerCase()}`}
                  className="text-xs font-bold uppercase tracking-wider text-[color:var(--immifin-ds2-text-primary)]"
                >
                  {group.heading}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={ds2FooterLinkClassName}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-12 border-t border-[color:var(--immifin-ds2-border)] pt-8">
            <p className="text-center text-sm text-[color:var(--immifin-ds2-text-muted)]">
              &copy; {currentYear} {siteConfig.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-sm">
      <div className="container-main section-padding !py-12 lg:!py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo iconTone={logoIconTone} />
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
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-slate-600 transition-colors hover:text-brand-700"
                >
                  Pricing
                </Link>
              </li>
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
