"use client";

import { useState } from "react";
import { Header } from "@/components/Header";

/** Restored approved Landing V7 chrome — same as locked /landing-v2. */
export function LandingV7Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Header
      variant="v6Preview"
      mobileMenuOpen={mobileMenuOpen}
      onToggleMenu={() => setMobileMenuOpen((open) => !open)}
    />
  );
}
