export type PublicArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  href: string;
};

/** First real public IMMIFIN article. Not the placeholder cards on `/`. */
export const WHY_WE_BUILT_IMMIFIN: PublicArticle = {
  slug: "why-we-built-immifin",
  title: "Why We Built IMMIFIN",
  excerpt:
    "IMMIFIN exists to bring greater clarity to life in America — starting with trusted U.S. immigration tools and insights.",
  date: "2026-08-29",
  href: "/articles/why-we-built-immifin",
};

export function formatPublicArticleDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
