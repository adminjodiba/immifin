export type Calculator = {
  slug: string;
  title: string;
  description: string;
  category: "immigration" | "finance" | "tax";
  featured?: boolean;
};

export const calculators: Calculator[] = [
  {
    slug: "visa-wait-time",
    title: "Visa Wait Time Estimator",
    description:
      "Estimate processing times for common visa categories based on current USCIS data.",
    category: "immigration",
    featured: true,
  },
  {
    slug: "green-card-priority-date",
    title: "Green Card Priority Date Calculator",
    description:
      "Check how your priority date compares to the latest visa bulletin cutoffs.",
    category: "immigration",
    featured: true,
  },
  {
    slug: "tax-residency",
    title: "Tax Residency Calculator",
    description:
      "Determine your U.S. tax residency status using the substantial presence test.",
    category: "tax",
    featured: true,
  },
  {
    slug: "mortgage-affordability",
    title: "Mortgage Affordability Calculator",
    description:
      "Estimate how much home you can afford based on income, debt, and down payment.",
    category: "finance",
    featured: true,
  },
  {
    slug: "credit-score-builder",
    title: "Credit Score Builder Planner",
    description:
      "Create a personalized plan to build credit history as a new immigrant.",
    category: "finance",
  },
  {
    slug: "401k-contribution",
    title: "401(k) Contribution Calculator",
    description:
      "Optimize your retirement contributions and see long-term growth projections.",
    category: "finance",
  },
  {
    slug: "h1b-lottery-odds",
    title: "H-1B Lottery Odds Estimator",
    description:
      "Understand your chances in the annual H-1B cap lottery based on registration data.",
    category: "immigration",
  },
  {
    slug: "fica-exemption",
    title: "FICA Exemption Calculator",
    description:
      "Check if you qualify for a Social Security and Medicare tax exemption.",
    category: "tax",
  },
];

export function getFeaturedCalculators() {
  return calculators.filter((c) => c.featured);
}
