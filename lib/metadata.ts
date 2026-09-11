import type { Metadata } from "next";
import { siteConfig } from "./site";

type MetadataProps = {
  title?: string;
  description?: string;
  path?: string;
  /** Full document title; skips the root layout `| Immifin` template. */
  absoluteTitle?: boolean;
};

export function createMetadata({
  title,
  description = siteConfig.description,
  path = "",
  absoluteTitle = false,
}: MetadataProps = {}): Metadata {
  const url = `${siteConfig.url}${path}`;
  const brandedOnce = title ? `${title} | ${siteConfig.name}` : siteConfig.title;
  const socialTitle = absoluteTitle && title ? title : brandedOnce;
  const documentTitle =
    absoluteTitle && title
      ? { absolute: title }
      : title
        ? title
        : { absolute: siteConfig.title };

  return {
    title: documentTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: socialTitle,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
