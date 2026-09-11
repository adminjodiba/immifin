import type { ReactNode } from "react";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

type Ds2DataPageShellProps = {
  children: ReactNode;
};

/**
 * Canonical Design System 2.0 data-product body shell (Visa Bulletin family).
 * Header/Footer stay in SiteShell. Does not add a page H1 — live tools already have one.
 * Framing only: no data fetching, filters, charts, or entitlement logic.
 */
export function Ds2DataPageShell({ children }: Ds2DataPageShellProps) {
  return (
    <div className="ds2-data-page">
      <div className={`${landingV3ContentGridClass} ds2-data-page-inner`}>{children}</div>
    </div>
  );
}
