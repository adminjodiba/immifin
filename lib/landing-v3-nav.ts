import { BILLING_CENTER_PATH } from "@/lib/billing/billing-center";
import type { PremiumNavPreviewKey } from "@/lib/premium-nav-preview";

/**
 * Canonical Design System 2.0 navigation data.
 * Used by Header `v3Ds` (/landing-v3) and Header `ds2` (opted-in product routes).
 * Do not use on locked /landing-v2 or /landing-v7.
 */

export const landingV3NavLinks = [
  { href: "/landing-v3", label: "Home" },
  { href: "/immigration", label: "Immigration", hasDropdown: true },
  { href: "/finance", label: "Finance" },
  { href: "/life", label: "Life" },
  { href: "/user-profile", label: "My Immifin", isMyImmifin: true },
  { href: "/about", label: "About", hasDropdown: true },
] as const;

export type LandingV3TierLabel = "Pro" | "Power";

export type LandingV3ImmigrationIcon = "bulletin" | "tools" | "services";

export type LandingV3ImmigrationLink = {
  href: string;
  label: string;
  description?: string;
  premiumPreview?: PremiumNavPreviewKey;
  tierLabel?: LandingV3TierLabel;
};

export type LandingV3ImmigrationSection = {
  id: string;
  label: string;
  description: string;
  icon: LandingV3ImmigrationIcon;
  items: readonly LandingV3ImmigrationLink[];
};

export const landingV3ImmigrationSections: readonly LandingV3ImmigrationSection[] = [
  {
    id: "visa-bulletin",
    label: "Visa Bulletin",
    description: "Track monthly priority-date movement and stay informed.",
    icon: "bulletin",
    items: [
      {
        href: "/immigration/visa-bulletin",
        label: "Current Visa Bulletin",
        description: "Filing and final action dates",
      },
      {
        href: "/immigration/visa-bulletin-history",
        label: "Visa Bulletin History",
        description: "Historical cutoff-date trends",
        premiumPreview: "visaHistory",
      },
      {
        href: "/immigration/visa-bulletin-movement",
        label: "Movement Tracker",
        description: "Month-over-month date movement",
        premiumPreview: "movementTracker",
      },
    ],
  },
  {
    id: "tools",
    label: "Tools & Calculators",
    description: "Plan and estimate your immigration journey.",
    icon: "tools",
    items: [
      {
        href: "/calculators/green-card-wait-time",
        label: "Green Card Wait Calculator",
        description: "Estimate wait from your priority date",
      },
      {
        href: "/calculators/citizenship-eligibility",
        label: "Citizenship Eligibility Calculator",
        description: "Check naturalization timing",
      },
      {
        href: "/immigration/h1b-wage-level-estimator",
        label: "H-1B Salary Estimator",
        description: "Estimate likely wage level",
      },
      {
        href: "/immigration/h1b-lottery-odds-calculator",
        label: "H-1B Lottery Odds",
        description: "Estimate lottery odds",
      },
    ],
  },
  {
    id: "visa-services",
    label: "Visa Services",
    description: "Practical tools for visa-related planning.",
    icon: "services",
    items: [
      {
        href: "/immigration/visa-stamping-wait-map",
        label: "Visa Stamping Wait Map",
        description: "Compare appointment wait times",
      },
      {
        href: "/intelligence",
        label: "IMMIFIN AI Advisor",
        description: "Ask immigration questions using your saved IMMIFIN profile and context.",
        premiumPreview: "intelligence",
        tierLabel: "Power",
      },
    ],
  },
] as const;

export type LandingV3MyImmifinIcon = "journey" | "billing" | "alerts";

export type LandingV3MyImmifinLeafIcon =
  | "dashboard"
  | "profile"
  | "card"
  | "upgrade"
  | "notifications";

export type LandingV3MyImmifinLink = {
  href: string;
  label: string;
  description: string;
  icon: LandingV3MyImmifinLeafIcon;
  premiumPreview?: PremiumNavPreviewKey;
  tierLabel?: LandingV3TierLabel;
};

export type LandingV3MyImmifinSection = {
  id: string;
  label: string;
  description: string;
  icon: LandingV3MyImmifinIcon;
  items: readonly LandingV3MyImmifinLink[];
};

export const landingV3MyImmifinSections: readonly LandingV3MyImmifinSection[] = [
  {
    id: "my-journey",
    label: "My Journey",
    description: "Access and manage your immigration journey in one place.",
    icon: "journey",
    items: [
      {
        href: "/dashboard",
        label: "Immigration Dashboard",
        description: "Your key dates, progress and insights.",
        icon: "dashboard",
        premiumPreview: "dashboard",
        tierLabel: "Pro",
      },
      {
        href: "/user-profile",
        label: "Manage Profile",
        description: "Manage your immigration information and profile.",
        icon: "profile",
      },
    ],
  },
  {
    id: "plan-billing",
    label: "Plan & Billing",
    description: "Manage your plan, billing and premium features.",
    icon: "billing",
    items: [
      {
        href: BILLING_CENTER_PATH,
        label: "Billing Center",
        description: "View plan details and manage billing.",
        icon: "card",
      },
      {
        href: "/pricing",
        label: "View Plans",
        description: "Unlock more features with Pro or Power.",
        icon: "upgrade",
      },
    ],
  },
  {
    id: "alerts-preferences",
    label: "Alerts & Preferences",
    description: "Stay informed with notifications and personalized updates.",
    icon: "alerts",
    items: [
      {
        href: "/user-profile#/notifications",
        label: "Notification Preferences",
        description: "Manage your email and Visa Bulletin update preferences.",
        icon: "notifications",
      },
    ],
  },
];
