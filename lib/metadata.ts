import type { Metadata } from "next";
import { siteConfig } from "./site";

type MetadataProps = {
  title?: string;
  description?: string;
  path?: string;
};

export function createMetadata({
  title,
  description = siteConfig.description,
  path = "",
}: MetadataProps = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const url = `${siteConfig.url}${path}`;

  return {
    title: pageTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
