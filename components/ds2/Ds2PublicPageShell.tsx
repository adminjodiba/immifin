import type { ReactNode } from "react";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

type Ds2PublicPageShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
  /**
   * `standard` — full DS2 content width (About, Contact).
   * `reading` — narrower column for legal and article pages.
   * Both modes share the same DS2 system.
   */
  layout?: "standard" | "reading";
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
  layout = "standard",
}: Ds2PublicPageShellProps) {
  const isReading = layout === "reading";

  return (
    <div className="ds2-public-page">
      <div className={`${landingV3ContentGridClass} ds2-public-page-inner`}>
        <header className={isReading ? "ds2-public-page-intro ds2-public-page-intro-reading" : "ds2-public-page-intro"}>
          {eyebrow ? <p className="ds2-public-page-eyebrow">{eyebrow}</p> : null}
          <span className="ds2-section-header-accent" aria-hidden="true" />
          <h1 className="ds2-public-page-title">{title}</h1>
          {description ? <p className="ds2-public-page-description">{description}</p> : null}
        </header>
        <div className={isReading ? "ds2-public-page-reading" : "ds2-public-page-body"}>{children}</div>
      </div>
    </div>
  );
}
