export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: "immigration" | "finance";
};

export const articles: Article[] = [
  {
    slug: "uscis-processing-times-2025",
    title: "USCIS Processing Times: What to Expect in 2025",
    excerpt:
      "A breakdown of current processing delays across popular visa and green card categories.",
    date: "2025-06-15",
    category: "immigration",
  },
  {
    slug: "itin-vs-ssn",
    title: "ITIN vs. SSN: Which Do You Need?",
    excerpt:
      "Understand the difference between Individual Taxpayer Identification Numbers and Social Security Numbers.",
    date: "2025-06-10",
    category: "finance",
  },
  {
    slug: "eb2-niw-updates",
    title: "EB-2 NIW: Recent Policy Updates",
    excerpt:
      "How the National Interest Waiver category is evolving and what it means for applicants.",
    date: "2025-06-05",
    category: "immigration",
  },
  {
    slug: "roth-ira-immigrants",
    title: "Roth IRA Strategies for Immigrants",
    excerpt:
      "Tax-advantaged retirement savings options available to visa holders and green card holders.",
    date: "2025-05-28",
    category: "finance",
  },
];

export function formatArticleDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
