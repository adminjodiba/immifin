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
          {hideLiveFooter ? null : <Footer variant="ds2" logoIconTone="navy" />}
          <DevTierSwitcher />
        </div>
      </SubscriptionTierProvider>
    </LoginRequiredProvider>
  );
}
