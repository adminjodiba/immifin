"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { LoginRequiredProvider } from "@/components/auth/LoginRequiredProvider";
import { DevTierSwitcher } from "@/components/dev/DevTierSwitcher";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SubscriptionTierProvider } from "@/lib/hooks/SubscriptionTierProvider";
import { LandingV3AnnouncementBar } from "@/components/landing-v3/LandingV3AnnouncementBar";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * Preview routes that supply their own top chrome (hide live Header).
 * /landing-v2 is the locked commercial baseline; /landing-v3 is the DS workspace.
 */
const PREVIEW_OWN_HEADER_PATHS = new Set([
  "/landing-v2",
  "/landing-v3",
  "/landing-v7",
]);
const PREVIEW_HIDE_FOOTER_PATHS = new Set<string>();
/** Controlled DS2 public informational routes (S7A-DS2-PUBLIC-001). */
const DS2_PUBLIC_PATHS = new Set([
  "/about",
  "/about/share-feedback",
  "/about/what-users-say",
  "/contact",
  "/privacy",
  "/terms",
  "/articles/why-we-built-immifin",
  "/life",
]);
/** Controlled DS2 calculator routes (S7A-DS2-CALC-SHELL-001). Visa stamping map is excluded. */
const DS2_CALCULATOR_PATHS = new Set([
  "/calculators",
  "/calculators/green-card-wait-time",
  "/calculators/citizenship-eligibility",
  "/immigration/h1b-wage-level-estimator",
  "/immigration/h1b-lottery-odds-calculator",
]);
/** Controlled DS2 Visa Bulletin data-product routes (S7A-DS2-VB-SHELL-001). */
const DS2_VISA_BULLETIN_PATHS = new Set([
  "/immigration/visa-bulletin",
  "/immigration/visa-bulletin-history",
  "/immigration/visa-bulletin-movement",
]);
/** Controlled DS2 Immigration hub + stamping map (S7A-DS2-IMM-HUB-001). */
const DS2_IMMIGRATION_HUB_PATHS = new Set([
  "/immigration",
  "/immigration/visa-stamping-wait-map",
]);
/** Controlled DS2 authenticated workspace (S7A-DS2-DASH-SHELL-001 / S7A-DS2-BILL-CHROME-001). */
const DS2_WORKSPACE_PATHS = new Set([
  "/dashboard",
  "/user-profile",
  "/user-profile/personalization",
  "/account/billing",
  "/admin",
]);
/** Controlled DS2 Intelligence workspace (S7A-DS2-AI-CHROME-001). Immigration domain, not My Immifin. */
const DS2_INTELLIGENCE_PATHS = new Set(["/intelligence"]);
/** Controlled DS2 public conversion surface (S7A-DS2-PRICE-CHROME-001). */
const DS2_PRICING_PATHS = new Set(["/pricing"]);
/** Canonical production home (S7A-DS2-HOME-PROMOTE-001). */
const DS2_HOME_PATHS = new Set(["/"]);
/** Controlled DS2 footer opt-in. Landing V3 keeps DS2 Footer without this body shell. */
const DS2_FOOTER_PATHS = new Set([
  ...DS2_HOME_PATHS,
  "/landing-v3",
  ...DS2_PUBLIC_PATHS,
  ...DS2_CALCULATOR_PATHS,
  ...DS2_VISA_BULLETIN_PATHS,
  ...DS2_IMMIGRATION_HUB_PATHS,
  ...DS2_WORKSPACE_PATHS,
  ...DS2_INTELLIGENCE_PATHS,
  ...DS2_PRICING_PATHS,
]);

function isDs2AuthPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/auth/start" ||
    pathname.startsWith("/auth/start/")
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hideLiveHeader = PREVIEW_OWN_HEADER_PATHS.has(pathname) || isDs2AuthPath(pathname);
  const hideLiveFooter = PREVIEW_HIDE_FOOTER_PATHS.has(pathname) || isDs2AuthPath(pathname);
  const isDs2Footer = DS2_FOOTER_PATHS.has(pathname) || pathname.startsWith("/admin/");
  /**
   * Canonical V2 (approved V6 baseline): avoid min-h-screen + main flex-1 stretch.
   * At reduced browser zoom the CSS viewport grows and that combination left a
   * large empty band between page content and the footer. Other routes keep the
   * existing shell.
   */
  const isLandingV5OrV6 =
    pathname === "/" ||
    pathname === "/landing-v2" ||
    pathname === "/landing-v3" ||
    pathname === "/landing-v7";
  const showHomeAnnouncement = pathname === "/";
  /**
   * Live portal chrome is DS2 everywhere. Preview landings keep their own header.
   * Menu visibility is not authorization — /admin remains requireAdmin().
   */
  const isDs2App = !PREVIEW_OWN_HEADER_PATHS.has(pathname);

  return (
    <LoginRequiredProvider>
      <SubscriptionTierProvider>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <div
          className={`${isLandingV5OrV6 ? "flex flex-col" : "flex min-h-screen flex-col"}${isDs2App ? " ds2-app" : ""}`}
        >
          {showHomeAnnouncement ? <LandingV3AnnouncementBar /> : null}
          {hideLiveHeader ? null : (
            <Header
              variant="ds2"
              mobileMenuOpen={mobileMenuOpen}
              onToggleMenu={() => setMobileMenuOpen((open) => !open)}
            />
          )}
          <main className={isLandingV5OrV6 ? undefined : "flex-1"}>{children}</main>
          {hideLiveFooter ? null : (
            <Footer
              variant={isDs2Footer ? "ds2" : "default"}
              logoIconTone={isDs2Footer || isLandingV5OrV6 ? "navy" : "default"}
            />
          )}
          <DevTierSwitcher />
        </div>
      </SubscriptionTierProvider>
    </LoginRequiredProvider>
  );
}
