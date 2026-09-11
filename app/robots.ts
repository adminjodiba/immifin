import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/landing-v2", "/landing-v3", "/landing-v7"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
