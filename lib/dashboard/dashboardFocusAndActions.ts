import type { EmploymentJourneyData } from "@/lib/dashboard/employmentJourney";
import type { GreenCardJourneyData } from "@/lib/dashboard/journeyDates";

export type DashboardJourneyStage = "employment" | "green_card";

export type FocusBadge = "Recommended" | "Current" | "Waiting" | "Coming Soon";

export type TodaysFocus = {
  id: string;
  focusTitle: string;
  message: string;
  badge: FocusBadge;
  ctaLabel?: string;
  ctaHref?: string;
};

export type DashboardActionItem = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  comingSoon?: boolean;
  locked?: boolean;
  tier?: "Pro" | "Power";
};

export const ACTION_CENTER_SUBTITLE = "More ways IMMIFIN can help";

const employmentActions: DashboardActionItem[] = [
  {
    id: "visa-bulletin-dashboard",
    title: "Visa Bulletin Dashboard",
    description: "Check this month's cutoff dates for your category.",
    href: "/immigration/visa-bulletin",
  },
  {
    id: "gc-wait-calculator",
    title: "GC Wait Calculator",
    description: "Estimate wait time based on historical movement.",
    href: "/calculators/green-card-wait-time",
  },
  {
    id: "citizenship-calculator",
    title: "Citizenship Calculator",
    description: "Plan ahead for naturalization eligibility.",
    href: "/calculators/citizenship-eligibility",
  },
  {
    id: "movement-tracker",
    title: "Movement Tracker",
    description: "Track month-over-month bulletin changes.",
    href: "/immigration/visa-bulletin-movement",
    locked: true,
    tier: "Pro",
  },
  {
    id: "priority-date-alerts",
    title: "Set Priority Date Alert",
    description: "Get notified when your date becomes current.",
    href: "/user-profile",
    locked: true,
    tier: "Pro",
  },
  {
    id: "history-trends",
    title: "View History & Trends",
    description: "Explore long-term bulletin patterns.",
    href: "/immigration/visa-bulletin-history",
    locked: true,
    tier: "Pro",
  },
  {
    id: "update-profile",
    title: "Update Profile",
    description: "Keep your immigration details current.",
    href: "/user-profile#/immigration",
  },
];

const greenCardActions: DashboardActionItem[] = [
  {
    id: "citizenship-calculator",
    title: "Citizenship Calculator",
    description: "Review eligibility dates and filing windows.",
    href: "/calculators/citizenship-eligibility",
  },
  {
    id: "update-profile",
    title: "Update Profile",
    description: "Update Green Card date and personal details.",
    href: "/user-profile#/immigration",
  },
  {
    id: "travel-planning",
    title: "Travel History / Travel Planning",
    description: "Organize trips for your N-400 application.",
    comingSoon: true,
  },
  {
    id: "tax-planning",
    title: "Tax Planning",
    description: "Plan your tax strategy as a permanent resident.",
    comingSoon: true,
  },
  {
    id: "insurance-planning",
    title: "Insurance Planning",
    description: "Protect your family as your life stage evolves.",
    comingSoon: true,
  },
  {
    id: "n400-preparation",
    title: "N-400 Preparation",
    description: "Review documents and requirements before you apply.",
    comingSoon: true,
  },
];

const FOCUS_EXCLUDED_ACTION_IDS: Record<string, string[]> = {
  "prepare-i485": ["visa-bulletin-dashboard"],
  "track-movement": ["visa-bulletin-dashboard"],
  "complete-profile": ["update-profile"],
  "prepare-n400": ["citizenship-calculator"],
  "n400-window-open": ["citizenship-calculator"],
};

export function resolveEmploymentTodaysFocus(journey: EmploymentJourneyData): TodaysFocus {
  const { datesForFiling, finalAction } = journey;

  if (datesForFiling.status === "unavailable" && finalAction.status === "unavailable") {
    return {
      id: "complete-profile",
      focusTitle: "Complete or Check Your Profile",
      message:
        "We need your category, country, and priority date to personalize your dashboard.",
      badge: "Recommended",
      ctaLabel: "Update Profile",
      ctaHref: "/user-profile#/immigration",
    };
  }

  if (datesForFiling.isPositive) {
    return {
      id: "prepare-i485",
      focusTitle: "Prepare for I-485 Filing",
      message:
        "Your Dates for Filing chart has reached your Priority Date. Review this month's USCIS filing guidance before taking action.",
      badge: "Current",
      ctaLabel: "Open Visa Bulletin",
      ctaHref: "/immigration/visa-bulletin",
    };
  }

  return {
    id: "track-movement",
    focusTitle: "Track Monthly Movement",
    message:
      "Your Priority Date is still waiting for Visa Bulletin movement. IMMIFIN will help you monitor progress each month.",
    badge: "Waiting",
    ctaLabel: "View Visa Bulletin",
    ctaHref: "/immigration/visa-bulletin",
  };
}

export function resolveGreenCardTodaysFocus(journey: GreenCardJourneyData): TodaysFocus {
  if (journey.eligibilityStatus === "not_eligible_yet") {
    return {
      id: "prepare-n400",
      focusTitle: "Prepare for N-400",
      message:
        "You are approaching your earliest N-400 filing window. Start organizing travel history, tax records, and residence history.",
      badge: "Recommended",
      ctaLabel: "Open Citizenship Calculator",
      ctaHref: "/calculators/citizenship-eligibility",
    };
  }

  return {
    id: "n400-window-open",
    focusTitle: "N-400 Filing Window Open",
    message:
      "You may now be within your earliest naturalization filing window, subject to continued eligibility.",
    badge: "Current",
    ctaLabel: "Open Citizenship Calculator",
    ctaHref: "/calculators/citizenship-eligibility",
  };
}

export function getDashboardActionCenterItems(
  journeyStage: DashboardJourneyStage,
  focusId: string,
): DashboardActionItem[] {
  const allActions = journeyStage === "green_card" ? greenCardActions : employmentActions;
  const excludedIds = new Set(FOCUS_EXCLUDED_ACTION_IDS[focusId] ?? []);

  return allActions.filter((action) => !excludedIds.has(action.id));
}
