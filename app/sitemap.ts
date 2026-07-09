import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/immigration",
    "/immigration/visa-bulletin",
    "/immigration/visa-bulletin-movement",
    "/finance",
    "/insurance",
    "/calculators",
    "/calculators/citizenship-eligibility",
    "/calculators/green-card-wait-time",
    "/immigration/h1b-wage-level-estimator",
    "/immigration/h1b-lottery-odds-calculator",
    "/immigration/visa-stamping-wait-map",
    "/about",
    "/privacy",
    "/terms",
    "/contact",
  ];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
