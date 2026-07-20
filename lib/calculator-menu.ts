/**
 * Calculators top-nav configuration (S7-UI-008 / S7-UI-008B).
 * Cross-links H-1B tools that also live under Immigration for discovery.
 * Calculator context uses Calculator naming (not Estimator / Odds).
 */

export type CalculatorMenuLink = {
  href: string;
  label: string;
  description: string;
};

export type CalculatorMenuSection = {
  id: string;
  label: string;
  items: readonly CalculatorMenuLink[];
};

export const calculatorMenuSections: readonly CalculatorMenuSection[] = [
  {
    id: "immigration",
    label: "Immigration",
    items: [
      {
        href: "/calculators/green-card-wait-time",
        label: "🧮 Green Card Wait Calculator",
        description: "Compare your priority date to the latest Visa Bulletin cutoffs",
      },
      {
        href: "/calculators/citizenship-eligibility",
        label: "🧮 Citizenship Calculator",
        description: "Estimate when you may apply for U.S. citizenship",
      },
      {
        href: "/immigration/h1b-wage-level-estimator",
        label: "🧮 H-1B Salary Calculator",
        description: "Estimate likely H-1B wage level from role, location, and salary",
      },
      {
        href: "/immigration/h1b-lottery-odds-calculator",
        label: "🧮 H-1B Lottery Calculator",
        description: "Estimate lottery odds using wage level and master's cap eligibility",
      },
    ],
  },
] as const;

/** Flat list for simple consumers. */
export const calculatorMenuLinks: CalculatorMenuLink[] =
  calculatorMenuSections.flatMap((section) => [...section.items]);
