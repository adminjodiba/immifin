"use client";

import { useState } from "react";
import { LoginRequiredProvider } from "@/components/auth/LoginRequiredProvider";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <LoginRequiredProvider>
      <div className="flex min-h-screen flex-col">
        <Header
          mobileMenuOpen={mobileMenuOpen}
          onToggleMenu={() => setMobileMenuOpen((open) => !open)}
        />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </LoginRequiredProvider>
  );
}
