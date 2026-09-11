"use client";

import { useState } from "react";
import { Header } from "@/components/Header";

/**
 * /landing-v3 Design System working nav.
 * Uses V6 chrome with the approved DS 2.0 menu. Does not change V2/V7.
 */
export function LandingV3Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Header
      variant="v3Ds"
      mobileMenuOpen={mobileMenuOpen}
      onToggleMenu={() => setMobileMenuOpen((open) => !open)}
    />
  );
}
