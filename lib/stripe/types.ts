import type { SubscriptionTier } from "@/lib/subscription/tiers";

/** Paid tiers represented in Stripe — Free is application-managed only. */
export type StripePaidTier = Exclude<SubscriptionTier, "free">;

export const BILLING_INTERVALS = ["month", "year"] as const;

export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export type StripeCatalogEntryKey =
  | "pro_month"
  | "pro_year"
  | "power_month"
  | "power_year";

export type ApprovedStripePriceCatalogEntry = {
  key: StripeCatalogEntryKey;
  tier: StripePaidTier;
  interval: BillingInterval;
  priceId: string;
};

export type ApprovedStripePriceCatalog = {
  entries: readonly ApprovedStripePriceCatalogEntry[];
  byKey: Readonly<Record<StripeCatalogEntryKey, ApprovedStripePriceCatalogEntry>>;
  byPriceId: Readonly<Record<string, ApprovedStripePriceCatalogEntry>>;
};
