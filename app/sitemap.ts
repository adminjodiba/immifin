import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

/**
 * Public, crawlable, canonical URLs only (S7A-SEO-003 / S7A-SEO-VB-002).
 * 15 URLs. lastModified is omitted: request-time `new Date()` is not a real content-change date.
 */
const PUBLIC_SITEMAP_PATHS = [
  "",
  "/pricing",
  "/calculators",
  "/calculators/citizenship-eligibility",
  "/calculators/green-card-wait-time",
  "/immigration/h1b-wage-level-estimator",
  "/immigration/h1b-lottery-odds-calculator",
  "/immigration/visa-stamping-wait-map",
  "/immigration/visa-bulletin",
  "/about",
  "/about/what-users-say",
  "/privacy",
  "/terms",
  "/contact",
  "/life",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_PATHS.map((route) => ({
    url: `${siteConfig.url}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
