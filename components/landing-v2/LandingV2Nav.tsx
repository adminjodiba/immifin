"use client";

import { useState } from "react";
import { Header } from "@/components/Header";

/**
 * LOCKED /landing-v2 top navigation — approved V7 chrome.
 * Do not modify. Design System nav work belongs on /landing-v3.
 */
export function LandingV2Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Header
      variant="v6Preview"
      mobileMenuOpen={mobileMenuOpen}
      onToggleMenu={() => setMobileMenuOpen((open) => !open)}
    />
  );
}
