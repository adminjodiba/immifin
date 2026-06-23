export type Guide = {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  category: "immigration" | "finance";
};

export const immigrationGuides: Guide[] = [
  {
    slug: "h1b-visa-guide",
    title: "Complete H-1B Visa Guide for 2025",
    description:
      "Everything you need to know about eligibility, the lottery process, and employer sponsorship.",
    readTime: "12 min read",
    category: "immigration",
  },
  {
    slug: "green-card-pathways",
    title: "Green Card Pathways Explained",
    description:
      "Compare employment-based, family-based, and diversity lottery routes to permanent residency.",
    readTime: "15 min read",
    category: "immigration",
  },
  {
    slug: "opt-stem-extension",
    title: "OPT & STEM Extension Guide",
    description:
      "Maximize your Optional Practical Training period and understand STEM OPT requirements.",
    readTime: "8 min read",
    category: "immigration",
  },
  {
    slug: "citizenship-naturalization",
    title: "U.S. Citizenship & Naturalization",
    description:
      "Step-by-step guide to becoming a U.S. citizen, from eligibility to the oath ceremony.",
    readTime: "10 min read",
    category: "immigration",
  },
];

export const financeGuides: Guide[] = [
  {
    slug: "building-credit",
    title: "Building Credit as a New Immigrant",
    description:
      "Start from zero credit history with secured cards, credit-builder loans, and smart habits.",
    readTime: "9 min read",
    category: "finance",
  },
  {
    slug: "tax-filing-immigrants",
    title: "Tax Filing for Immigrants",
    description:
      "Understand resident vs. non-resident status, ITINs, and common deductions for newcomers.",
    readTime: "11 min read",
    category: "finance",
  },
  {
    slug: "investing-basics",
    title: "Investing Basics in America",
    description:
      "Open brokerage accounts, understand 401(k)s and IRAs, and start building wealth.",
    readTime: "10 min read",
    category: "finance",
  },
  {
    slug: "banking-for-immigrants",
    title: "Banking for Immigrants",
    description:
      "Choose the right bank, open accounts without SSN, and avoid common fees.",
    readTime: "7 min read",
    category: "finance",
  },
];
