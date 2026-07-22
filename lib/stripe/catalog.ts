import "server-only";

import { StripeCatalogError } from "@/lib/stripe/errors";
import type {
  ApprovedStripePriceCatalog,
  ApprovedStripePriceCatalogEntry,
  BillingInterval,
  StripeCatalogEntryKey,
  StripePaidTier,
} from "@/lib/stripe/types";
import { BILLING_INTERVALS } from "@/lib/stripe/types";

const CATALOG_DEFINITIONS: readonly {
  key: StripeCatalogEntryKey;
  tier: StripePaidTier;
  interval: BillingInterval;
  envName: string;
  label: string;
}[] = [
  {
    key: "pro_month",
    tier: "pro",
    interval: "month",
    envName: "STRIPE_PRICE_PRO_MONTHLY",
    label: "Pro Monthly",
  },
  {
    key: "pro_year",
    tier: "pro",
    interval: "year",
    envName: "STRIPE_PRICE_PRO_ANNUAL",
    label: "Pro Annual",
  },
  {
    key: "power_month",
    tier: "power",
    interval: "month",
    envName: "STRIPE_PRICE_POWER_MONTHLY",
    label: "Power Monthly",
  },
  {
    key: "power_year",
    tier: "power",
    interval: "year",
    envName: "STRIPE_PRICE_POWER_ANNUAL",
    label: "Power Annual",
  },
];

let cachedCatalog: ApprovedStripePriceCatalog | null = null;

function readPriceIdFromEnv(envName: string): string | null {
  const value = process.env[envName]?.trim();
  return value ? value : null;
}

function buildCatalog(): ApprovedStripePriceCatalog {
  const entries: ApprovedStripePriceCatalogEntry[] = [];
  const missing: string[] = [];

  for (const definition of CATALOG_DEFINITIONS) {
    const priceId = readPriceIdFromEnv(definition.envName);

    if (!priceId) {
      missing.push(`${definition.label} (${definition.envName})`);
      continue;
    }

    if (!priceId.startsWith("price_")) {
      throw new StripeCatalogError(
        `Invalid Stripe price configuration for ${definition.label}.`,
      );
    }

    entries.push({
      key: definition.key,
      tier: definition.tier,
      interval: definition.interval,
      priceId,
      currency: "usd",
    });
  }

  if (missing.length > 0) {
    throw new StripeCatalogError(
      `Missing approved Stripe price configuration: ${missing.join(", ")}.`,
    );
  }

  const byKey = Object.fromEntries(
    entries.map((entry) => [entry.key, entry]),
  ) as Record<StripeCatalogEntryKey, ApprovedStripePriceCatalogEntry>;

  const byPriceId = Object.fromEntries(
    entries.map((entry) => [entry.priceId, entry]),
  ) as Record<string, ApprovedStripePriceCatalogEntry>;

  return {
    entries,
    byKey,
    byPriceId,
  };
}

/**
 * Returns the trusted server-side Stripe price catalog.
 * Lazy-validates STRIPE_PRICE_* env vars on first access.
 */
export function getApprovedStripePriceCatalog(): ApprovedStripePriceCatalog {
  if (!cachedCatalog) {
    cachedCatalog = buildCatalog();
  }

  return cachedCatalog;
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return (
    typeof value === "string" &&
    (BILLING_INTERVALS as readonly string[]).includes(value)
  );
}

export function isStripePaidTier(value: unknown): value is StripePaidTier {
  return value === "pro" || value === "power";
}

/**
 * Resolves a trusted Stripe Price ID from tier + billing interval.
 * Rejects arbitrary browser-supplied Price IDs.
 */
export function resolveApprovedStripePriceId(
  tier: StripePaidTier,
  interval: BillingInterval,
): string {
  const catalog = getApprovedStripePriceCatalog();
  const key = `${tier}_${interval === "month" ? "month" : "year"}` as StripeCatalogEntryKey;
  const entry = catalog.byKey[key];

  if (!entry) {
    throw new StripeCatalogError("No approved Stripe price exists for that plan.");
  }

  return entry.priceId;
}

/**
 * Validates that a Stripe Price ID is in the approved catalog.
 */
export function assertApprovedStripePriceId(priceId: string): ApprovedStripePriceCatalogEntry {
  const normalized = priceId.trim();
  const catalog = getApprovedStripePriceCatalog();
  const entry = catalog.byPriceId[normalized];

  if (!entry) {
    throw new StripeCatalogError("Stripe Price ID is not in the approved catalog.");
  }

  return entry;
}
