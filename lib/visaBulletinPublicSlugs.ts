/**
 * Canonical public Visa Bulletin category/country slugs.
 * Used later by generateStaticParams, sitemap, metadata, and the public answer layer.
 *
 * Invalid lookalikes (eb-2, EB2, row, canada) are never silently accepted.
 */

export const PUBLIC_VISA_BULLETIN_PATH_PREFIX = "/immigration/visa-bulletin";

export const PUBLIC_VISA_BULLETIN_CATEGORY_SLUGS = ["eb1", "eb2", "eb3"] as const;

export const PUBLIC_VISA_BULLETIN_COUNTRY_SLUGS = [
  "india",
  "china",
  "mexico",
  "philippines",
  "rest-of-the-world",
] as const;

export type PublicVisaBulletinCategorySlug =
  (typeof PUBLIC_VISA_BULLETIN_CATEGORY_SLUGS)[number];

export type PublicVisaBulletinCountrySlug =
  (typeof PUBLIC_VISA_BULLETIN_COUNTRY_SLUGS)[number];

export type PublicVisaBulletinCategoryConfig = {
  slug: PublicVisaBulletinCategorySlug;
  /** Employment category key used with findMatchingVisaBulletinRow / categoryMatchKey. */
  matchKey: "EB1" | "EB2" | "EB3";
  displayLabel: "EB-1" | "EB-2" | "EB-3";
};

export type PublicVisaBulletinCountryConfig = {
  slug: PublicVisaBulletinCountrySlug;
  /** Sheet country value passed to normalizeSheetCountry / findMatchingVisaBulletinRow. */
  matchValue: string;
  displayLabel: string;
};

export type PublicVisaBulletinCombination = {
  categorySlug: PublicVisaBulletinCategorySlug;
  countrySlug: PublicVisaBulletinCountrySlug;
  canonicalPath: string;
};

const CATEGORY_CONFIG: Record<
  PublicVisaBulletinCategorySlug,
  PublicVisaBulletinCategoryConfig
> = {
  eb1: { slug: "eb1", matchKey: "EB1", displayLabel: "EB-1" },
  eb2: { slug: "eb2", matchKey: "EB2", displayLabel: "EB-2" },
  eb3: { slug: "eb3", matchKey: "EB3", displayLabel: "EB-3" },
};

const COUNTRY_CONFIG: Record<
  PublicVisaBulletinCountrySlug,
  PublicVisaBulletinCountryConfig
> = {
  india: { slug: "india", matchValue: "India", displayLabel: "India" },
  china: { slug: "china", matchValue: "China", displayLabel: "China" },
  mexico: { slug: "mexico", matchValue: "Mexico", displayLabel: "Mexico" },
  philippines: {
    slug: "philippines",
    matchValue: "Philippines",
    displayLabel: "Philippines",
  },
  "rest-of-the-world": {
    slug: "rest-of-the-world",
    matchValue: "Rest of the World",
    displayLabel: "Rest of the World",
  },
};

function isExactAllowlistValue<T extends string>(
  value: string,
  allowlist: readonly T[],
): value is T {
  return (allowlist as readonly string[]).includes(value);
}

export function isPublicVisaBulletinCategorySlug(
  value: string,
): value is PublicVisaBulletinCategorySlug {
  return isExactAllowlistValue(value, PUBLIC_VISA_BULLETIN_CATEGORY_SLUGS);
}

export function isPublicVisaBulletinCountrySlug(
  value: string,
): value is PublicVisaBulletinCountrySlug {
  return isExactAllowlistValue(value, PUBLIC_VISA_BULLETIN_COUNTRY_SLUGS);
}

export function getPublicVisaBulletinCategoryConfig(
  slug: string,
): PublicVisaBulletinCategoryConfig | null {
  if (!isPublicVisaBulletinCategorySlug(slug)) {
    return null;
  }

  return CATEGORY_CONFIG[slug];
}

export function getPublicVisaBulletinCountryConfig(
  slug: string,
): PublicVisaBulletinCountryConfig | null {
  if (!isPublicVisaBulletinCountrySlug(slug)) {
    return null;
  }

  return COUNTRY_CONFIG[slug];
}

export function getPublicVisaBulletinCanonicalPath(
  categorySlug: string,
  countrySlug: string,
): string | null {
  if (
    !isPublicVisaBulletinCategorySlug(categorySlug) ||
    !isPublicVisaBulletinCountrySlug(countrySlug)
  ) {
    return null;
  }

  return `${PUBLIC_VISA_BULLETIN_PATH_PREFIX}/${categorySlug}/${countrySlug}`;
}

export function listPublicVisaBulletinCombinations(): PublicVisaBulletinCombination[] {
  const combinations: PublicVisaBulletinCombination[] = [];

  for (const categorySlug of PUBLIC_VISA_BULLETIN_CATEGORY_SLUGS) {
    for (const countrySlug of PUBLIC_VISA_BULLETIN_COUNTRY_SLUGS) {
      combinations.push({
        categorySlug,
        countrySlug,
        canonicalPath: `${PUBLIC_VISA_BULLETIN_PATH_PREFIX}/${categorySlug}/${countrySlug}`,
      });
    }
  }

  return combinations;
}

/** Parameter pairs for a future generateStaticParams() call. */
export function listPublicVisaBulletinStaticParams(): Array<{
  category: PublicVisaBulletinCategorySlug;
  country: PublicVisaBulletinCountrySlug;
}> {
  return listPublicVisaBulletinCombinations().map((combination) => ({
    category: combination.categorySlug,
    country: combination.countrySlug,
  }));
}
