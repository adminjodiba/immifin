import type { PremiumNavPreviewKey } from "@/lib/premium-nav-preview";

/**
 * Immigration top-nav configuration (S7-UI-008 / S7-UI-008B / S7-UI-008C).
 * Grouped by topic; H-1B labels use Immigration naming (Estimator / Odds).
 */

export type ImmigrationMenuLink = {
  href: string;
  label: string;
  description: string;
  premiumPreview?: PremiumNavPreviewKey;
};

export type ImmigrationMenuSection = {
  id: string;
  label: string;
  items: readonly ImmigrationMenuLink[];
};

export const immigrationMenuSections: readonly ImmigrationMenuSection[] = [
  {
    id: "visa-bulletin",
    label: "Visa Bulletin",
    items: [
      {
        href: "/immigration/visa-bulletin",
        label: "📊 Current Visa Bulletin",
        description: "Live employment-based filing and final action dates",
      },
      {
        href: "/immigration/visa-bulletin-history",
        label: "🗂️ Visa Bulletin History",
        description: "Historical trends, charts, and cutoff-date analysis",
        premiumPreview: "visaHistory",
      },
      {
        href: "/immigration/visa-bulletin-movement",
        label: "📈 Movement Tracker",
        description: "Month-over-month visa bulletin date movement",
        premiumPreview: "movementTracker",
      },
    ],
  },
  {
    id: "h1b-tools",
    label: "H-1B Tools",
    items: [
      {
        href: "/immigration/h1b-wage-level-estimator",
        label: "💼 H-1B Salary Estimator",
        description: "Estimate likely H-1B wage level from role, location, and salary",
      },
      {
        href: "/immigration/h1b-lottery-odds-calculator",
        label: "🎲 H-1B Lottery Odds",
        description: "Estimate lottery odds using wage level and master's cap eligibility",
      },
    ],
  },
  {
    id: "visa-services",
    label: "Visa Services",
    items: [
      {
        href: "/immigration/visa-stamping-wait-map",
        label: "🌍 Global Visa Stamping Map",
        description: "Compare approximate U.S. visa appointment wait times worldwide",
      },
    ],
  },
] as const;

/** Flat list for pages/index views that do not need section headings. */
export const immigrationMenuLinks: ImmigrationMenuLink[] =
  immigrationMenuSections.flatMap((section) => [...section.items]);
