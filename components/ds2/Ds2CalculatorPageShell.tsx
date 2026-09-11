import type { ReactNode } from "react";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

type Ds2CalculatorPageShellProps = {
  children: ReactNode;
};

/**
 * Canonical Design System 2.0 calculator-page body shell.
 * Header/Footer stay in SiteShell. Does not add a page H1 — live tools already have one.
 */
export function Ds2CalculatorPageShell({ children }: Ds2CalculatorPageShellProps) {
  return (
    <div className="ds2-calculator-page">
      <div className={`${landingV3ContentGridClass} ds2-calculator-page-inner`}>{children}</div>
    </div>
  );
}
