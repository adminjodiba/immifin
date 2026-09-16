import type { ReactNode } from "react";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

type Ds2PublicPageShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
  /** Optional Billing-Center-style handwritten slogan. Pricing only. */
  quote?: string;
  /**
   * `standard` — full DS2 content width (About, Contact).
   * `reading` — narrower column for legal and article pages.
   * Both modes share the same DS2 system.
   */
  layout?: "standard" | "reading";
  /** Keep the intro description on one line when the viewport can support it. */
  singleLineDescription?: boolean;
};

/**
 * Canonical Design System 2.0 public-page shell.
 * Header/Footer stay in SiteShell. This is body chrome only.
 */
export function Ds2PublicPageShell({
  children,
  title,
  description,
  eyebrow,
  quote,
  layout = "standard",
  singleLineDescription = false,
}: Ds2PublicPageShellProps) {
  const isReading = layout === "reading";
  const introClass = [
    "ds2-public-page-intro",
    isReading ? "ds2-public-page-intro-reading" : "",
    quote ? "ds2-public-page-intro-with-quote" : "",
    singleLineDescription ? "ds2-public-page-intro-single-line" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="ds2-public-page">
      <div className={`${landingV3ContentGridClass} ds2-public-page-inner`}>
        <header className={introClass}>
          <div className="ds2-public-page-intro-copy">
            {eyebrow ? <p className="ds2-public-page-eyebrow">{eyebrow}</p> : null}
            {quote ? null : <span className="ds2-section-header-accent" aria-hidden="true" />}
            <h1 className="ds2-public-page-title">{title}</h1>
            {description ? <p className="ds2-public-page-description">{description}</p> : null}
          </div>
          {quote ? (
            <p className="ds2-billing-page-quote">
              {quote}
              <span className="ds2-billing-page-quote-mark" aria-hidden="true" />
            </p>
          ) : null}
        </header>
        <div className={isReading ? "ds2-public-page-reading" : "ds2-public-page-body"}>{children}</div>
      </div>
    </div>
  );
}
