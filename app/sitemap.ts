import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { listPublicVisaBulletinCombinations } from "@/lib/visaBulletinPublicSlugs";

/**
 * Public, crawlable, canonical URLs only (S7A-SEO-VB-DYNAMIC-005).
 * 14 static marketing/calculator URLs + 15 public Visa Bulletin search pages = 29.
 * The private Current Visa Bulletin Dashboard is not listed.
 * lastModified is omitted: request-time `new Date()` is not a real content-change date.
 */
const PUBLIC_SITEMAP_STATIC_PATHS = [
  "",
  "/pricing",
  "/calculators",
  "/calculators/citizenship-eligibility",
  "/calculators/green-card-wait-time",
  "/immigration/h1b-wage-level-estimator",
  "/immigration/h1b-lottery-odds-calculator",
  "/immigration/visa-stamping-wait-map",
  "/about",
  "/about/what-users-say",
  "/privacy",
  "/terms",
  "/contact",
  "/life",
] as const;

export function listPublicSitemapPaths(): string[] {
  return [
    ...PUBLIC_SITEMAP_STATIC_PATHS,
    ...listPublicVisaBulletinCombinations().map((combination) => combination.canonicalPath),
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return listPublicSitemapPaths().map((route) => ({
    url: `${siteConfig.url}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
