import { LandingV3Hero } from "@/components/landing-v3/LandingV3Hero";
import { LandingV3ProductShowcase } from "@/components/landing-v3/LandingV3ProductShowcase";

/**
 * Approved Landing V3 body — announcement/nav stay in the route chrome.
 * Used by production `/` and preview `/landing-v3`.
 */
export function LandingV3PageContent() {
  return (
    <div className="flex flex-col bg-white">
      <LandingV3Hero />
      <LandingV3ProductShowcase />
    </div>
  );
}
