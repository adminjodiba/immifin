"use client";

import { Suspense, useState } from "react";
import { LoginRequiredProvider } from "@/components/auth/LoginRequiredProvider";
import { DevTierSwitcher } from "@/components/dev/DevTierSwitcher";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SubscriptionTierProvider } from "@/lib/hooks/SubscriptionTierProvider";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <LoginRequiredProvider>
      <SubscriptionTierProvider>
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <div className="flex min-h-screen flex-col">
          <Header
            mobileMenuOpen={mobileMenuOpen}
            onToggleMenu={() => setMobileMenuOpen((open) => !open)}
          />
          <main className="flex-1">{children}</main>
          <Footer />
          <DevTierSwitcher />
        </div>
      </SubscriptionTierProvider>
    </LoginRequiredProvider>
  );
}
