/**
 * Landing Page V2 preview content.
 * Capabilities and plan language must stay aligned with live routes and BUSINESS_MODEL.md.
 */

export type LandingV2CapabilityIcon =
  | "bulletin"
  | "greencard"
  | "citizenship"
  | "h1b"
  | "stamping"
  | "lottery";

export type LandingV2Capability = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  icon: LandingV2CapabilityIcon;
  iconClassName: string;
};

/**
 * Simulation-style Explore cards wired to real IMMIFIN routes.
 * Six distinct destinations — no invented pages, no duplicate hrefs.
 */
export const landingV2ExploreCapabilities: readonly LandingV2Capability[] = [
  {
    title: "Current Visa Bulletin",
    description: "Check the latest Visa Bulletin and priority dates from the U.S. Department of State.",
    href: "/immigration/visa-bulletin",
    ctaLabel: "Check Now",
    icon: "bulletin",
    iconClassName: "bg-blue-600 text-white",
  },
  {
    title: "Green Card Wait",
    description: "Estimate your green card wait time based on your priority date and category.",
    href: "/calculators/green-card-wait-time",
    ctaLabel: "Check Now",
    icon: "greencard",
    iconClassName: "bg-teal-600 text-white",
  },
  {
    title: "Citizenship",
    description: "Check eligibility requirements and prepare for your U.S. citizenship journey.",
    href: "/calculators/citizenship-eligibility",
    ctaLabel: "Learn More",
    icon: "citizenship",
    iconClassName: "bg-violet-600 text-white",
  },
  {
    title: "H-1B Tools",
    description: "Estimate likely H-1B wage level from role, location, salary, experience, and education.",
    href: "/immigration/h1b-wage-level-estimator",
    ctaLabel: "Explore",
    icon: "h1b",
    iconClassName: "bg-orange-500 text-white",
  },
  {
    title: "Visa Stamping",
    description: "Find interview wait times across embassies and consulates for visa stamping.",
    href: "/immigration/visa-stamping-wait-map",
    ctaLabel: "Explore",
    icon: "stamping",
    iconClassName: "bg-blue-700 text-white",
  },
  {
    title: "H-1B Lottery Odds",
    description: "Estimate H-1B lottery odds using wage level and U.S. master’s cap eligibility.",
    href: "/immigration/h1b-lottery-odds-calculator",
    ctaLabel: "Explore",
    icon: "lottery",
    iconClassName: "bg-indigo-600 text-white",
  },
];

export const landingV2JourneyPoints = [
  {
    title: "Start with a Free account",
    description:
      "Create a Free IMMIFIN account to use the core immigration tools available today — including the Current Visa Bulletin and the public calculators.",
  },
  {
    title: "Save your immigration journey",
    description:
      "Pro can save your immigration profile so IMMIFIN can personalize the experience around your case, including priority-date tracking.",
  },
  {
    title: "Deeper tracking on Pro and Power",
    description:
      "Pro and Power add deeper tracking and personalization — such as bulletin history, movement tracking, and a personalized dashboard — according to your plan.",
  },
] as const;

export const landingV2TrustPoints = [
  {
    title: "Trusted & Transparent",
    description:
      "IMMIFIN tools are informational. We explain what a result is based on and do not present ourselves as a government agency or as legal advice.",
  },
  {
    title: "Privacy First",
    description:
      "We collect only what we need to operate the product, respond to you, and improve the experience. We do not sell your personal information.",
  },
  {
    title: "Clarity in Complexity",
    description:
      "U.S. immigration information is scattered and easy to misread. IMMIFIN exists to help you see where you stand in clearer terms.",
  },
  {
    title: "Built for Immigrants",
    description:
      "The long-term mission is Immigration, Finance & Life in America. Today we are starting with U.S. immigration tools and insights.",
  },
] as const;
